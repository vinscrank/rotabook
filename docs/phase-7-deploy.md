# Fase 7 — Deploy finale backend + README portfolio

## Obiettivo

Chiudere la traccia **Backend** di RotaBook: deploy completo di Functions, Rules e Indexes, verifica end-to-end, e preparazione README per GitHub/portfolio.

Il frontend Next.js si deploya dopo (traccia FE). In questa fase metti in produzione tutto il **serverless backend** che hai costruito nelle Fasi 1-6.

**Tu esegui tutti i comandi.**

**Prerequisito:** Fase 6 completata (Security Rules definitive deployate e testate).

**Progetto dev:** `rotabook-99ebd` | **Regione:** `europe-west1`

---

## Teoria — Cosa significa "deploy" in Firebase

| Comando | Cosa pubblica |
|---------|----------------|
| `firebase deploy --only functions` | Cloud Functions (Node.js) |
| `firebase deploy --only firestore:rules` | Security Rules |
| `firebase deploy --only firestore:indexes` | Indici compositi |
| `firebase deploy --only hosting` | Frontend statico (dopo Fase FE) |

Un deploy non tocca Auth o Firestore data: pubblica solo **codice e configurazione**.

**Spirito critico:** `rotabook-99ebd` e il tuo ambiente dev/sandbox. Per un portfolio serio puoi tenere questo progetto e, in futuro, clonare setup su `rotabook-prod` con regole piu restrittive e dati puliti.

---

## Checklist pre-deploy

Prima di deployare, verifica:

- [ ] `functions/package.json` → `"node": "20"` (se hai `createUserProfile` v1)
- [ ] `npm run build` in `functions/` senza errori
- [ ] `firestore.rules` con rules Fase 6
- [ ] `firestore.indexes.json` completo
- [ ] `.firebaserc` punta a `rotabook-99ebd`
- [ ] Nessun segreto in Git (`.env`, service account)

---

## Passo 1 — Build locale

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook/functions
npm run build
```

**Risultato atteso:** cartella `functions/lib/` aggiornata, zero errori TypeScript.

---

## Passo 2 — Deploy completo backend

Dalla root del progetto:

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook
firebase deploy --only firestore:rules,firestore:indexes,functions
```

**Risultato atteso:**

| Risorsa | Stato |
|---------|--------|
| `firestore.rules` | Released |
| `firestore.indexes` | Deployed (indici in building o Enabled) |
| `health` | Deployed `europe-west1` |
| `createUserProfile` | Deployed `europe-west1` |
| `createSlot` | Deployed `europe-west1` |
| `createBooking` | Deployed `europe-west1` |
| `cancelBooking` | Deployed `europe-west1` |
| `updateBookingStatus` | Deployed `europe-west1` |
| `createStaffShift` | Deployed `europe-west1` |

Se compare warning su cleanup policy artifacts, puoi ignorarlo per il portfolio oppure:

```bash
firebase functions:artifacts:setpolicy
```

---

## Passo 3 — Verifica health endpoint

```bash
curl https://europe-west1-rotabook-99ebd.cloudfunctions.net/health
```

**Risultato atteso:**

```json
{"status":"ok","service":"rotabook-functions"}
```

---

## Passo 4 — Verifica Functions in Console

1. Firebase Console → **Functions**
2. Controlla che tutte le function siano in `europe-west1`
3. Apri i **Logs** e verifica assenza errori recenti

Comando da terminale:

```bash
firebase functions:log
```

---

## Passo 5 — Verifica Firestore

Console → **Firestore Database**:

| Collezione | Cosa controllare |
|------------|------------------|
| `users` | almeno admin, user, staff |
| `availability_slots` | almeno 1 slot |
| `bookings` | 0+ documenti (ok anche vuota) |
| `staff_shifts` | almeno 1 turno |

Console → **Firestore** → **Indexes**: tutti `Enabled`.

Console → **Firestore** → **Rules**: versione Fase 6 attiva.

---

## Passo 6 — Smoke test funzionale (manuale)

Non serve frontend. Verifica questa sequenza logica:

1. **Auth:** utente `test@rotabook.test` esiste
2. **Profilo:** `users/{uid}` con `role: "user"`
3. **Slot:** almeno uno `status: "available"`
4. **Booking:** se hai testato `createBooking`, `bookedCount` coerente
5. **Staff shift:** almeno un turno con `staffId` valido
6. **Rules:** Playground nega write diretta su `bookings`

Se tutto e coerente, il backend e production-ready per il FE.

---

## Passo 7 — Commit e push su GitHub

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook
git status
git add .
git commit -m "$(cat <<'EOF'
Complete RotaBook backend: Cloud Functions, Firestore rules and indexes.

EOF
)"
git push
```

Repo: https://github.com/vinscrank/rotabook

---

## Passo 8 — Aggiorna README portfolio

Apri `README.md` e aggiungi (o sostituisci la sezione CV) con qualcosa del genere:

```markdown
## RotaBook — Backend completato

Realtime booking and staff rota backend built with Firebase.

### Stack backend
- Node.js + TypeScript
- Firebase Cloud Functions (callable + auth trigger)
- Firestore (NoSQL, realtime)
- Firebase Authentication
- Firestore Security Rules (RBAC admin/staff/user)

### Cloud Functions
| Function | Ruolo |
|----------|-------|
| `createUserProfile` | Crea profilo utente su registrazione |
| `createSlot` | Admin crea slot disponibilita |
| `createBooking` | User prenota con controllo capacity |
| `cancelBooking` | User/admin cancella prenotazione |
| `updateBookingStatus` | Admin aggiorna stato booking |
| `createStaffShift` | Admin crea turni staff |
| `health` | Health check HTTP |

### Architettura
- Scritture critiche solo via Cloud Functions (Admin SDK)
- Security Rules per accesso read realtime dal client
- Regione: europe-west1

### Links
- Repo: https://github.com/vinscrank/rotabook
- Health: https://europe-west1-rotabook-99ebd.cloudfunctions.net/health
```

**Spirito critico:** nel README metti solo cose che hai davvero deployato e verificato.

---

## Passo 9 — Hosting (dopo il frontend)

Quando il team completa `frontend/` (traccia FE F4):

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook
firebase init hosting
```

Suggerimenti:

| Domanda | Risposta |
|---------|----------|
| Public directory | `frontend/out` (Next.js static export) o `frontend/dist` |
| Single-page app | Yes (se Next.js export) |
| Automatic builds GitHub | No (per ora) |

Poi:

```bash
firebase deploy --only hosting
```

URL tipo: `https://rotabook-99ebd.web.app`

Questo passo **non** e obbligatorio per chiudere la traccia BE.

---

## Passo 10 — Cosa mettere nel CV / LinkedIn

### Versione breve

> Built RotaBook, a realtime booking and staff rota backend using Node.js, TypeScript, Firebase Auth, Firestore and Cloud Functions. Implemented serverless booking validation, capacity control, and role-based access with Firestore Security Rules.

### Versione tecnica

> Designed and deployed a Firebase serverless backend with 7 Cloud Functions (auth triggers + callable APIs), Firestore transactions for booking concurrency, and RBAC security rules for admin, staff and user roles. Region: europe-west1.

### Bullet per portfolio

- Firebase Auth + automatic user profile provisioning via `auth.user().onCreate`
- Callable Functions with server-side validation and `HttpsError` handling
- Firestore transactions for atomic booking + slot capacity updates
- Role-based Firestore Security Rules with privilege escalation protection
- Composite indexes for bookings and staff shift queries

---

## Cosa impari in questa fase (per il CV)

- **Deploy Firebase** multi-servizio (functions + rules + indexes)
- **Smoke testing** backend senza frontend
- **Documentazione portfolio** (README, architettura, link live)
- **Separazione dev/prod** e hygiene su segreti/Git
- **Preparazione hosting** per integrazione FE

---

## Mini-quiz CV

1. **Perche deployi rules e indexes insieme alle functions?**
   Perche FE e listener realtime dipendono da rules corrette e indici pronti.

2. **Perche il backend puo essere "completo" senza Hosting?**
   Perche Hosting serve solo al frontend. Le API e il database sono gia live.

3. **Cosa verifica `curl /health`?**
   Che il runtime Functions sia deployato e raggiungibile in `europe-west1`.

4. **Perche non committare `.env`?**
   Contiene credenziali e config sensibili.

---

## Checkpoint Fase 7 — Backend completo

- [ ] `npm run build` ok
- [ ] `firebase deploy --only firestore:rules,firestore:indexes,functions` ok
- [ ] `curl /health` risponde `{"status":"ok",...}`
- [ ] Tutte le 7 business functions visibili in Console
- [ ] Indici Firestore `Enabled`
- [ ] Rules Fase 6 attive
- [ ] Dati di test coerenti in Firestore
- [ ] Commit + push su GitHub
- [ ] README aggiornato con stack e link

Quando hai finito, scrivi in chat: **"Fase 7 completata"**.

Il backend e chiuso. Prossimo passo: traccia **Frontend** (F1-F4) con Next.js.

---

## Troubleshooting

| Errore | Causa probabile | Soluzione |
|--------|-----------------|-----------|
| Deploy functions fallisce su Gen1 | Node 24 con auth v1 | `"node": "20"` in `package.json` |
| Indici in `Building` | Normale | Attendi 5-15 minuti |
| `403` su curl health | URL o progetto sbagliato | Usa Project ID `rotabook-99ebd` |
| Functions deploy ok ma errori runtime | Bug nel codice | `firebase functions:log` |
| Git push rifiutato | Auth SSH/HTTPS | Verifica `git remote -v` |

---

## Comandi riepilogo

```bash
cd /Users/vincenzo/Desktop/websites/rotaBook/functions
npm run build

cd /Users/vincenzo/Desktop/websites/rotaBook
firebase deploy --only firestore:rules,firestore:indexes,functions
curl https://europe-west1-rotabook-99ebd.cloudfunctions.net/health
firebase functions:log

git add .
git commit -m "Complete RotaBook backend deploy"
git push
```

---

## Riepilogo percorso BE (Fasi 0-7)

```
Fase 0  Teoria Firestore
Fase 1  Setup Firebase + schema
Fase 2  Auth + profilo utente
Fase 3  createSlot
Fase 4  createBooking / cancel / updateStatus
Fase 5  createStaffShift
Fase 6  Security Rules RBAC
Fase 7  Deploy + portfolio  ← sei qui
```

Congratulazioni: hai un backend Firebase serverless completo e documentato.
