# Savant Ads Dashboard

Reportistica pubblicitaria unificata: collega Meta, Google e Snapchat in un unico
sistema, così non serve più il login manuale su ogni piattaforma.

## Come è fatto

```
                 ┌─────────────┐
   Meta API ────▶│             │
   Google API ──▶│ connettori  │──▶ normalizzazione ──▶ Postgres ──▶ dashboard
   Snapchat ────▶│  (BaseConnector)        (MetricRow)   (ad_metrics)   (React)
                 └─────────────┘
```

Ogni connettore traduce i dati grezzi della sua piattaforma nello stesso modello
(`MetricRow`). Il DB li salva in `ad_metrics`; la dashboard legge dalla view
`ad_metrics_enriched` (che calcola CTR, CPC, CPA, ROAS al volo). Aggiungere una
piattaforma = scrivere una nuova classe connettore, niente altro cambia.

## File principali

| File | Cosa fa |
|------|---------|
| `backend/schema.sql` | schema normalizzato + view con le metriche derivate |
| `backend/models.py` | `MetricRow`: il contratto comune tra connettori e DB |
| `backend/connectors/base.py` | interfaccia per i connettori (`fetch() -> list[MetricRow]`) |
| `backend/connectors/meta.py` | connettore Meta Insights (async, retry, paginazione) |
| `backend/connectors/google.py` | connettore Google Ads (GAQL via REST, OAuth2) |
| `backend/db.py` | upsert idempotente + `sync_log` + panoramica account |
| `backend/run_sync.py` | orchestratore del sync (`--seed`; ogni connettore isolato e loggato) |
| `backend/map_accounts.py` | CLI per mappare account → cliente (`--list`, `--file`, `--account`) |
| `backend/run_sync.ps1` · `register-sync-task.ps1` | sync notturno + registrazione in Task Scheduler |
| `backend/api.py` | API FastAPI di sola lettura: `GET /api/metrics`, `GET /api/accounts` |
| `frontend/` | app Vite + React (Tailwind, recharts), due tab: Rapportering · Konton |
| `frontend-dashboard.jsx` | la dashboard (UI bilingue EN/SV), sorgente di `frontend/src/App.jsx` |

## Avvio oggi (senza ancora il token Meta)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env          # poi modifica .env

# popola con dati finti e guarda la dashboard prendere forma
python run_sync.py --seed
```

La dashboard (`frontend-dashboard.jsx`) gira da subito sui dati seed.

## Vedere la dashboard sui dati del DB (API + frontend)

Servono Postgres acceso, l'API e il frontend:

```bash
# 1) Backend API (terminale A) — dalla cartella backend, con la venv attiva
uvicorn api:app --reload --port 8000

# 2) Frontend (terminale B)
cd frontend
npm install        # solo la prima volta
npm run dev        # apre http://localhost:5173
```

Il frontend chiama `/api/metrics` (proxy Vite → `:8000` → view `ad_metrics_enriched`).
Se l'API è spenta, la dashboard usa i dati seed incorporati (badge **testdata**); con
l'API attiva mostra i dati reali del DB (badge **live-data**).

La dashboard ha **due tab**:
- **Rapportering** — KPI, andamento spesa, budget per cliente, alert budget, tabella campagne.
- **Konton** (kontoöversikt) — un account per riga: piattaforma · cliente · spesa nel
  periodo · stato e data dell'ultimo sync (verde = ok, rosso = errore). Sorgente: `GET /api/accounts`.

## Aggiungere Google Ads

Explorer Access è disponibile subito (nessuna approvazione lenta). Metti le credenziali
OAuth2 + developer token nel `.env` (vedi `.env.example`):
```
GOOGLE_DEVELOPER_TOKEN=...   GOOGLE_CLIENT_ID=...   GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...     GOOGLE_CUSTOMER_IDS=123-456-7890,987-654-3210
# GOOGLE_LOGIN_CUSTOMER_ID=...   (manager/MCC, opzionale)
```
Poi `python run_sync.py`: il connettore Google scrive in `ad_metrics` e la dashboard lo
mostra filtrando su "google". Nessuna libreria pesante: usa GAQL via REST + `requests`.

## Mappare account → cliente (budget reale)

Dopo il primo sync reale, collega gli account ai clienti così il pannello/alert budget
usa dati veri:
```bash
python map_accounts.py --list                                  # mappatura attuale
python map_accounts.py --file accounts_map.json                # da file (vedi *.example.json)
python map_accounts.py --account act_123 --client "Nordic Talent AB" --budget 8000
```

## Sync automatico (Windows)

```powershell
# registra il task notturno (giornaliero, 03:00) — una volta sola
powershell -NoProfile -ExecutionPolicy Bypass -File backend\register-sync-task.ps1
```
Il task lancia `backend\run_sync.ps1` (attiva la venv, esegue `run_sync.py`, logga in
`sync.log`). Ogni connettore gira isolato: un errore su una piattaforma non ferma le
altre e finisce in `sync_log`.

> **Prerequisito:** Postgres acceso. Quello portable **non riparte dopo il reboot** → per
> il cron usa Postgres come servizio (sotto) oppure avvia `start.ps1` al boot.

## Postgres in produzione

In locale gira un Postgres **portable** (cartella `savant-postgres`, comodo ma non riparte
da solo). Per reggere il sync notturno, in produzione:
- installa l'**installer ufficiale** PostgreSQL come **servizio Windows** (riparte al boot), oppure
- usa un **container** (`docker run postgres`) con volume persistente.

In entrambi i casi mantieni lo stesso `DATABASE_URL` nel `.env`: nessun'altra modifica al codice.

## Quando arriva l'accesso admin Meta

1. Genera il **System User token** nel Business Manager di Savant (scope `ads_read`).
2. In `.env` valorizza:
   ```
   META_ACCESS_TOKEN=<il-token>
   META_AD_ACCOUNTS=act_xxxxxxxxx,act_yyyyyyyyy
   ```
3. Lancia il sync reale:
   ```bash
   python run_sync.py
   ```
   Il connettore Meta inizia a scrivere dati veri in `ad_metrics`. La dashboard
   non cambia: legge le stesse colonne.

## Prossimi passi

- [x] Endpoint API che serve `ad_metrics_enriched` al frontend (FastAPI: `backend/api.py`)
- [x] Tab "Panoramica account" (kontoöversikt) con stato sync (`GET /api/accounts`)
- [x] Sync robusto: ogni connettore isolato, esito in `sync_log`
- [x] Connettore Google Ads (Explorer Access; serve solo valorizzare il `.env`)
- [x] Mappatura account → cliente (`map_accounts.py`) per il budget reale
- [x] Alert su sforamento budget per cliente (in dashboard)
- [x] Sync notturno automatico (Task Scheduler: `register-sync-task.ps1`)
- [ ] Connettore Snapchat Marketing API (stesso pattern di Google)
- [ ] Postgres come servizio/container in produzione (vedi sezione dedicata)
- [ ] Alert budget anche via email/Slack nel job di sync (oggi: solo in dashboard)

## Sicurezza

I segreti stanno **solo** in `.env` (ignorato da git via `.gitignore`). Nessuna chiave
nel codice. Questo previene il tipo di fuga finita nella history di GitHub.

> Per la guida passo-passo completa (dal computer vuoto alla dashboard funzionante),
> vedi [`GUIDA.md`](GUIDA.md).
