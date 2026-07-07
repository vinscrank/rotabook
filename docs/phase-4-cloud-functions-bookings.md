# Fase 4 — Cloud Functions booking (`createBooking`, `cancelBooking`, `updateBookingStatus`)

## Obiettivo

Implementare il cuore del business di RotaBook: le prenotazioni.

Al termine di questa fase:

- un **user** puo prenotare uno slot (`createBooking`)
- un **user** (o admin) puo cancellare una prenotazione (`cancelBooking`)
- un **admin** puo aggiornare lo stato di una prenotazione (`updateBookingStatus`)

**Tu esegui tutti i comandi.** Il frontend non si tocca ancora.

**Prerequisito:** Fase 3 completata:

- `createSlot` deployata
- almeno uno slot in `availability_slots`
- utente `user` e utente `admin` pronti

**Progetto:** `rotabook-99ebd` | **Regione:** `europe-west1`

---

## Teoria — Perche le booking passano da Cloud Functions

Le rules gia bloccano scritture dirette su `bookings`:

```
allow write: if false;
```

Quindi **solo** il backend puo creare/modificare prenotazioni. Questo e fondamentale perche:

1. devi controllare `capacity` e `bookedCount`
2. devi evitare doppie prenotazioni dello stesso utente sullo stesso slot
3. devi aggiornare **slot + booking insieme** (atomicita)

**Spirito critico:** se il frontend scrivesse direttamente, un utente potrebbe bypassare i controlli o creare race condition (due utenti prenotano l'ultimo posto contemporaneamente).

---

## Teoria — Transazione Firestore

Una **transazione** legge e scrive piu documenti come un'unica operazione:

```
TRANSAZIONE createBooking
  ├── leggi availability_slots/{slotId}
  ├── controlla status, capacity, duplicati
  ├── crea bookings/{bookingId}
  └── aggiorna slot.bookedCount (+1) e status se pieno
```

Se qualcosa fallisce a meta, Firestore **annulla tutto**.

| Senza transazione | Con transazione |
|-------------------|-----------------|
| Booking creato ma slot non aggiornato | Tutto o niente |
| Due utenti superano capacity | Uno solo vince, l'altro riceve errore |

---

## Flusso `createBooking`

```
User chiama createBooking({ slotId })
        │
        v
auth? ──no──> unauthenticated
        │
       yes
        │
        v
slot esiste? status available? bookedCount < capacity?
        │
        v
utente ha gia prenotato questo slot? (no pending/confirmed)
        │
        v
TRANSAZIONE: crea booking + incrementa bookedCount
        │
        v
return { success: true, bookingId }
```

---

## Struttura file al termine della Fase 4

```
functions/src/
├── admin.ts
├── index.ts
├── auth/
│   └── onUserCreated.ts
├── slots/
│   └── createSlot.ts
├── bookings/
│   ├── createBooking.ts
│   ├── cancelBooking.ts
│   └── updateBookingStatus.ts
└── utils/
    ├── auth.ts
    └── validators.ts
```

---

## Passo 1 — Estendi `utils/auth.ts`

Aggiungi questa funzione sotto `requireAdmin`:

```typescript
export async function getUserProfile(uid: string) {
  const userDoc = await admin.firestore().collection("users").doc(uid).get();

  if (!userDoc.exists) {
    throw new HttpsError("permission-denied", "User profile not found");
  }

  return userDoc.data() as {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}
```

Serve per leggere `userName` quando crei il booking (denormalizzazione).

---

## Passo 2 — Estendi `utils/validators.ts`

Aggiungi in fondo:

```typescript
const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const;
const ADMIN_BOOKING_STATUSES = ["confirmed", "cancelled", "completed"] as const;

export function assertBookingStatus(value: unknown): (typeof BOOKING_STATUSES)[number] {
  const status = assertString(value, "status");

  if (!BOOKING_STATUSES.includes(status as (typeof BOOKING_STATUSES)[number])) {
    throw new HttpsError("invalid-argument", "Invalid booking status");
  }

  return status as (typeof BOOKING_STATUSES)[number];
}

export function assertAdminBookingStatus(
  value: unknown
): (typeof ADMIN_BOOKING_STATUSES)[number] {
  const status = assertString(value, "status");

  if (!ADMIN_BOOKING_STATUSES.includes(status as (typeof ADMIN_BOOKING_STATUSES)[number])) {
    throw new HttpsError("invalid-argument", "Invalid admin booking status");
  }

  return status as (typeof ADMIN_BOOKING_STATUSES)[number];
}
```

---

## Passo 3 — Crea `bookings/createBooking.ts`

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook/functions
mkdir -p src/bookings
```

File `functions/src/bookings/createBooking.ts`:

```typescript
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { admin } from "../admin";
import { getUserProfile } from "../utils/auth";
import { assertString } from "../utils/validators";

export const createBooking = onCall({ region: "europe-west1" }, async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const slotId = assertString(request.data?.slotId, "slotId");
  const user = await getUserProfile(uid);

  const slotRef = admin.firestore().collection("availability_slots").doc(slotId);
  const bookingRef = admin.firestore().collection("bookings").doc();

  const duplicateQuery = admin
    .firestore()
    .collection("bookings")
    .where("userId", "==", uid)
    .where("slotId", "==", slotId);

  const bookingId = await admin.firestore().runTransaction(async (tx) => {
    const slotSnap = await tx.get(slotRef);

    if (!slotSnap.exists) {
      throw new HttpsError("not-found", "Slot not found");
    }

    const slot = slotSnap.data()!;

    if (slot.status !== "available") {
      throw new HttpsError("failed-precondition", "Slot not available");
    }

    if (slot.bookedCount >= slot.capacity) {
      throw new HttpsError("failed-precondition", "Slot is full");
    }

    const duplicateSnap = await tx.get(duplicateQuery);
    const hasActiveBooking = duplicateSnap.docs.some((doc) => {
      const status = doc.data().status;
      return status === "pending" || status === "confirmed";
    });

    if (hasActiveBooking) {
      throw new HttpsError("already-exists", "Booking already exists for this slot");
    }

    const newBookedCount = slot.bookedCount + 1;
    const newStatus = newBookedCount >= slot.capacity ? "full" : "available";

    tx.set(bookingRef, {
      userId: uid,
      userName: user.name,
      slotId,
      staffId: null,
      serviceName: slot.serviceName,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.update(slotRef, {
      bookedCount: newBookedCount,
      status: newStatus,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return bookingRef.id;
  });

  return { success: true, bookingId };
});
```

---

## Passo 4 — Crea `bookings/cancelBooking.ts`

```typescript
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { admin } from "../admin";
import { requireAdmin } from "../utils/auth";
import { assertString } from "../utils/validators";

export const cancelBooking = onCall({ region: "europe-west1" }, async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  const bookingId = assertString(request.data?.bookingId, "bookingId");
  const bookingRef = admin.firestore().collection("bookings").doc(bookingId);

  await admin.firestore().runTransaction(async (tx) => {
    const bookingSnap = await tx.get(bookingRef);

    if (!bookingSnap.exists) {
      throw new HttpsError("not-found", "Booking not found");
    }

    const booking = bookingSnap.data()!;
    const isOwner = booking.userId === uid;

    let isAdmin = false;
    if (!isOwner) {
      try {
        await requireAdmin(uid);
        isAdmin = true;
      } catch {
        throw new HttpsError("permission-denied", "Not allowed to cancel this booking");
      }
    }

    if (!isOwner && !isAdmin) {
      throw new HttpsError("permission-denied", "Not allowed to cancel this booking");
    }

    if (booking.status === "cancelled" || booking.status === "completed") {
      throw new HttpsError("failed-precondition", "Booking cannot be cancelled");
    }

    const slotRef = admin.firestore().collection("availability_slots").doc(booking.slotId);
    const slotSnap = await tx.get(slotRef);

    tx.update(bookingRef, {
      status: "cancelled",
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (slotSnap.exists) {
      const slot = slotSnap.data()!;
      const newBookedCount = Math.max(0, slot.bookedCount - 1);

      tx.update(slotRef, {
        bookedCount: newBookedCount,
        status: "available",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  });

  return { success: true };
});
```

---

## Passo 5 — Crea `bookings/updateBookingStatus.ts`

```typescript
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { admin } from "../admin";
import { requireAdmin } from "../utils/auth";
import { assertAdminBookingStatus, assertString } from "../utils/validators";

export const updateBookingStatus = onCall({ region: "europe-west1" }, async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  await requireAdmin(uid);

  const bookingId = assertString(request.data?.bookingId, "bookingId");
  const status = assertAdminBookingStatus(request.data?.status);

  const bookingRef = admin.firestore().collection("bookings").doc(bookingId);
  const bookingSnap = await bookingRef.get();

  if (!bookingSnap.exists) {
    throw new HttpsError("not-found", "Booking not found");
  }

  await bookingRef.update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true };
});
```

**Spirito critico:** qui l'admin cambia solo lo **stato** del booking. La logica di capacity (decremento slot) resta in `cancelBooking`. In produzione valuteresti se `updateBookingStatus` con `cancelled` deve aggiornare anche lo slot.

---

## Passo 6 — Aggiorna `index.ts`

```typescript
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { createUserProfile } from "./auth/onUserCreated";
import { createSlot } from "./slots/createSlot";
import { createBooking } from "./bookings/createBooking";
import { cancelBooking } from "./bookings/cancelBooking";
import { updateBookingStatus } from "./bookings/updateBookingStatus";

export const health = onRequest({ region: "europe-west1" }, (req, res) => {
  logger.info("health check");
  res.json({ status: "ok", service: "rotabook-functions" });
});

export {
  createUserProfile,
  createSlot,
  createBooking,
  cancelBooking,
  updateBookingStatus,
};
```

---

## Passo 7 — Indice Firestore per duplicati

Apri `firestore.indexes.json` e aggiungi questo indice (se non c'e gia):

```json
{
  "collectionGroup": "bookings",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "slotId", "order": "ASCENDING" }
  ]
}
```

Deploy:

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook
firebase deploy --only firestore:indexes
```

Attendi che l'indice sia `Enabled` in Console.

---

## Passo 8 — Build e deploy

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook/functions
npm run build

cd /Users/vincenzo/Desktop/websites/rotaBook
firebase deploy --only functions
```

**Risultato atteso:** in Console → Functions vedi anche:

- `createBooking`
- `cancelBooking`
- `updateBookingStatus`

---

## Passo 9 — Test (shell Firebase)

La shell spesso non passa bene `auth` alle callable v2. Se ricevi `401`, non panico: e un limite del test locale.

Comandi utili (una riga, sostituisci UID):

```javascript
createBooking({ data: { slotId: "ID_SLOT" } }, { auth: { uid: "UID_USER" } })
```

```javascript
cancelBooking({ data: { bookingId: "ID_BOOKING" } }, { auth: { uid: "UID_USER" } })
```

```javascript
updateBookingStatus({ data: { bookingId: "ID_BOOKING", status: "confirmed" } }, { auth: { uid: "UID_ADMIN" } })
```

Se la shell continua a dare `auth: MISSING`, considera la Fase 4 completata quando:

1. build ok
2. deploy ok
3. verifichi manualmente in Firestore dopo un test riuscito **oppure** aspetti il frontend (Fase FE)

---

## Passo 10 — Verifica in Firestore

Dopo `createBooking` riuscita:

### Collezione `bookings` — nuovo documento

| Campo | Valore atteso |
|-------|----------------|
| `userId` | UID utente |
| `userName` | nome da `users` |
| `slotId` | ID slot prenotato |
| `status` | `pending` |
| `serviceName`, `date`, `startTime`, `endTime` | copiati dallo slot |

### Collezione `availability_slots` — slot aggiornato

| Campo | Prima | Dopo 1 booking |
|-------|-------|----------------|
| `bookedCount` | `0` | `1` |
| `status` | `available` | `available` o `full` se capacity raggiunta |

Dopo `cancelBooking`:

| Campo | Valore |
|-------|--------|
| booking `status` | `cancelled` |
| slot `bookedCount` | decrementato |
| slot `status` | `available` |

---

## Cosa impari in questa fase (per il CV)

- **Transazioni Firestore** per operazioni atomiche
- **Concurrency control** su capacity booking
- **Prevenzione duplicati** (stesso user + slot)
- **Authorization** owner vs admin
- **HttpsError** con codici semantici (`not-found`, `failed-precondition`, `already-exists`)
- **Denormalizzazione** (`userName`, dati slot dentro booking)

---

## Mini-quiz CV

1. **Perche `createBooking` usa una transazione?**
   Perche deve creare il booking e aggiornare lo slot insieme. Senza transazione potresti avere dati inconsistenti.

2. **Come eviti che lo stesso utente prenoti due volte lo stesso slot?**
   Query su `bookings` con `userId + slotId` e controllo che non esista gia `pending` o `confirmed`.

3. **Perche `bookings` ha `allow write: if false` nelle rules?**
   Tutte le scritture passano da Cloud Functions con validazione server-side.

4. **Differenza tra `cancelBooking` e `updateBookingStatus`?**
   `cancelBooking` e per cancellazione (user/admin) e aggiorna anche lo slot. `updateBookingStatus` e per admin che cambia stato operativo (`confirmed`, `completed`, ecc.).

---

## Checkpoint Fase 4

- [ ] `createBooking.ts`, `cancelBooking.ts`, `updateBookingStatus.ts` creati
- [ ] `utils/auth.ts` e `utils/validators.ts` estesi
- [ ] `index.ts` esporta le 3 functions
- [ ] Indice `userId + slotId` su `bookings` deployato
- [ ] `npm run build` ok
- [ ] `firebase deploy --only functions` ok
- [ ] Almeno 1 documento in `bookings` dopo test
- [ ] Slot aggiornato (`bookedCount`, `status`)

Quando hai finito, scrivi in chat: **"Fase 4 completata"**.

Passeremo alla **Fase 5**: `createStaffShift` e turni staff.

---

## Troubleshooting

| Errore | Causa probabile | Soluzione |
|--------|-----------------|-----------|
| `401 Authentication required` | Shell senza auth simulata | Usa secondo argomento `{ auth: { uid } }` o testa dal frontend |
| `Slot not found` | `slotId` sbagliato | Copia ID da `availability_slots` |
| `Slot is full` | `bookedCount >= capacity` | Usa altro slot o aumenta capacity |
| `Booking already exists` | Stesso user+slot gia attivo | Normale, prova `cancelBooking` prima |
| `Index not found` | Indice composito mancante | Deploy `firestore:indexes` e attendi |
| Transazione fallisce spesso | Troppi retry concorrenti | Normale sotto carico; in MVP accettabile |

---

## Comandi riepilogo

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook/functions
mkdir -p src/bookings
npm run build

cd /Users/vincenzo/Desktop/websites/rotaBook
firebase deploy --only firestore:indexes
firebase deploy --only functions
firebase functions:log --only createBooking
```
