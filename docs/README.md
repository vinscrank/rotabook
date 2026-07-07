# RotaBook — Roadmap apprendimento

## Filosofia del percorso

Stai costruendo un progetto portfolio **production-style**, non un toy project. La differenza e che impari:

- modellazione dati NoSQL (Firestore)
- logica di business serverless (Cloud Functions)
- sicurezza a livello database (Security Rules)
- aggiornamenti realtime (listener Firestore)

Il **backend e il cuore**: il frontend e solo un client che chiama Functions e legge Firestore. Per questo le prime 7 fasi sono BE.

## Scelta strategica: Firestore produzione vs Emulator

| | Firestore produzione (consigliato) | Firebase Emulator Suite |
|--|-----------------------------------|-------------------------|
| Setup | Progetto Firebase su console | Docker o Java + `firebase emulators:start` |
| Dati | Persistono nel cloud | Spariscono a ogni reset (salvo export) |
| Realismo | Identico alla produzione | Quasi identico, ma Auth/Functions hanno edge case |
| Costo | Gratis nel free tier per un MVP | Gratis, tutto locale |
| Rischio | Puoi sporcare dati reali se non separi ambienti | Zero rischio su dati cloud |
| CV | "Ho lavorato con Firestore in produzione" | "Ho usato emulatori in locale" |

**Raccomandazione:** usa un **progetto Firebase dedicato solo allo sviluppo** (display name es. `rotabook-dev`, Project ID es. `rotabook-99ebd`), con Firestore in production mode fin dalla Fase 1.

**Spirito critico:** l'Emulator e utile per CI e test automatici, ma se il tuo obiettivo e imparare Firestore "davvero", partire dal cloud ti costringe a capire subito indici, regole, limiti di query e costi. Il free tier di Firestore copre ampiamente un MVP portfolio (50K letture/giorno, 20K scritture/giorno).

## Ordine di esecuzione — Backend

```
Fase 0 (teoria) ──> Fase 1 (setup) ──> Fase 2 (auth) ──> Fase 3 (slots)
                                                          │
                                                          v
Fase 7 (deploy) <── Fase 6 (rules) <── Fase 5 (shifts) <── Fase 4 (bookings)
```

## Ordine di esecuzione — Frontend (dopo Fase 4 minimo)

```
F1 (scaffold + auth UI) ──> F2 (user pages) ──> F3 (admin) ──> F4 (staff + deploy)
```

Il FE puo partire dalla Fase F1 quando hai almeno Fase 2 BE completata (Auth + profilo utente funzionanti).

## Cosa impari per fase (sintesi CV)

| Fase | Competenza |
|------|------------|
| 0 | NoSQL vs SQL, document model, collezioni Firestore |
| 1 | Firebase CLI, `firebase init`, schema dati, deploy rules |
| 2 | Firebase Auth, Auth triggers, profilo utente in Firestore |
| 3 | Callable Functions, validazione ruolo admin, CRUD slot |
| 4 | Transazioni Firestore, concurrency (capacity booking), idempotenza |
| 5 | Query Firestore con filtri, indici compositi |
| 6 | Security Rules, role-based access control |
| 7 | Deploy serverless, ambienti dev/prod |

## Come segnalare il completamento

Quando finisci una fase, scrivi in chat:

```
Fase 1 completata
```

(senza incollare API key o password). Riceverai la guida della fase successiva.
