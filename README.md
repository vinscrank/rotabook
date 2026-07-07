# RotaBook — Realtime Booking and Staff Rota App

App full-stack per gestire prenotazioni, slot di disponibilita e turni staff in tempo reale. Progetto portfolio con stack Firebase.

## Documento di riferimento

Specifica completa: [`RotaBook_Project_Document.pdf`](./RotaBook_Project_Document.pdf)

## Come usare questo repo

Il percorso e diviso in due tracce:

| Traccia | Chi la fa | Focus |
|---------|-----------|-------|
| **Backend (BE)** | Tu, a mano, fase per fase | Node.js, Firestore, Cloud Functions, Security Rules |
| **Frontend (FE)** | Team / Cursor in automatico (dopo) | Next.js, React, TypeScript, Firebase client SDK |

**Regola:** non passare alla fase successiva finche il checkpoint della fase corrente non e tutto verde.

## Percorso Backend (tu impari qui)

Guide in [`docs/`](./docs/):

| Fase | File | Obiettivo |
|------|------|-----------|
| 0 | [phase-0-firestore-theory.md](docs/phase-0-firestore-theory.md) | Teoria NoSQL, Firestore, architettura Firebase |
| 1 | [phase-1-firebase-firestore-setup.md](docs/phase-1-firebase-firestore-setup.md) | Progetto Firebase, Firestore produzione, schema, scaffold Functions |
| 2 | [phase-2-auth-user-profile.md](docs/phase-2-auth-user-profile.md) | Auth email/password + trigger creazione profilo utente |
| 3 | [phase-3-cloud-functions-slots.md](docs/phase-3-cloud-functions-slots.md) | `createSlot` + validazione admin |
| 4 | [phase-4-cloud-functions-bookings.md](docs/phase-4-cloud-functions-bookings.md) | `createBooking`, `cancelBooking`, `updateBookingStatus` |
| 5 | [phase-5-cloud-functions-shifts.md](docs/phase-5-cloud-functions-shifts.md) | `createStaffShift` + query staff |
| 6 | [phase-6-security-rules.md](docs/phase-6-security-rules.md) | Firestore Security Rules per admin/staff/user |
| 7 | [phase-7-deploy.md](docs/phase-7-deploy.md) | Deploy Functions + Rules + Hosting |

> Le fasi 2-7 verranno generate man mano che completi quella precedente. Scrivi in chat **"Fase N completata"** per ricevere la guida successiva.

## Percorso Frontend (dopo il BE)

| Fase | Obiettivo |
|------|-----------|
| F1 | Scaffold Next.js + Firebase client SDK + Auth pages |
| F2 | Pagine user (`/book`, `/my-bookings`) con listener realtime |
| F3 | Admin dashboard + gestione slot/bookings/shifts |
| F4 | Staff schedule + deploy Vercel/Firebase Hosting |

Il FE consuma le Cloud Functions e le Security Rules che hai gia costruito nel BE.

## Stack

| Layer | Tecnologia |
|-------|------------|
| Frontend | Next.js, React, TypeScript |
| Backend | Node.js, TypeScript, Firebase Cloud Functions |
| Database | Firestore (NoSQL, realtime) |
| Auth | Firebase Authentication |
| Deploy | Firebase Hosting, Cloud Functions |

## Struttura repo target

```
rotaBook/
├── docs/                    Guide fase per fase
├── functions/               Cloud Functions (Node.js + TypeScript) — TU
│   └── src/
├── firestore.rules          Security Rules — TU
├── firestore.indexes.json   Indici Firestore — TU
├── firebase.json            Config Firebase — TU
├── .firebaserc              Progetto Firebase collegato — TU
├── frontend/                Next.js app — TEAM (dopo)
└── README.md
```

## Cosa scrivere nel CV a fine progetto

> Built RotaBook, a realtime booking and staff rota app using Next.js, TypeScript, Firebase Auth and Firestore. Developed serverless backend logic with Node.js Cloud Functions to validate bookings, manage capacity and update booking statuses. Implemented role-based access for admin, staff and users using Firestore Security Rules.
