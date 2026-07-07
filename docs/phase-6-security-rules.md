# Fase 6 — Firestore Security Rules definitive (admin / staff / user)

## Obiettivo

Chiudere la sicurezza del backend: definire **chi puo leggere e scrivere cosa** in Firestore, per ruolo.

Al termine di questa fase avrai rules production-style che proteggono:

- profili utente
- slot
- booking
- turni staff

**Tu esegui tutti i comandi.** Il frontend non si tocca ancora.

**Prerequisito:** Fasi 2-5 completate (Auth, Functions, collezioni popolate).

**Progetto:** `rotabook-99ebd` | **Regione:** `europe-west1`

---

## Teoria — Rules vs Cloud Functions

| Layer | Cosa protegge | Chi lo bypassa |
|-------|----------------|----------------|
| **Security Rules** | Letture/scritture dal **client** (frontend) | Admin SDK nelle Cloud Functions |
| **Cloud Functions** | Logica business e validazione server-side | Nessuno (se scritte bene) |

```
Frontend ──read/listen──> Firestore Rules ──> allow / deny
Frontend ──callable──────> Cloud Functions ──> Admin SDK write
```

**Spirito critico:** le rules **non** proteggono le Cloud Functions. Se una function non controlla il ruolo, un utente autenticato potrebbe abusarne. Per questo in Fase 3-5 hai messo `requireAdmin` dentro le functions.

Le rules servono per:
- listener realtime dal frontend (`onSnapshot`)
- eventuali letture dirette
- bloccare scritture client pericolose

---

## Teoria — I 3 ruoli (matrice permessi)

| Risorsa | user | staff | admin |
|---------|------|-------|-------|
| `users/{proprio}` | read, update (no role) | come user | read tutti, update tutti |
| `availability_slots` | read | read | read (+ write bloccato client) |
| `bookings` propri | read | read se assegnato | read tutti |
| `bookings` write client | no | no | no |
| `staff_shifts` propri | no | read | read tutti |

**Scritture critiche** (booking, slot, turni): solo Cloud Functions.

---

## Cosa miglioriamo rispetto alle rules attuali

Le rules della Fase 1 vanno bene come base, ma ora le rendiamo piu strette:

1. **`isStaff()`** — helper per ruolo staff
2. **`staff_shifts`** — staff legge solo i propri turni (non tutti)
3. **`bookings`** — staff legge booking assegnati (`staffId`)
4. **`users` update** — utente **non** puo cambiarsi il `role` da solo
5. **`availability_slots` / `staff_shifts` write** — blocco write client (`false`), perche create/update passano da Functions

---

## Passo 1 — Sostituisci `firestore.rules`

Apri `firestore.rules` e sostituisci tutto con:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function userDoc() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isAdmin() {
      return isSignedIn() && userDoc().role == 'admin';
    }

    function isStaff() {
      return isSignedIn() && userDoc().role == 'staff';
    }

    match /users/{userId} {
      allow read: if isSignedIn() && (request.auth.uid == userId || isAdmin());
      allow create: if false;
      allow update: if isAdmin() || (
        isSignedIn()
        && request.auth.uid == userId
        && request.resource.data.role == resource.data.role
      );
    }

    match /availability_slots/{slotId} {
      allow read: if isSignedIn();
      allow write: if false;
    }

    match /bookings/{bookingId} {
      allow read: if isSignedIn() && (
        resource.data.userId == request.auth.uid
        || resource.data.staffId == request.auth.uid
        || isAdmin()
      );
      allow write: if false;
    }

    match /staff_shifts/{shiftId} {
      allow read: if isSignedIn() && (
        isAdmin()
        || (isStaff() && resource.data.staffId == request.auth.uid)
      );
      allow write: if false;
    }
  }
}
```

---

## Passo 2 — Leggi le rules riga per riga

### `userDoc()` e `isStaff()`

```
function userDoc() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
}
```

Legge il profilo dell'utente loggato per sapere il ruolo. Usato da `isAdmin()` e `isStaff()`.

**Costo:** ogni rule che chiama `get()` costa 1 lettura Firestore. Per un MVP va bene.

---

### `users` — blocco cambio ruolo

```
allow update: if isAdmin() || (
  isSignedIn()
  && request.auth.uid == userId
  && request.resource.data.role == resource.data.role
);
```

| Chi | Cosa puo |
|-----|----------|
| Admin | Aggiorna qualsiasi utente (anche `role`) |
| User/Staff | Aggiorna solo il proprio profilo, **ma non puo cambiare `role`** |

**Spirito critico:** senza `request.resource.data.role == resource.data.role`, un utente malintenzionato potrebbe fare update del proprio documento e impostarsi `role: "admin"` dal frontend.

---

### `availability_slots` — read sì, write no

```
allow read: if isSignedIn();
allow write: if false;
```

Tutti i loggati vedono gli slot (pagina `/book`). Creazione solo via `createSlot` (Admin SDK).

---

### `bookings` — read per owner, staff assegnato, admin

```
allow read: if isSignedIn() && (
  resource.data.userId == request.auth.uid
  || resource.data.staffId == request.auth.uid
  || isAdmin()
);
allow write: if false;
```

- **user:** vede solo i propri booking
- **staff:** vede booking dove `staffId` e il suo UID (Fase FE: `/staff/bookings`)
- **admin:** vede tutto

---

### `staff_shifts` — staff vede solo i propri

```
allow read: if isSignedIn() && (
  isAdmin()
  || (isStaff() && resource.data.staffId == request.auth.uid)
);
allow write: if false;
```

Un utente `user` normale **non** legge i turni staff. Solo staff (propri) e admin.

---

## Passo 3 — Deploy rules

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook
firebase deploy --only firestore:rules
```

**Risultato atteso:** `Deploy complete!` senza errori di compilazione.

---

## Passo 4 — Test con Rules Playground (Console)

1. Firebase Console → **Firestore** → tab **Regole** / **Rules**
2. Clicca **Rules Playground** (o simulatore regole)
3. Simula operazioni:

### Test 1 — User legge proprio booking

| Campo | Valore |
|-------|--------|
| Tipo | `get` |
| Path | `/bookings/BOOKING_ID` |
| Auth UID | UID del proprietario booking |
| Documento | `userId` = stesso UID |

**Atteso:** Allow

### Test 2 — User legge booking altrui

Stesso test ma Auth UID diverso da `userId`.

**Atteso:** Deny

### Test 3 — User prova a cambiarsi role

| Campo | Valore |
|-------|--------|
| Tipo | `update` |
| Path | `/users/USER_UID` |
| Auth UID | stesso USER_UID |
| `resource.data.role` | `user` |
| `request.resource.data.role` | `admin` |

**Atteso:** Deny

### Test 4 — Staff legge proprio turno

| Campo | Valore |
|-------|--------|
| Tipo | `get` |
| Path | `/staff_shifts/SHIFT_ID` |
| Auth UID | UID staff |
| Documento | `staffId` = stesso UID, profilo users con `role: staff` |

**Atteso:** Allow

### Test 5 — Write diretta su bookings

| Campo | Valore |
|-------|--------|
| Tipo | `create` |
| Path | `/bookings/new-id` |

**Atteso:** Deny (anche se autenticato)

---

## Passo 5 — Verifica coerenza con Cloud Functions

Le functions continuano a funzionare perche usano **Admin SDK** (bypass rules).

| Function | Scrive su | Rules client |
|----------|-----------|--------------|
| `createUserProfile` | `users` | `create: false` (ok, Admin SDK) |
| `createSlot` | `availability_slots` | `write: false` (ok) |
| `createBooking` | `bookings` + slot | `write: false` (ok) |
| `cancelBooking` | `bookings` + slot | `write: false` (ok) |
| `createStaffShift` | `staff_shifts` | `write: false` (ok) |

**Doppia protezione:** function valida ruolo + rules bloccano client.

---

## Cosa impari in questa fase (per il CV)

- **Role-based access control (RBAC)** in Firestore Security Rules
- **`get()` nelle rules** per leggere ruolo da `users`
- **`resource.data` vs `request.resource.data`** (lettura vs scrittura)
- **Blocco privilege escalation** (user non cambia `role`)
- **Rules Playground** per test senza frontend
- **Defense in depth** (Rules + Cloud Functions)

---

## Mini-quiz CV

1. **Perche `bookings` ha `allow write: if false`?**
   Perche create/cancel/update passano da Cloud Functions con validazione su capacity e permessi.

2. **Perche controlliamo il ruolo sia nelle rules sia nelle functions?**
   Rules proteggono accesso client diretto. Functions proteggono endpoint callable (Admin SDK bypassa rules).

3. **Cosa impedisce a un user di diventare admin?**
   La rule `request.resource.data.role == resource.data.role` su update del proprio profilo.

4. **Perche staff non legge tutti i `staff_shifts`?**
   Privacy e principio del minimo privilegio: vede solo i propri turni.

---

## Checkpoint Fase 6

- [ ] `firestore.rules` aggiornato con `isStaff()` e regole finali
- [ ] `firebase deploy --only firestore:rules` ok
- [ ] Rules Playground: user non legge booking altrui → Deny
- [ ] Rules Playground: user non cambia `role` → Deny
- [ ] Rules Playground: staff legge proprio turno → Allow
- [ ] Rules Playground: create su `bookings` → Deny
- [ ] Cloud Functions ancora funzionanti (deploy precedente ok)

Quando hai finito, scrivi in chat: **"Fase 6 completata"**.

Passeremo alla **Fase 7**: deploy finale e README portfolio.

---

## Troubleshooting

| Errore | Causa probabile | Soluzione |
|--------|-----------------|-----------|
| `Error compiling rules` | Sintassi sbagliata | Controlla parentesi e `;` |
| `get()` permission denied in simulator | Doc `users/{uid}` mancante | Crea profilo utente prima del test |
| Frontend non legge slot | Utente non loggato | Auth obbligatoria (`isSignedIn`) |
| Admin non legge tutto | `role` non e `admin` in Firestore | Verifica documento `users` |
| Function ok ma client bloccato | Normale | Client usa read/listen; write via callable |

---

## Comandi riepilogo

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook
firebase deploy --only firestore:rules
```

Poi testa dal **Rules Playground** in Console Firebase.
