# Fase 2 — Firebase Auth + profilo utente automatico

## Obiettivo

Collegare **Firebase Authentication** a **Firestore**: quando un utente si registra, una Cloud Function crea automaticamente il documento `users/{uid}` con ruolo `user`. Al termine avrai il flusso auth → profilo funzionante, testabile dalla Console senza frontend.

**Tu esegui tutti i comandi.** Il frontend Next.js arriva nella traccia FE (Fase F1).

**Prerequisito:** Fase 1 completata (Auth email/password abilitata, Firestore attivo, Functions deployate).

**Progetto:** `rotabook-99ebd` | **Regione:** `europe-west1`

---

## Teoria — Firebase Auth vs documento Firestore

Sono due cose separate che lavorano insieme:

| | Firebase Auth | Firestore `users` |
|--|---------------|-------------------|
| Cosa memorizza | Credenziali login (email, password hash, UID) | Profilo applicativo (nome, ruolo, timestamp) |
| Chi lo gestisce | Firebase Auth SDK / Console | Il tuo codice (Cloud Function) |
| UID | Generato da Auth (`kR3x9abc...`) | Usato come **ID del documento** |

**Spirito critico:** Auth sa *chi sei* (identita). Firestore sa *cosa puoi fare* (ruolo `admin`/`staff`/`user`). Il ruolo **non** va in Auth Custom Claims nel MVP: resta in Firestore e le Security Rules lo leggono.

---

## Teoria — Auth Trigger (`auth.user().onCreate`)

```
Utente si registra (email/password)
        │
        v
Firebase Auth crea account + UID
        │
        v
Cloud Function createUserProfile (auth.user().onCreate)
        │
        v
Firestore: users/{uid} creato con role: "user"
```

La function usa **Admin SDK** → bypassa le Security Rules (e va bene: e codice server trusted).

**Perche non creare il profilo dal frontend?**
- Il client potrebbe impostarsi `role: "admin"` da solo
- Con `allow create: if false` sulle rules, solo il backend puo creare `users`

---

## Flusso registrazione (MVP)

```
Register form (Fase FE futura)
    → createUserWithEmailAndPassword()
    → Auth trigger crea users/{uid}
    → redirect /book
```

Per ora testi dalla **Firebase Console** (Aggiungi utente) senza frontend.

---

## Struttura file al termine della Fase 2

```
functions/src/
├── admin.ts                 init Firebase Admin SDK
├── index.ts                 export health + createUserProfile
└── auth/
    └── onUserCreated.ts     trigger creazione profilo
```

---

## Passo 1 — Crea i file (gia nel repo se hai fatto pull)

### `functions/src/admin.ts`

```typescript
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export { admin };
```

### `functions/src/auth/onUserCreated.ts`

```typescript
import * as functions from "firebase-functions/v1";
import * as logger from "firebase-functions/logger";
import { FieldValue } from "firebase-admin/firestore";
import { admin } from "../admin";

export const createUserProfile = functions
  .region("europe-west1")
  .auth.user()
  .onCreate(async (user) => {
    const { uid, email, displayName } = user;
    const name = displayName?.trim() || email?.split("@")[0] || "User";

    await admin.firestore().collection("users").doc(uid).set({
      id: uid,
      name,
      email: email ?? "",
      role: "user",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info("User profile created", { uid, email });
  });
```

**Nota:** usiamo `firebase-functions/v1` per `auth.user().onCreate`. In firebase-functions v7 non esiste piu `onUserCreated` in v2/identity (c'e solo `beforeUserCreated`, che e bloccante e diversa).

### `functions/src/index.ts`

```typescript
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { createUserProfile } from "./auth/onUserCreated";

export const health = onRequest({ region: "europe-west1" }, (req, res) => {
  logger.info("health check");
  res.json({ status: "ok", service: "rotabook-functions" });
});

export { createUserProfile };
```

---

## Passo 2 — Aggiorna Security Rules

In `firestore.rules`, su `users`, il `create` dal client va **bloccato** (solo la Function crea profili):

```
match /users/{userId} {
  allow read: if isSignedIn() && (request.auth.uid == userId || isAdmin());
  allow create: if false;
  allow update: if isSignedIn() && (request.auth.uid == userId || isAdmin());
}
```

Deploy rules:

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook
firebase deploy --only firestore:rules
```

---

## Passo 3 — Compila e deploy Functions

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook/functions
npm run build
```

**Risultato atteso:** nessun errore TypeScript.

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook
firebase deploy --only functions
```

**Risultato atteso:** deploy di `health` e `createUserProfile` in `europe-west1`.

---

## Passo 4 — Crea un utente di test (Console Auth)

1. Firebase Console → **Authentication** → **Users**
2. Clicca **Add user** / **Aggiungi utente**
3. Email: `test@rotabook.test`
4. Password: scegli una password di test (es. `Test1234!`)
5. Salva

**Cosa succede dietro le quinte:** Firebase Auth crea l'account → scatta `createUserProfile` → compare `users/{uid}` in Firestore.

Attendi 5-10 secondi, poi controlla Firestore.

---

## Passo 5 — Verifica in Firestore

1. Console → **Firestore Database**
2. Collezione `users`
3. Cerca un documento il cui **ID** corrisponde all'UID dell'utente Auth (lo vedi in Authentication → Users → colonna User UID)

**Risultato atteso:**

| Campo | Valore |
|-------|--------|
| `id` | stesso UID Auth |
| `name` | `test` (da parte prima dell'@) |
| `email` | `test@rotabook.test` |
| `role` | `user` |
| `createdAt` | timestamp |
| `updatedAt` | timestamp |

---

## Passo 6 — Verifica i log della Function

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook
firebase functions:log --only createUserProfile
```

Oppure Console → **Functions** → `createUserProfile` → **Logs**.

Cerca: `User profile created` con `uid` e `email`.

---

## Passo 7 — Promuovi un utente ad admin (manuale, MVP)

Per il MVP l'admin si assegna a mano in Firestore (non dal client):

1. Firestore → `users` → documento dell'utente admin (o quello seed della Fase 1)
2. Modifica campo `role` → `admin`
3. Salva

**Spirito critico:** in produzione useresti Custom Claims o un pannello admin protetto. Per il portfolio, modifica manuale in Console e sufficiente.

---

## Passo 8 — Secondo utente staff (opzionale)

Ripeti Passo 4 con `staff@rotabook.test`, poi in Firestore cambia `role` da `user` a `staff`.

Così in Fase 5-6 avrai gia i 3 ruoli per testare le rules.

---

## Cosa impari in questa fase (per il CV)

- **Firebase Auth**: identita utente, UID, email/password
- **Auth Triggers**: `auth.user().onCreate` per side-effect server-side dopo registrazione
- **Admin SDK**: scrittura Firestore trusted dal backend
- **Separazione Auth / profilo**: credenziali vs dati applicativi
- **Security Rules**: blocco `create` su `users` dal client

---

## Mini-quiz CV

1. **Perche il profilo utente non si crea dal frontend?**
   Perche il client non e trusted: potrebbe impostare `role: "admin"`. La Cloud Function con Admin SDK crea il profilo con ruolo sicuro.

2. **Cos'e l'UID e perche coincide con l'ID del documento Firestore?**
   L'UID e l'identificatore univoco Auth. Usarlo come ID documento evita join e garantisce 1 account = 1 profilo.

3. **Cosa fa `allow create: if false` su `users`?**
   Nessun client puo creare documenti utente. Solo Admin SDK (la Function) puo farlo.

4. **Differenza tra `displayName` e campo `name` in Firestore?**
   `displayName` e in Auth (opzionale). `name` e nel profilo app, copiato/derivato al momento della registrazione.

---

## Checkpoint Fase 2

- [ ] File `admin.ts`, `auth/onUserCreated.ts`, `index.ts` aggiornati
- [ ] `firestore.rules`: `users` con `allow create: if false`
- [ ] `firebase deploy --only firestore:rules` ok
- [ ] `firebase deploy --only functions` ok (`createUserProfile` visibile in Console)
- [ ] Utente `test@rotabook.test` creato in Auth
- [ ] Documento `users/{uid}` creato automaticamente con `role: "user"`
- [ ] Log function: `User profile created`
- [ ] Almeno un utente con `role: "admin"` in Firestore

Quando hai finito, scrivi in chat: **"Fase 2 completata"**.

Passeremo alla **Fase 3**: Cloud Function `createSlot` (solo admin).

---

## Troubleshooting

| Errore | Causa probabile | Soluzione |
|--------|-----------------|-----------|
| Utente Auth creato ma nessun doc Firestore | Trigger non deployata o errore in function | Controlla `firebase functions:log` |
| `Permission denied` su Firestore dal client | Normale: create bloccato | Il profilo lo crea solo la Function |
| Function non parte | Regione diversa | Verifica `region: "europe-west1"` |
| `name` e solo `test` | Nessun displayName in Auth | Normale: deriva da email |
| Doc duplicato admin seed + Auth | Admin Fase 1 non collegato ad Auth | Usa un solo admin: o seed manuale o utente Auth con role admin |
| Deploy Identity error | API Identity non abilitata | Console → Authentication → verifica email/password attivo |

---

## Comandi riepilogo

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook/functions
npm run build

cd /Users/vincenzo/Desktop/websites/rotaBook
firebase deploy --only firestore:rules
firebase deploy --only functions
firebase functions:log --only createUserProfile
```
