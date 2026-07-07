# Fase 5 — Cloud Function `createStaffShift` (turni staff)

## Obiettivo

Permettere all'**admin** di creare turni per il personale nella collezione `staff_shifts`.

Al termine di questa fase:

- admin puo creare un turno con `createStaffShift`
- in Firestore avrai documenti turno consultabili dallo staff (in FE: `/staff/schedule`)
- riusi `requireAdmin` e i validatori gia creati nelle fasi precedenti

**Tu esegui tutti i comandi.** Il frontend non si tocca ancora.

**Prerequisito:** Fase 4 completata (booking functions deployate) e almeno un utente con `role: "staff"` in `users`.

**Progetto:** `rotabook-99ebd` | **Regione:** `europe-west1`

---

## Teoria — Slot vs turni staff (ripasso)

| | `availability_slots` | `staff_shifts` |
|--|------------------------|----------------|
| Scopo | Cosa prenota il cliente | Quando lavora un dipendente |
| Chi crea | Admin (`createSlot`) | Admin (`createStaffShift`) |
| Chi legge | Tutti gli utenti loggati | Staff (propri turni) + admin |
| Collegamento booking | Si (`bookings.slotId`) | No nel MVP |

**Spirito critico:** un turno staff **non** crea automaticamente uno slot prenotabile. Sono due piani diversi: operativita interna (rota) vs offerta al cliente (booking).

---

## Teoria — Schema `staff_shifts`

```
staff_shifts/{shiftId}
  staffId: string        UID del membro staff
  staffName: string      Nome (denormalizzato)
  date: "YYYY-MM-DD"
  startTime: "HH:mm"
  endTime: "HH:mm"
  role: string           Mansione nel turno (es. instructor)
  createdAt: timestamp
  updatedAt: timestamp
```

`staffName` e denormalizzato come `userName` nei booking: evita una lettura extra su `users` quando mostri il calendario staff.

---

## Struttura file al termine della Fase 5

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
├── staff/
│   └── createStaffShift.ts
└── utils/
    ├── auth.ts
    └── validators.ts
```

---

## Passo 1 — Prepara un utente staff

Se non l'hai gia fatto:

1. Authentication → Add user → `staff@rotabook.test`
2. Attendi `createUserProfile` (o verifica `users/{uid}`)
3. Firestore → `users/{uid}` → imposta `role: "staff"`

Annota:

- `STAFF_UID` = UID Auth / ID documento `users`
- `STAFF_NAME` = valore campo `name` (es. `Marco Rossi`)

---

## Passo 2 — Estendi `utils/auth.ts` (opzionale ma consigliato)

Aggiungi helper per verificare che `staffId` esista e sia staff:

```typescript
export async function requireStaffUser(staffId: string): Promise<void> {
  const userDoc = await admin.firestore().collection("users").doc(staffId).get();

  if (!userDoc.exists) {
    throw new HttpsError("not-found", "Staff user not found");
  }

  const role = userDoc.data()?.role;

  if (role !== "staff" && role !== "admin") {
    throw new HttpsError("invalid-argument", "staffId must reference a staff user");
  }
}
```

**Spirito critico:** senza questo controllo, un admin potrebbe assegnare turni a UID inesistenti o a utenti `user`, sporcano il rota.

---

## Passo 3 — Crea `staff/createStaffShift.ts`

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook/functions
mkdir -p src/staff
```

File `functions/src/staff/createStaffShift.ts`:

```typescript
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";
import { admin } from "../admin";
import { requireAdmin, requireStaffUser } from "../utils/auth";
import {
  assertDateString,
  assertString,
  assertTimeRange,
  assertTimeString,
} from "../utils/validators";

export const createStaffShift = onCall({ region: "europe-west1" }, async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  await requireAdmin(uid);

  const staffId = assertString(request.data?.staffId, "staffId");
  const staffName = assertString(request.data?.staffName, "staffName");
  const date = assertDateString(request.data?.date, "date");
  const startTime = assertTimeString(request.data?.startTime, "startTime");
  const endTime = assertTimeString(request.data?.endTime, "endTime");
  const role = assertString(request.data?.role, "role");

  assertTimeRange(startTime, endTime);
  await requireStaffUser(staffId);

  const shiftRef = admin.firestore().collection("staff_shifts").doc();

  await shiftRef.set({
    staffId,
    staffName,
    date,
    startTime,
    endTime,
    role,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, shiftId: shiftRef.id };
});
```

### Cosa fa il codice

1. controlla login
2. controlla admin (`requireAdmin`)
3. valida input (date, orari, stringhe)
4. verifica che `staffId` sia un utente staff reale
5. crea documento in `staff_shifts`
6. ritorna `shiftId`

---

## Passo 4 — Aggiorna `index.ts`

Aggiungi import ed export:

```typescript
import { createStaffShift } from "./staff/createStaffShift";

export {
  createUserProfile,
  createSlot,
  createBooking,
  cancelBooking,
  updateBookingStatus,
  createStaffShift,
};
```

---

## Passo 5 — Indice Firestore (gia presente)

In `firestore.indexes.json` dovresti gia avere:

```json
{
  "collectionGroup": "staff_shifts",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "staffId", "order": "ASCENDING" },
    { "fieldPath": "date", "order": "ASCENDING" }
  ]
}
```

Serve per query future tipo:

```typescript
staff_shifts.where("staffId", "==", uid).orderBy("date")
```

Se manca, aggiungilo e deploy:

```bash
firebase deploy --only firestore:indexes
```

---

## Passo 6 — Build e deploy

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook/functions
npm run build

cd /Users/vincenzo/Desktop/websites/rotaBook
firebase deploy --only functions
```

**Risultato atteso:** `createStaffShift` visibile in Console → Functions.

---

## Passo 7 — Test da shell Firebase

Avvia shell:

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook/functions
npm run shell
```

Comando (una riga, sostituisci valori):

```javascript
createStaffShift({ data: { staffId: "STAFF_UID", staffName: "Marco Rossi", date: "2026-07-15", startTime: "08:00", endTime: "14:00", role: "instructor" } }, { auth: { uid: "ADMIN_UID" } })
```

| Placeholder | Valore |
|-------------|--------|
| `STAFF_UID` | UID utente con `role: "staff"` |
| `ADMIN_UID` | UID utente con `role: "admin"` |

**Risultato atteso:**

```javascript
{ success: true, shiftId: "..." }
```

Se ricevi `401` o `auth: MISSING`, e lo stesso limite della shell con callable v2 visto in Fase 3-4. In quel caso verifica deploy + crea turno manualmente in Firestore per vedere lo schema.

---

## Passo 8 — Verifica in Firestore

Collezione `staff_shifts` → nuovo documento:

| Campo | Esempio |
|-------|---------|
| `staffId` | UID staff |
| `staffName` | `Marco Rossi` |
| `date` | `2026-07-15` |
| `startTime` | `08:00` |
| `endTime` | `14:00` |
| `role` | `instructor` |
| `createdAt` | timestamp |
| `updatedAt` | timestamp |

---

## Passo 9 — Query che usera il frontend (solo teoria)

Lo staff in `/staff/schedule` fara qualcosa del genere:

```typescript
query(
  collection(db, "staff_shifts"),
  where("staffId", "==", currentUser.uid),
  orderBy("date", "asc")
)
```

Per questo serve l'indice `staffId + date` che hai gia in `firestore.indexes.json`.

---

## Cosa impari in questa fase (per il CV)

- **CRUD server-side** per entita secondarie (turni)
- **Validazione referenze** (`staffId` deve esistere)
- **Denormalizzazione** (`staffName` nel turno)
- **Indici compositi** per query per utente + data
- **Riutilizzo utilities** (`requireAdmin`, validators)

---

## Mini-quiz CV

1. **Perche `createStaffShift` e admin-only?**
   Perche solo l'admin gestisce la pianificazione del personale.

2. **Perche salviamo `staffName` se abbiamo gia `staffId`?**
   Per mostrare il calendario senza join su `users` a ogni lettura.

3. **Perche serve l'indice `staffId + date`?**
   Firestore richiede indici compositi per `where` + `orderBy` su campi diversi.

4. **Un turno staff crea automaticamente uno slot prenotabile?**
   No. Slot e turni sono collezioni separate con scopi diversi.

---

## Checkpoint Fase 5

- [ ] Utente `staff` presente in Auth + `users` con `role: "staff"`
- [ ] `requireStaffUser` aggiunto in `utils/auth.ts` (consigliato)
- [ ] `staff/createStaffShift.ts` creato
- [ ] `index.ts` esporta `createStaffShift`
- [ ] Indice `staffId + date` presente
- [ ] `npm run build` ok
- [ ] `firebase deploy --only functions` ok
- [ ] Almeno 1 documento in `staff_shifts`

Quando hai finito, scrivi in chat: **"Fase 5 completata"**.

Passeremo alla **Fase 6**: Security Rules definitive per admin/staff/user.

---

## Troubleshooting

| Errore | Causa probabile | Soluzione |
|--------|-----------------|-----------|
| `401 Authentication required` | Shell senza auth | Usa `{ auth: { uid: "ADMIN_UID" } }` |
| `Admin role required` | UID non admin | Usa UID con `role: "admin"` |
| `Staff user not found` | `staffId` inesistente | Crea utente staff in Auth + `users` |
| `staffId must reference a staff user` | Ruolo sbagliato | Imposta `role: "staff"` su quel utente |
| `endTime must be after startTime` | Orari invertiti | Correggi `startTime` / `endTime` |
| Query staff fallisce in FE futuro | Indice mancante | Deploy `firestore:indexes` |

---

## Comandi riepilogo

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook/functions
mkdir -p src/staff
npm run build

cd /Users/vincenzo/Desktop/websites/rotaBook
firebase deploy --only firestore:indexes
firebase deploy --only functions
firebase functions:log --only createStaffShift
```
