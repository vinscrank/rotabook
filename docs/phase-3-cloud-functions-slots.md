# Fase 3 — Cloud Function `createSlot` (solo admin)

## Obiettivo

Creare la prima vera Cloud Function di business: `createSlot`.

Al termine di questa fase un utente con `role: "admin"` potra creare uno slot prenotabile nella collezione `availability_slots`, mentre utenti normali e staff riceveranno errore.

**Tu esegui tutti i comandi.** Il frontend non si tocca ancora.

**Prerequisito:** Fase 2 completata:

- `createUserProfile` deployata
- almeno un utente Auth con documento `users/{uid}`
- almeno un utente con `role: "admin"` in Firestore

**Progetto:** `rotabook-99ebd` | **Regione:** `europe-west1`

---

## Teoria — Perche serve una Function per creare slot

Potresti far scrivere direttamente il frontend in `availability_slots`, perche le rules gia dicono:

```
allow write: if isAdmin();
```

Pero per imparare backend serio conviene mettere la logica in Cloud Functions:

```
Frontend / Console test
      │
      v
createSlot callable function
      ├── controlla login
      ├── controlla ruolo admin
      ├── valida campi
      ├── crea availability_slots/{slotId}
      └── ritorna { success, slotId }
```

**Spirito critico:** per una CRUD semplice, le Firestore Rules potrebbero bastare. Ma RotaBook e un progetto portfolio backend: vogliamo dimostrare validazione server-side, gestione errori e separazione della logica business dal client.

---

## Teoria — Callable Function

Una **Callable Function** e una Cloud Function pensata per essere chiamata da app Firebase:

```typescript
const createSlot = httpsCallable(functions, "createSlot");
await createSlot({ title, serviceName, date, startTime, endTime, capacity });
```

Rispetto a una function HTTP tipo `health`, una callable:

| | HTTP `onRequest` | Callable `onCall` |
|--|------------------|-------------------|
| Chiamata | `fetch` / browser / curl | Firebase SDK |
| Auth | devi leggere token manualmente | `request.auth` gia pronto |
| Errori | status HTTP manuali | `HttpsError` standard |
| Uso tipico | health check, webhook | azioni app protette |

In questa fase usi `onCall` perche `createSlot` richiede utente loggato e ruolo admin.

---

## Struttura file al termine della Fase 3

```
functions/src/
├── admin.ts
├── index.ts
├── auth/
│   └── onUserCreated.ts
├── slots/
│   └── createSlot.ts
└── utils/
    ├── auth.ts
    └── validators.ts
```

I file `utils/` sono importanti: li riuserai in Fase 4 (`createBooking`) e Fase 5 (`createStaffShift`) senza duplicare logica.

---

## Passo 1 — Crea `utils/auth.ts`

Crea il file:

```
functions/src/utils/auth.ts
```

Contenuto:

```typescript
import { HttpsError } from "firebase-functions/v2/https";
import { admin } from "../admin";

export async function requireAdmin(uid: string): Promise<void> {
  const userDoc = await admin.firestore().collection("users").doc(uid).get();

  if (!userDoc.exists) {
    throw new HttpsError("permission-denied", "User profile not found");
  }

  const role = userDoc.data()?.role;

  if (role !== "admin") {
    throw new HttpsError("permission-denied", "Admin role required");
  }
}
```

### Cosa fa

`requireAdmin(uid)` legge `users/{uid}` e controlla `role`.

Se il profilo non esiste o il ruolo non e `admin`, blocca la function con `permission-denied`.

**Perche helper separato?** Perche userai lo stesso controllo in `createSlot`, `updateBookingStatus`, `createStaffShift`. Se lo copi in ogni file, appena cambi la logica admin devi correggere 3-4 punti.

---

## Passo 2 — Crea `utils/validators.ts`

Crea il file:

```
functions/src/utils/validators.ts
```

Contenuto:

```typescript
import { HttpsError } from "firebase-functions/v2/https";

export function assertString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpsError("invalid-argument", `${field} is required`);
  }

  return value.trim();
}

export function assertPositiveInteger(value: unknown, field: string): number {
  if (!Number.isInteger(value) || Number(value) <= 0) {
    throw new HttpsError("invalid-argument", `${field} must be a positive integer`);
  }

  return Number(value);
}

export function assertDateString(value: unknown, field: string): string {
  const date = assertString(value, field);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new HttpsError("invalid-argument", `${field} must use YYYY-MM-DD`);
  }

  return date;
}

export function assertTimeString(value: unknown, field: string): string {
  const time = assertString(value, field);

  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw new HttpsError("invalid-argument", `${field} must use HH:mm`);
  }

  return time;
}

export function assertTimeRange(startTime: string, endTime: string): void {
  if (startTime >= endTime) {
    throw new HttpsError("invalid-argument", "endTime must be after startTime");
  }
}
```

### Cosa fa

Questi validatori trasformano input generici (`unknown`) in dati puliti:

| Funzione | Esempio valido | Errore se |
|----------|----------------|-----------|
| `assertString` | `"Yoga Class"` | stringa vuota |
| `assertPositiveInteger` | `10` | `0`, `-1`, `"10"` |
| `assertDateString` | `2026-07-15` | formato diverso |
| `assertTimeString` | `09:00` | formato diverso |
| `assertTimeRange` | `09:00` → `10:00` | fine prima di inizio |

**Spirito critico:** il regex controlla il formato, non se la data esiste davvero (`2026-99-99` passerebbe). Per un MVP va bene; in produzione useresti una libreria date o validazione piu forte.

---

## Passo 3 — Crea `slots/createSlot.ts`

Crea la cartella e il file:

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook/functions
mkdir -p src/slots src/utils
```

File:

```
functions/src/slots/createSlot.ts
```

Contenuto:

```typescript
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { admin } from "../admin";
import { requireAdmin } from "../utils/auth";
import {
  assertDateString,
  assertPositiveInteger,
  assertString,
  assertTimeRange,
  assertTimeString,
} from "../utils/validators";

export const createSlot = onCall({ region: "europe-west1" }, async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  await requireAdmin(uid);

  const title = assertString(request.data?.title, "title");
  const serviceName = assertString(request.data?.serviceName, "serviceName");
  const date = assertDateString(request.data?.date, "date");
  const startTime = assertTimeString(request.data?.startTime, "startTime");
  const endTime = assertTimeString(request.data?.endTime, "endTime");
  const capacity = assertPositiveInteger(request.data?.capacity, "capacity");

  assertTimeRange(startTime, endTime);

  const slotRef = admin.firestore().collection("availability_slots").doc();

  await slotRef.set({
    title,
    serviceName,
    date,
    startTime,
    endTime,
    capacity,
    bookedCount: 0,
    status: "available",
    createdBy: uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, slotId: slotRef.id };
});
```

---

## Passo 4 — Aggiorna `index.ts`

Apri:

```
functions/src/index.ts
```

Aggiungi import:

```typescript
import { createSlot } from "./slots/createSlot";
```

Alla fine esporta:

```typescript
export { createUserProfile, createSlot };
```

Il file completo diventa:

```typescript
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { createUserProfile } from "./auth/onUserCreated";
import { createSlot } from "./slots/createSlot";

export const health = onRequest({ region: "europe-west1" }, (req, res) => {
  logger.info("health check");
  res.json({ status: "ok", service: "rotabook-functions" });
});

export { createUserProfile, createSlot };
```

---

## Passo 5 — Controlla `package.json`

Apri:

```
functions/package.json
```

Se in Fase 2 hai usato `auth.user().onCreate`, mantieni Node 20:

```json
"engines": {
  "node": "20"
}
```

**Perche:** `createUserProfile` usa un trigger Auth v1, e Gen1 non supporta Node 24. `createSlot` invece e v2 e funzionerebbe anche con Node 24, ma tutto il progetto Functions deve avere un runtime compatibile.

---

## Passo 6 — Compila

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook/functions
npm run build
```

**Risultato atteso:** nessun errore TypeScript.

Se vedi errore su import mancanti, controlla i path:

```typescript
import { admin } from "../admin";
import { requireAdmin } from "../utils/auth";
```

---

## Passo 7 — Deploy Functions

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook
firebase deploy --only functions
```

**Risultato atteso:** nella Console Firebase → Functions vedi:

- `health`
- `createUserProfile`
- `createSlot`

---

## Passo 8 — Test da Firebase Console / Functions Shell

Per testare una **Callable Function** senza frontend, usa la shell Firebase:

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook/functions
npm run shell
```

Poi nella shell:

```javascript
createSlot({
  title: "Morning Yoga",
  serviceName: "Yoga Class",
  date: "2026-07-15",
  startTime: "09:00",
  endTime: "10:00",
  capacity: 10
})
```

**Nota importante:** la shell locale non simula sempre bene `request.auth` per callable v2. Se ricevi `unauthenticated`, non significa per forza che la function sia sbagliata. Il test definitivo sara dal frontend o con un client script autenticato.

Per questa fase, il controllo principale e:

1. build ok
2. deploy ok
3. function visibile in Console
4. nessun errore nei log

---

## Passo 9 — Test manuale Firestore (fallback didattico)

Se vuoi solo verificare lo schema dati mentre non hai ancora il frontend, crea uno slot manualmente in Firestore:

Collezione:

```
availability_slots
```

Campi:

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
| `createdBy` | string | UID admin |
| `createdAt` | timestamp | now |
| `updatedAt` | timestamp | now |

Questo non testa `createSlot`, ma ti aiuta a visualizzare il documento che la Function deve creare.

---

## Cosa impari in questa fase (per il CV)

- **Callable Functions** con `onCall`
- **Role-based backend authorization** (`requireAdmin`)
- **Validazione input server-side**
- **Firestore Admin SDK write**
- **Separazione utilities/business logic**
- **Pattern riutilizzabile per le fasi successive**

---

## Mini-quiz CV

1. **Perche controlliamo admin nella Function se gia ci sono le Security Rules?**  
   Perche la Function usa Admin SDK e bypassa le rules. Quindi deve fare lei i controlli di autorizzazione.

2. **Perche `bookedCount` parte da `0` e non lo riceviamo dal client?**  
   Perche e un dato derivato dal sistema. Il client non deve decidere quante prenotazioni esistono.

3. **Perche `status` parte sempre da `available`?**  
   Uno slot appena creato e prenotabile finche non e pieno o cancellato.

4. **Perche abbiamo creato `validators.ts`?**  
   Per evitare duplicazione. Le stesse regole su stringhe, date, orari e numeri serviranno anche in booking e shifts.

---

## Checkpoint Fase 3

- [ ] `functions/src/utils/auth.ts` creato
- [ ] `functions/src/utils/validators.ts` creato
- [ ] `functions/src/slots/createSlot.ts` creato
- [ ] `functions/src/index.ts` esporta `createSlot`
- [ ] `functions/package.json` usa Node 20 se hai trigger Auth v1
- [ ] `npm run build` ok
- [ ] `firebase deploy --only functions` ok
- [ ] `createSlot` visibile in Firebase Console → Functions
- [ ] Almeno uno slot `availability_slots` presente in Firestore

Quando hai finito, scrivi in chat: **"Fase 3 completata"**.

Passeremo alla **Fase 4**: `createBooking`, `cancelBooking`, `updateBookingStatus` con transazioni Firestore.

---

## Troubleshooting

| Errore | Causa probabile | Soluzione |
|--------|-----------------|-----------|
| `unauthenticated` | Nessun utente loggato nella chiamata callable | Test definitivo dal frontend autenticato |
| `permission-denied` | Utente non admin o doc `users/{uid}` mancante | In Firestore imposta `role: "admin"` |
| `invalid-argument` | Campo mancante o formato sbagliato | Controlla `date`, `startTime`, `endTime`, `capacity` |
| `Runtime "nodejs24" is not supported on GCF Gen1` | Hai `createUserProfile` v1 e Node 24 | Metti `"node": "20"` in `functions/package.json` |
| Function deployata ma slot non creato | Errore runtime | `firebase functions:log --only createSlot` |

---

## Comandi riepilogo

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook/functions
mkdir -p src/slots src/utils
npm run build

cd /Users/vincenzo/Desktop/websites/rotaBook
firebase deploy --only functions
firebase functions:log --only createSlot
```
