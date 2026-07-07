# Fase 0 — Teoria Firestore e architettura Firebase

## Obiettivo

Capire i concetti minimi prima di toccare codice. Se gia conosci SQL/PostgreSQL (es. da BriefScope o Interview), questa fase ti aiuta a **cambiare mentalita**: da tabelle relazionali a documenti NoSQL.

**Non ci sono comandi da eseguire.** Leggi, rispondi al mini-quiz, poi passa alla Fase 1.

---

## SQL vs NoSQL — perche Firestore per RotaBook

| | PostgreSQL (SQL) | Firestore (NoSQL) |
|--|------------------|-------------------|
| Struttura | Tabelle con righe fisse | Collezioni di documenti JSON-like |
| Schema | Rigido (colonne definite) | Flessibile (campi per documento) |
| Relazioni | JOIN tra tabelle | Riferimenti o documenti annidati |
| Realtime | Serve polling o WebSocket custom | Listener nativi (`onSnapshot`) |
| Transazioni | ACID completo | Transazioni su max 500 documenti |
| Query | SQL potente | Query limitate (no JOIN, no OR su campi diversi) |

**RotaBook usa Firestore perche:**

1. L'app e **realtime** (admin vede prenotazioni senza refresh)
2. Il modello dati e semplice (4 collezioni, poche relazioni)
3. Firebase integra Auth + DB + Functions in un unico ecosistema
4. E uno stack richiesto nel mercato (portfolio credibile)

**Spirito critico:** Firestore non e "PostgreSQL nel cloud". Se avessi bisogno di report complessi, JOIN multipli o aggregazioni pesanti, PostgreSQL sarebbe meglio. Per un'app di booking con aggiornamenti live, Firestore e la scelta giusta.

---

## Concetti Firestore

| Concetto | Significato | Esempio RotaBook |
|----------|-------------|------------------|
| **Collezione** | Gruppo di documenti (come una "tabella") | `users`, `bookings` |
| **Documento** | Un record JSON con ID | `users/abc123` |
| **Campo** | Chiave-valore nel documento | `role: "admin"` |
| **Subcollection** | Collezione dentro un documento | Non usata nel MVP (piatto e piu semplice) |
| **Timestamp** | Tipo nativo Firestore | `createdAt`, `updatedAt` |
| **Reference** | Puntatore a un altro documento | `staffId` (stringa, non Reference type nel MVP) |

---

## Le 4 collezioni del progetto

```
users/{userId}
availability_slots/{slotId}
bookings/{bookingId}
staff_shifts/{shiftId}
```

### Relazioni (senza JOIN)

```
users (1) ────< (N) bookings        via bookings.userId
availability_slots (1) ────< (N) bookings   via bookings.slotId
users/staff (1) ────< (N) staff_shifts    via staff_shifts.staffId
users/staff (1) ────< (N) bookings        via bookings.staffId (opzionale)
```

In Firestore **non fai JOIN**. Leggi il documento booking e, se serve il nome utente, lo hai gia denormalizzato in `userName` al momento della creazione. Questa e una scelta deliberata: meno query, piu consistenza da gestire nelle Functions.

**Spirito critico:** la denormalizzazione (`userName` dentro `bookings`) duplica dati. Se l'utente cambia nome, i booking vecchi mostrano il nome vecchio. Per un MVP va bene; in produzione valuteresti un aggiornamento batch o accetteresti lo storico.

---

## Architettura Firebase per RotaBook

```
Browser (Next.js) ──> Firebase Auth (login)
                  ──> Firestore (read realtime via onSnapshot)
                  ──> Cloud Functions (write critiche: book, cancel, create slot)
                  ──> Security Rules (chi puo leggere/scrivere cosa)
```

**Regola d'oro:** le operazioni che modificano `bookedCount` o creano booking **non** passano dal frontend diretto. Passano da Cloud Functions che validano capacita, duplicati e ruolo. Il frontend non e affidabile (un utente puo modificare il codice JS).

---

## I 3 ruoli

| Ruolo | Permessi |
|-------|----------|
| `user` | Legge slot disponibili, crea/cancella propri booking |
| `staff` | Legge propri turni e booking assegnati |
| `admin` | Tutto: slot, booking, turni, cambio stato |

Il ruolo vive in `users/{userId}.role`. Default: `user`. Admin si assegna manualmente dalla console Firestore (per il MVP).

---

## Cloud Functions — cosa sono

Sono funzioni Node.js che girano su Google Cloud, invocate dal frontend o da eventi Firebase. Per RotaBook userai principalmente **Callable Functions** (`httpsCallable`):

```
Frontend: functions.httpsCallable('createBooking')({ slotId: '...' })
    │
    v
Cloud Function: verifica auth, legge slot, controlla capacity, scrive booking, aggiorna slot
    │
    v
Firestore: documenti aggiornati → listener realtime aggiornano la UI
```

**Spirito critico:** le Callable Functions costano invocazioni + tempo CPU. Per un portfolio il free tier basta. In produzione monitoreresti latenza e cold start (la prima invocazione dopo inattivita e piu lenta).

---

## Diagramma flusso booking

```
Utente clicca "Prenota"
    │
    v
createBooking(slotId)          ← Cloud Function
    ├── auth? user loggato?
    ├── slot esiste?
    ├── slot.status == "available"?
    ├── bookedCount < capacity?
    ├── utente non ha gia prenotato questo slot?
    ├── TRANSAZIONE:
    │     ├── crea bookings/{id}
    │     ├── incrementa slot.bookedCount
    │     └── se pieno → slot.status = "full"
    └── return { success, bookingId }
    │
    v
onSnapshot su bookings/slots   ← UI si aggiorna da sola
```

---

## Mini-quiz CV

1. **Perche non scriviamo booking direttamente dal frontend su Firestore?**
   Perche il frontend non e trusted: un utente potrebbe bypassare i controlli su capacity e duplicati. La logica va nel backend (Cloud Functions).

2. **Cos'e la denormalizzazione e perche la usiamo?**
   Copiare dati (es. `userName` nel booking) per evitare letture multiple. Trade-off: dati duplicati, possibile inconsistenza.

3. **Differenza tra Firestore listener e polling?**
   Il listener (`onSnapshot`) riceve push dal server quando i dati cambiano. Il polling chiede "ci sono novita?" ogni N secondi: piu lento e costoso.

4. **Perche usare un progetto Firebase `rotabook-dev` separato?**
   Per non sporcare dati di produzione, poter resettare, e sperimentare regole senza rischi.

---

## Checkpoint Fase 0

Se riesci a spiegare:

- [ ] Le 4 collezioni e come si collegano
- [ ] Perche booking passa da Cloud Function e non dal frontend
- [ ] Cosa significa denormalizzazione
- [ ] Differenza tra Auth, Firestore, Functions e Security Rules

...sei pronto per la **Fase 1**: setup progetto Firebase e schema Firestore.
