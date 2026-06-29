# Log della sessione — build Savant Ads Dashboard

**Data:** 2026-06-26
**Da:** cartella vuota → sistema completo e verificato (DB → API → dashboard)

Questo documento riassume la chat in cui è stato costruito il progetto: cosa è stato
chiesto, cosa è stato fatto, le decisioni prese e le verifiche superate.

---

## 1. Obiettivo

Costruire l'intero progetto **Savant Ads Dashboard**: reportistica pubblicitaria
unificata (Meta · Google · Snapchat) → Postgres → dashboard React. La cartella di
partenza era vuota.

## 2. Input forniti durante la chat

L'utente ha incollato, in più messaggi, il sorgente completo dei moduli:

- `frontend-dashboard.jsx` (dashboard React su dati seed)
- `README.md` (overview + diagramma architettura)
- `backend/schema.sql`, `models.py`, `config.py`, `db.py`, `run_sync.py`
- `backend/connectors/base.py`, `backend/connectors/meta.py`
- `.gitignore`, `backend/requirements.txt`

Quindi non un compito di progettazione, ma: **posare i file, colmare i buchi,
verificare, e poi estendere** secondo le richieste successive.

## 3. Richieste, in ordine

1. **"Build the whole project"** → posati tutti i file forniti + file mancanti.
2. **"la dashboard dovrà avere lingua inglese e svedese con toggle"** → aggiunto i18n EN/SV.
3. **"cosa bisogna fare?"** → elencati i passi rimanenti (mancava Postgres, accesso Meta).
4. **"fai tutto tu"** → installato Postgres, creato DB, seed end-to-end, default lingua → svedese.
5. **"si crea"** (l'endpoint API + frontend collegato) → costruiti API FastAPI + app Vite.
6. **"crea markdown di questa chat"** → questo file.

---

## 4. Cosa è stato costruito

### File verbatim (dall'utente)
`README.md`, `frontend-dashboard.jsx`, `.gitignore`, `backend/requirements.txt`,
`backend/{config,models,db,run_sync}.py`, `backend/schema.sql`,
`backend/connectors/{base,meta}.py`.

### File aggiunti per colmare i buchi
- `.env.example` — rispecchia le variabili lette da `config.py`.
- `backend/connectors/__init__.py` — package marker.
- `GUIDA.md` — la guida passo-passo (salvata su richiesta).

### Una deviazione approvata
- `config.py`: aggiunto un **loader `.env` senza dipendenze** (`_load_dotenv`), perché
  il workflow documentato `cp .env.example .env` altrimenti non avrebbe caricato nulla
  (token Meta e cron avrebbero letto valori vuoti). `setdefault` → in produzione vince
  il secret manager.

### Estensioni (richieste 2, 4, 5)
- **i18n EN/SV** in `frontend-dashboard.jsx`: stringhe in `STRINGS`, toggle in header,
  scelta salvata in `localStorage`, formattazione numerica per lingua (separatori,
  decimali, spazio prima di `%`). Default → **svedese**.
- **`backend/api.py`** — FastAPI sola lettura: `GET /api/metrics` (+ `?since=`, `/health`,
  CORS) che serve la view `ad_metrics_enriched`.
- **`backend/db.py`** — `fetch_enriched()` con serializzazione JSON (Decimal→float, date→ISO).
- **`frontend/`** — app Vite + React 19 + **Tailwind v4** + recharts, proxy `/api → 127.0.0.1:8000`.
  `src/App.jsx` = copia di `frontend-dashboard.jsx`.
- La dashboard ora **prova l'API e fa fallback al seed** se l'API è spenta; badge
  dinamico **live-data / testdata**.

### Struttura finale
```
savantmedia-meta-dashboard/
├── .env.example   ·  .env (locale, non in git)
├── .gitignore  ·  README.md  ·  GUIDA.md  ·  SESSIONE.md
├── frontend-dashboard.jsx          (sorgente dashboard, standalone)
├── backend/
│   ├── requirements.txt  ·  config.py  ·  models.py  ·  db.py
│   ├── schema.sql  ·  run_sync.py  ·  api.py
│   └── connectors/  __init__.py · base.py · meta.py
└── frontend/                       (app Vite: vite.config.js, src/App.jsx, …)
```

---

## 5. Installazione Postgres (portable, senza admin)

La macchina non aveva Postgres (niente su `:5432`, niente `psql`, niente Docker) e la
shell **non era admin** → l'installer a servizio avrebbe richiesto un prompt UAC.
Scelta: **binari portable**, scriptabili e reversibili (basta cancellare la cartella).

- Scaricati i binari PostgreSQL **17.5** (~307 MB) → estratti in `C:\Users\loren\savant-postgres`.
- `initdb` con auth **trust**, superuser = utente di sistema `loren`.
- Server avviato su `:5432`; database `savant_ads` creato.
- Script di comodo: `C:\Users\loren\savant-postgres\start.ps1` / `stop.ps1`.

> Limite noto: essendo portable **non riparte da solo dopo un reboot** → usare `start.ps1`.
> Per produzione/cron: installer ufficiale come servizio.

---

## 6. Verifiche superate

| Verifica | Esito |
|---|---|
| `py_compile` + import smoke test (6 moduli backend) | ✅ |
| Loader `.env` (file di prova → valori letti, poi rimosso) | ✅ `meta_is_configured=True` |
| `frontend-dashboard.jsx` parse (esbuild) | ✅ |
| `python run_sync.py --seed` | ✅ **360 righe** (30g × 3 piattaforme × 4 campagne) |
| Query DB: 120 righe/piattaforma; view con ROAS + budget cliente | ✅ |
| `db.fetch_enriched()` diretto | ✅ 360 righe, JSON corretto |
| `GET /api/metrics` via HTTP | ✅ 360 righe (`?since=2026-06-20` → 84) |
| `npm run build` (Tailwind + recharts + React 19) | ✅ 442 moduli |
| **End-to-end**: `:5173/api/metrics` → proxy → FastAPI → Postgres | ✅ **360 righe** |

Catena dimostrata:
```
browser → Vite proxy :5173/api → FastAPI :8000 → db.fetch_enriched → Postgres → ad_metrics_enriched
```

---

## 7. Come si avvia

```powershell
# 0) Postgres acceso (per riavviarlo dopo un reboot)
& "C:\Users\loren\savant-postgres\start.ps1"

# 1) Backend API — da backend\, con la venv attiva
uvicorn api:app --reload --port 8000

# 2) Frontend — da frontend\
npm run dev        # http://localhost:5173  → badge "live-data"
```
Con l'API spenta la dashboard usa i dati seed incorporati (badge "testdata").

---

## 8. Cosa resta (roadmap)

- [ ] **Meta**: in attesa dell'accesso admin di Rebecca → token + `META_AD_ACCOUNTS` nel
      `.env`, poi `python run_sync.py` (il connettore è già pronto).
- [ ] Mappare gli ad account reali ai clienti (`accounts.client_id`) per il pannello budget.
- [ ] Connettore Google Ads (developer token: approvazione lenta, avviarla presto).
- [ ] Connettore Snapchat Marketing API.
- [ ] Scheduling notturno di `run_sync.py` (cron / Task Scheduler).
- [ ] Alert su sforamento budget per cliente.

---

## 9. Note di sicurezza

- I segreti stanno **solo** in `.env` (ignorato da git via `.gitignore`); nessuna chiave
  nel codice. Il token Meta dovrà essere un **System User token** (non personale).
- In produzione: segreti in un secret manager, non in un file sul server.

---

## 10. Handoff — completamento (Task 1–7)

Estensioni costruite dopo il primo end-to-end, nell'ordine dell'handoff.

| Task | Cosa | Esito |
|---|---|---|
| 1 | Sync robusto: `start_sync_log`/`finish_sync_log` in `db.py`; ogni connettore in try/except in `run_sync.py` | ✅ testato (un connettore in errore non ferma gli altri; righe in `sync_log`) |
| 2 | `GET /api/accounts` + tab **Konton** (kontoöversikt) con badge stato sync; i18n EN/SV | ✅ testato (HTTP: 3 account, `?since=` filtra) |
| 3 | Connettore **Google Ads** (`connectors/google.py`, GAQL via REST/OAuth2) + config + `.env.example` + `build_connectors()` | ✅ compile + unit-test mapping (`cost_micros`→spend, camelCase). Live: serve credenziale |
| 4 | Mappatura account→cliente: `assign_client`/`list_account_mapping` + CLI `map_accounts.py` | ✅ testato (`--list`, assign 1/0) |
| 5 | Sync notturno: `run_sync.ps1` (log UTF-8) + `register-sync-task.ps1` (Task Scheduler 03:00) | ✅ testato (`run_sync.ps1` exit 0, log pulito) |
| 6 | Alert budget cliente (≥90% del mensile) nella tab Rapportering | ✅ build OK |
| 7 | Postgres come servizio/container in produzione | ✅ documentato (README + GUIDA §10) |

**Definizione di "lavoro chiuso":** punti 1, 2, 4, 5, 6 completi e verificati; punto 3
Google pronto (manca solo valorizzare il `.env`), Meta pronto (in attesa del token di
Rebecca). Snapchat resta da fare con lo stesso pattern.

### Nuovi file / modifiche principali
- `backend/connectors/google.py` (nuovo) · `backend/map_accounts.py` (nuovo) ·
  `backend/accounts_map.example.json` (nuovo)
- `backend/run_sync.ps1`, `backend/register-sync-task.ps1` (nuovi)
- `backend/db.py` (+ sync_log, fetch_accounts, assign_client, list_account_mapping)
- `backend/api.py` (+ `/api/accounts`) · `backend/run_sync.py` (isolamento + Google) ·
  `backend/config.py` (+ sezione Google) · `.env.example` (+ Google)
- `frontend-dashboard.jsx` e `frontend/src/App.jsx` (tab Rapportering/Konton + alert budget)
