# Fase 1 — Progetto Firebase + Firestore produzione + scaffold Cloud Functions

## Obiettivo

Creare il progetto Firebase dedicato allo sviluppo, abilitare Firestore in modalita produzione, definire le 4 collezioni con dati di test, inizializzare la cartella `functions/` con TypeScript e deployare le prime Security Rules. Al termine avrai un backend Firebase funzionante su cui costruire Auth e Cloud Functions nelle fasi successive.

**Progetto attuale:** display name `rotabook-dev`, **Project ID** `rotabook-99ebd` (l'ID lo assegna Firebase alla creazione e va usato negli URL).

**Tu esegui tutti i comandi.** Il frontend Next.js non si tocca ancora.

**Prerequisito:** aver letto [phase-0-firestore-theory.md](./phase-0-firestore-theory.md) (o equivalente).

---

## Teoria — Perche Firestore produzione e non Emulator (subito)

| Opzione | Pro | Contro |
|---------|-----|--------|
| **Firestore produzione** (progetto dev dedicato) | Stesso comportamento del deploy finale; impari indici, regole, console; dati persistenti | Serve connessione internet; attenzione a non committare credenziali |
| **Emulator locale** | Zero rischio cloud; test offline | Setup extra; dati non persistenti; differenze sottili con produzione |

**Scelta per RotaBook:** Firestore **produzione** su progetto dedicato dev. L'Emulator lo userai in Fase 4 per testare Functions senza deploy continuo.

**Spirito critico:** "produzione" qui significa "database cloud reale", non "app live con utenti". Il progetto dev (es. `rotabook-99ebd`) e il tuo sandbox. Quando il portfolio e pronto, creerai un progetto prod separato (Fase 7) con regole piu restrittive.

**Attenzione — Nome vs Project ID:** in Console puoi chiamare il progetto `rotabook-dev`, ma l'**Project ID** (es. `rotabook-99ebd`) e quello negli URL e in `.firebaserc`. Non confonderli.

---

## Teoria — Cosa fa `firebase init`

Il comando `firebase init` crea i file di configurazione che collegano la cartella locale al progetto Firebase:

| File | Ruolo |
|------|-------|
| `.firebaserc` | ID progetto Firebase collegato |
| `firebase.json` | Quali servizi deployare (functions, firestore, hosting) |
| `firestore.rules` | Chi puo leggere/scrivere cosa |
| `firestore.indexes.json` | Indici per query composite |
| `functions/` | Codice Cloud Functions (Node.js + TypeScript) |

---

## Struttura file al termine della Fase 1

```
rotaBook/
├── docs/
├── functions/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .gitignore
│   └── src/
│       └── index.ts
├── .firebaserc
├── .gitignore
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
└── README.md
```

Il frontend (`frontend/`) arrivera nella traccia FE, non ora.

---

## Passo 1 — Prerequisiti sul Mac

Verifica Node.js (serve v20+ per Firebase Functions recenti):

```bash
node -v
```

Se manca o e vecchio:

```bash
brew install node@20
```

Verifica npm:

```bash
npm -v
```

---

## Passo 2 — Installa Firebase CLI

```bash
npm install -g firebase-tools
```

Verifica:

```bash
firebase --version
```

Login (apre il browser):

```bash
firebase login
```

Controlla l'account attivo:

```bash
firebase login:list
```

---

## Passo 3 — Crea il progetto Firebase (Console)

1. Vai su https://console.firebase.google.com
2. Clicca **Add project** (Aggiungi progetto)
3. Nome display: `rotabook-dev` (o come preferisci)
4. Disabilita Google Analytics (non serve per il MVP)
5. Clicca **Create project**
6. Annota il **Project ID** generato (es. `rotabook-99ebd`) — lo trovi anche in Project settings

### Abilita Authentication (preparazione Fase 2)

1. Menu laterale: **Build** → **Authentication**
2. Clicca **Get started**
3. Tab **Sign-in method** → abilita **Email/Password**
4. Salva

### Abilita Firestore

1. Menu laterale: **Build** → **Firestore Database**
2. Clicca **Create database**
3. Scegli **Start in production mode** (non test mode: imparerai le rules subito)
4. Regione: `europe-west1` (Belgio) — la piu vicina all'Italia
5. Clicca **Enable**

**Spirito critico:** "production mode" significa che di default **nessuno** puo leggere/scrivere finche non deployi `firestore.rules`. E corretto: impari la sicurezza da subito.

### Abilita Cloud Functions (preparazione Fase 3)

1. Menu laterale: **Build** → **Functions**
2. Clicca **Get started** e segui il wizard (ti chiede il piano Blaze)

**Nota sul piano Blaze:** Cloud Functions richiedono il piano **Blaze (pay as you go)**. Per un portfolio il costo e praticamente zero (free tier generoso). Senza Blaze non puoi deployare Functions in Fase 3.

---

## Passo 4 — Vai nella cartella del progetto

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook
```

---

## Passo 5 — Inizializza Firebase nel repo

```bash
firebase init
```

Rispondi cosi (usa le frecce e spazio per selezionare):

| Domanda | Risposta |
|---------|----------|
| Which Firebase features? | Spazio su **Firestore**, **Functions** (Hosting lo aggiungi in Fase 7) |
| Use an existing project | **Yes** → seleziona il tuo progetto (es. `rotabook-99ebd`) |
| Firestore rules file | `firestore.rules` (default) |
| Firestore indexes file | `firestore.indexes.json` (default) |
| Functions language | **TypeScript** |
| ESLint | **No** (meno rumore per imparare) |
| Install dependencies | **Yes** |

Se ti chiede di sovrascrivere file esistenti, rispondi **No** (tranne se il file non esiste).

---

## Passo 6 — Collega il progetto (se `.firebaserc` non e corretto)

Apri `.firebaserc` e verifica:

```json
{
  "projects": {
    "default": "rotabook-99ebd"
  }
}
```

Sostituisci `rotabook-99ebd` con il **Project ID** reale (Firebase Console → Project settings → Project ID). Il display name puo essere diverso.

---

## Passo 7 — Crea `.gitignore` nella root

Crea il file `/Users/vincenzo/Desktop/websites/rotaBook/.gitignore`:

```
# Firebase
.firebase/
firebase-debug.log
firestore-debug.log
ui-debug.log

# Functions
functions/node_modules/
functions/lib/
functions/.env

# Env e segreti
.env
.env.local
.env.*.local
serviceAccountKey.json

# OS
.DS_Store

# Frontend (fase futura)
frontend/node_modules/
frontend/.next/
```

**Mai committare** `serviceAccountKey.json` o file `.env` con credenziali.

---

## Passo 8 — Security Rules iniziali (permetti lettura autenticata)

Sostituisci il contenuto di `firestore.rules` con:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn()
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /users/{userId} {
      allow read: if isSignedIn() && (request.auth.uid == userId || isAdmin());
      allow create: if isSignedIn() && request.auth.uid == userId;
      allow update: if isSignedIn() && (request.auth.uid == userId || isAdmin());
    }

    match /availability_slots/{slotId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    match /bookings/{bookingId} {
      allow read: if isSignedIn() && (
        resource.data.userId == request.auth.uid || isAdmin()
      );
      allow write: if false;
    }

    match /staff_shifts/{shiftId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
  }
}
```

**Spirito critico:** `bookings` ha `allow write: if false` perche le scritture passano solo da Cloud Functions (Fase 4). Il frontend non puo creare booking direttamente. Questo e il pattern corretto.

Deploy delle rules:

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook
firebase deploy --only firestore:rules
```

**Risultato atteso:** `Deploy complete!` senza errori.

---

## Passo 9 — Indici Firestore

Sostituisci `firestore.indexes.json` con:

```json
{
  "indexes": [
    {
      "collectionGroup": "availability_slots",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "staff_shifts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "staffId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Deploy indici:

```bash
firebase deploy --only firestore:indexes
```

Gli indici possono impiegare qualche minuto a costruirsi. Controlla in Console → Firestore → Indexes.

---

## Passo 10 — Scaffold Cloud Functions

**Teoria — Regione Functions:** se non specifichi `region`, Firebase deploya in `us-central1` (USA) anche se Firestore e in `europe-west1`. Per RotaBook allineiamo tutto a **Belgio** (`europe-west1`) per ridurre latenza.

Apri `functions/src/index.ts` e sostituisci tutto con:

```typescript
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

export const health = onRequest({ region: "europe-west1" }, (req, res) => {
  logger.info("health check");
  res.json({ status: "ok", service: "rotabook-functions" });
});
```

Verifica `functions/package.json` abbia almeno:

```json
{
  "name": "functions",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "deploy": "firebase deploy --only functions"
  },
  "engines": {
    "node": "20"
  },
  "main": "lib/index.js"
}
```

Compila:

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook/functions
npm run build
```

**Risultato atteso:** cartella `functions/lib/` creata senza errori TypeScript.

Deploy della function di test:

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook
firebase deploy --only functions
```

Al termine il terminale mostra l'URL della function, tipo:

```
https://europe-west1-rotabook-99ebd.cloudfunctions.net/health
```

Testa nel browser o con curl (usa il **tuo** Project ID):

```bash
curl https://europe-west1-rotabook-99ebd.cloudfunctions.net/health
```

**Risultato atteso:** `{"status":"ok","service":"rotabook-functions"}`

**Errore comune:** URL con display name (`rotabook-dev`) invece del Project ID (`rotabook-99ebd`) → 404. Oppure regione sbagliata (`us-central1` vs `europe-west1`) se non hai messo `region` nel codice.

---

## Passo 11 — Inserisci dati di test in Firestore (Console)

Vai su Firebase Console → Firestore Database → **Start collection**.

### Collezione `users` — documento manuale (admin di test)

ID documento: un UUID qualsiasi (es. `admin-test-001`) oppure lascia Auto-ID.

| Campo | Tipo | Valore |
|-------|------|--------|
| `id` | string | `admin-test-001` |
| `name` | string | `Admin Test` |
| `email` | string | `admin@rotabook.test` |
| `role` | string | `admin` |
| `createdAt` | timestamp | now |
| `updatedAt` | timestamp | now |

> In Fase 2 collegherai questo profilo a un vero account Firebase Auth. Per ora e solo seed.

### Collezione `availability_slots` — 2 slot di test

**Documento 1:**

| Campo | Tipo | Valore |
|-------|------|--------|
| `title` | string | `Morning Yoga` |
| `serviceName` | string | `Yoga Class` |
| `date` | string | `2026-07-15` |
| `startTime` | string | `09:00` |
| `endTime` | string | `10:00` |
| `capacity` | number | `10` |
| `bookedCount` | number | `0` |
| `status` | string | `available` |
| `createdBy` | string | `admin-test-001` |
| `createdAt` | timestamp | now |
| `updatedAt` | timestamp | now |

**Documento 2:**

| Campo | Tipo | Valore |
|-------|------|--------|
| `title` | string | `Evening Pilates` |
| `serviceName` | string | `Pilates` |
| `date` | string | `2026-07-15` |
| `startTime` | string | `18:00` |
| `endTime` | string | `19:00` |
| `capacity` | number | `5` |
| `bookedCount` | number | `0` |
| `status` | string | `available` |
| `createdBy` | string | `admin-test-001` |
| `createdAt` | timestamp | now |
| `updatedAt` | timestamp | now |

### Collezione `staff_shifts` — 1 turno di test

| Campo | Tipo | Valore |
|-------|------|--------|
| `staffId` | string | `staff-test-001` |
| `staffName` | string | `Marco Rossi` |
| `date` | string | `2026-07-15` |
| `startTime` | string | `08:00` |
| `endTime` | string | `14:00` |
| `role` | string | `instructor` |
| `createdAt` | timestamp | now |
| `updatedAt` | timestamp | now |

La collezione `bookings` resta **vuota** (si popola in Fase 4).

---

## Passo 12 — Verifica da terminale (opzionale ma utile)

Installa temporaneamente il SDK admin per uno script di verifica (lo rimuoverai dopo):

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook/functions
npm install firebase-admin --save-dev
```

Crea `functions/scripts/verify-firestore.ts`:

```typescript
import * as admin from "firebase-admin";

admin.initializeApp({ projectId: "rotabook-99ebd" });

async function main() {
  const slots = await admin.firestore().collection("availability_slots").get();
  console.log("Slots:", slots.size);
  slots.forEach((doc) => console.log(" -", doc.id, doc.data().title));
}

main().catch(console.error);
```

Esegui (richiede `gcloud auth application-default login` oppure salta questo passo e verifica solo dalla Console):

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook/functions
npx ts-node scripts/verify-firestore.ts
```

**Alternativa piu semplice:** verifica solo dalla Console Firestore che vedi 1 user, 2 slot, 1 shift, 0 booking.

---

## Passo 13 — Inizializza Git (opzionale ma consigliato)

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook
git init
git add .
git status
```

Verifica che **non** compaiano `node_modules/`, `.env`, `serviceAccountKey.json`.

```bash
git commit -m "$(cat <<'EOF'
Setup Firebase project with Firestore schema and functions scaffold.

EOF
)"
```

---

## Cosa impari in questa fase (per il CV)

- **Firebase CLI**: `firebase init`, `firebase deploy`, gestione progetto cloud
- **Firestore NoSQL**: collezioni, documenti, tipi nativi (timestamp, string, number)
- **Security Rules**: regole base per ruolo, blocco write su booking
- **Cloud Functions v2**: deploy function HTTP, regione `europe-west1`
- **Indici compositi**: per query su `status + date`, `userId + createdAt`
- **Progetto dev separato**: sandbox cloud senza sporcare produzione

---

## Mini-quiz CV

1. **Perche `bookings` ha `allow write: if false` nelle rules?**
   Perche solo le Cloud Functions devono creare/modificare booking, con validazione su capacity e duplicati. Il frontend non e trusted.

2. **Differenza tra Firestore "test mode" e "production mode" alla creazione?**
   Test mode: lettura/scrittura aperta per 30 giorni (pericoloso). Production mode: tutto bloccato finche non scrivi rules esplicite.

3. **Perche servono gli indici compositi?**
   Firestore permette query su un solo campo senza indice. Query con piu campi (`where status == X order by date`) richiedono un indice composito.

4. **Cosa fa la function `health`?**
   Endpoint HTTP per verificare che il deploy Functions funzioni. Pattern identico a `GET /health` in FastAPI/Spring.

---

## Checkpoint Fase 1

Segna completata la fase solo se tutti questi punti sono veri:

- [ ] Progetto Firebase dev creato (annota il **Project ID**, es. `rotabook-99ebd`)
- [ ] Authentication (Email/Password) abilitata
- [ ] Firestore attivo in `europe-west1`
- [ ] Piano Blaze attivo (per Functions future)
- [ ] `firebase init` completato (Firestore + Functions TypeScript)
- [ ] `firebase deploy --only firestore:rules` ok
- [ ] `firebase deploy --only firestore:indexes` ok
- [ ] `firebase deploy --only functions` ok e `curl` su `https://europe-west1-rotabook-99ebd.cloudfunctions.net/health` risponde `{"status":"ok",...}`
- [ ] In Console: 1 documento in `users`, 2 in `availability_slots`, 1 in `staff_shifts`, 0 in `bookings`
- [ ] `.gitignore` esclude segreti e `node_modules`

Quando hai finito, scrivi in chat: **"Fase 1 completata"** (senza incollare API key).

Passeremo alla **Fase 2**: Auth trigger per creare profilo utente in Firestore dopo registrazione.

---

## Troubleshooting

| Errore | Causa probabile | Soluzione |
|--------|-----------------|-----------|
| `Firebase CLI vX is incompatible` | Node troppo vecchio | `brew install node@20` |
| `HTTP Error: 403, Permission denied` | Non loggato o progetto sbagliato | `firebase login` + controlla `.firebaserc` |
| `Cloud Functions requires billing` | Piano Spark attivo | Passa a Blaze in Console → Usage and billing |
| `Missing permissions on service account` | Primo deploy Functions | Attendi 2-3 minuti e riprova |
| Deploy rules ok ma lettura fallisce | Nessun utente autenticato | Normale: le rules richiedono auth. In Fase 2 risolvi con login |
| `Index not found` su query | Indice non ancora pronto | Console → Firestore → Indexes, attendi stato "Enabled" |
| `functions/lib not found` | Build non eseguita | `cd functions && npm run build` |
| `404` su URL `/health` | Project ID o regione sbagliati | Usa Project ID da `.firebaserc` + `europe-west1` |
| Deploy blocca per `health(us-central1)` | Hai cambiato regione nel codice | `firebase functions:delete health --region us-central1 --force` poi rideploy |

---

## Comandi riepilogo (copia-incolla sequenza)

```bash
# Prerequisiti
node -v
npm install -g firebase-tools
firebase login

# Init progetto
cd /Users/vincenzo/Desktop/websites/rotaBook
firebase init

# Deploy
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
cd functions && npm run build && cd ..
firebase deploy --only functions

# Test health
curl https://europe-west1-rotabook-99ebd.cloudfunctions.net/health
```

Sostituisci `rotabook-99ebd` con il Project ID del tuo `.firebaserc`.
