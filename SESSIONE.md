# Sessionslogg — bygget av Savant Ads Dashboard

**Datum:** 2026-06-26
**Från:** tom mapp → komplett och verifierat system (DB → API → dashboard)

Det här dokumentet sammanfattar chatten där projektet byggdes: vad som
efterfrågades, vad som gjordes, vilka beslut som togs och vilka verifieringar som klarades.

---

## 1. Mål

Bygga hela projektet **Savant Ads Dashboard**: enad annonsrapportering
(Meta · Google · Snapchat) → Postgres → React-dashboard. Utgångsmappen
var tom.

## 2. Underlag som lämnades under chatten

Användaren klistrade in, i flera meddelanden, den kompletta källkoden för modulerna:

- `frontend-dashboard.jsx` (React-dashboard på seed-data)
- `README.md` (översikt + arkitekturdiagram)
- `backend/schema.sql`, `models.py`, `config.py`, `db.py`, `run_sync.py`
- `backend/connectors/base.py`, `backend/connectors/meta.py`
- `.gitignore`, `backend/requirements.txt`

Alltså inte en designuppgift, utan: **lägga filerna på plats, fylla luckorna,
verifiera, och sedan bygga ut** enligt de efterföljande önskemålen.

## 3. Önskemål, i ordning

1. **"Build the whole project"** → alla tillhandahållna filer lades på plats + saknade filer.
2. **"dashboarden ska ha engelska och svenska med toggle"** → i18n EN/SV lades till.
3. **"vad behöver göras?"** → återstående steg listades (Postgres saknades, liksom Meta-åtkomst).
4. **"gör allt du"** → Postgres installerades, DB skapades, seed end-to-end, standardspråk → svenska.
5. **"skapa det"** (API-endpointen + ansluten frontend) → FastAPI-API + Vite-app byggdes.
6. **"skapa en markdown av den här chatten"** → den här filen.

---

## 4. Vad som byggdes

### Filer verbatim (från användaren)
`README.md`, `frontend-dashboard.jsx`, `.gitignore`, `backend/requirements.txt`,
`backend/{config,models,db,run_sync}.py`, `backend/schema.sql`,
`backend/connectors/{base,meta}.py`.

### Filer som lades till för att fylla luckorna
- `.env.example` — speglar variablerna som läses av `config.py`.
- `backend/connectors/__init__.py` — paketmarkör.
- `GUIDA.md` — steg-för-steg-guiden (sparad på begäran).

### En godkänd avvikelse
- `config.py`: en **`.env`-laddare utan beroenden** (`_load_dotenv`) lades till, eftersom
  det dokumenterade arbetsflödet `cp .env.example .env` annars inte hade laddat något
  (Meta-token och cron hade läst tomma värden). `setdefault` → i produktion vinner
  secret managern.

### Utbyggnader (önskemål 2, 4, 5)
- **i18n EN/SV** i `frontend-dashboard.jsx`: strängar i `STRINGS`, toggle i headern,
  valet sparas i `localStorage`, talformatering per språk (avgränsare,
  decimaler, mellanslag före `%`). Standard → **svenska**.
- **`backend/api.py`** — FastAPI, endast läsning: `GET /api/metrics` (+ `?since=`, `/health`,
  CORS) som serverar vyn `ad_metrics_enriched`.
- **`backend/db.py`** — `fetch_enriched()` med JSON-serialisering (Decimal→float, date→ISO).
- **`frontend/`** — Vite-app + React 19 + **Tailwind v4** + recharts, proxy `/api → 127.0.0.1:8000`.
  `src/App.jsx` = kopia av `frontend-dashboard.jsx`.
- Dashboarden **provar nu API:et och faller tillbaka på seed-datan** om API:et är avstängt;
  dynamisk badge **live-data / testdata**.

### Slutlig struktur
```
savantmedia-meta-dashboard/
├── .env.example   ·  .env (lokal, inte i git)
├── .gitignore  ·  README.md  ·  GUIDA.md  ·  SESSIONE.md
├── frontend-dashboard.jsx          (dashboardkälla, fristående)
├── backend/
│   ├── requirements.txt  ·  config.py  ·  models.py  ·  db.py
│   ├── schema.sql  ·  run_sync.py  ·  api.py
│   └── connectors/  __init__.py · base.py · meta.py
└── frontend/                       (Vite-app: vite.config.js, src/App.jsx, …)
```

---

## 5. Postgres-installation (portabel, utan admin)

Maskinen hade inget Postgres (inget på `:5432`, ingen `psql`, ingen Docker) och
skalet **kördes inte som admin** → tjänstinstalleraren hade krävt en UAC-prompt.
Val: **portabla binärer**, skriptbara och reversibla (det räcker att radera mappen).

- PostgreSQL-binärerna **17.5** (~307 MB) laddades ner → extraherades till `C:\Users\loren\savant-postgres`.
- `initdb` med auth **trust**, superuser = systemanvändaren `loren`.
- Servern startades på `:5432`; databasen `savant_ads` skapades.
- Hjälpskript: `C:\Users\loren\savant-postgres\start.ps1` / `stop.ps1`.

> Känd begränsning: eftersom den är portabel **startar den inte om av sig själv efter en omstart** → använd `start.ps1`.
> För produktion/cron: officiell installerare som tjänst.

---

## 6. Klarade verifieringar

| Verifiering | Utfall |
|---|---|
| `py_compile` + smoke test av importer (6 backendmoduler) | ✅ |
| `.env`-laddaren (testfil → värden lästes, sedan borttagen) | ✅ `meta_is_configured=True` |
| Parsning av `frontend-dashboard.jsx` (esbuild) | ✅ |
| `python run_sync.py --seed` | ✅ **360 rader** (30 d × 3 plattformar × 4 kampanjer) |
| DB-fråga: 120 rader/plattform; vy med ROAS + kundbudget | ✅ |
| `db.fetch_enriched()` direkt | ✅ 360 rader, korrekt JSON |
| `GET /api/metrics` via HTTP | ✅ 360 rader (`?since=2026-06-20` → 84) |
| `npm run build` (Tailwind + recharts + React 19) | ✅ 442 moduler |
| **End-to-end**: `:5173/api/metrics` → proxy → FastAPI → Postgres | ✅ **360 rader** |

Demonstrerad kedja:
```
browser → Vite proxy :5173/api → FastAPI :8000 → db.fetch_enriched → Postgres → ad_metrics_enriched
```

---

## 7. Så startas systemet

```powershell
# 0) Postgres igång (för att starta om det efter en omstart)
& "C:\Users\loren\savant-postgres\start.ps1"

# 1) Backend-API — från backend\, med venv aktiverad
uvicorn api:app --reload --port 8000

# 2) Frontend — från frontend\
npm run dev        # http://localhost:5173  → badge "live-data"
```
Med API:et avstängt använder dashboarden den inbyggda seed-datan (badge "testdata").

---

## 8. Vad som återstår (roadmap)

- [ ] **Meta**: väntar på Rebeccas admin-åtkomst → token + `META_AD_ACCOUNTS` i
      `.env`, sedan `python run_sync.py` (connectorn är redan klar).
- [ ] Mappa de riktiga annonskontona till kunderna (`accounts.client_id`) för budgetpanelen.
- [ ] Connector för Google Ads (developer token: långsamt godkännande, starta det tidigt).
- [ ] Connector för Snapchat Marketing API.
- [ ] Nattlig schemaläggning av `run_sync.py` (cron / Task Scheduler).
- [ ] Larm vid budgetöverskridande per kund.

---

## 9. Säkerhetsnoteringar

- Hemligheterna ligger **endast** i `.env` (ignoreras av git via `.gitignore`); inga nycklar
  i koden. Meta-token ska vara en **System User-token** (inte personlig).
- I produktion: hemligheter i en secret manager, inte i en fil på servern.

---

## 10. Handoff — slutförande (Task 1–7)

Utbyggnader som byggdes efter den första end-to-end-kedjan, i handoffens ordning.

| Task | Vad | Utfall |
|---|---|---|
| 1 | Robust synk: `start_sync_log`/`finish_sync_log` i `db.py`; varje connector i try/except i `run_sync.py` | ✅ testad (en connector som felar stoppar inte de andra; rader i `sync_log`) |
| 2 | `GET /api/accounts` + fliken **Konton** (kontoöversikt) med badge för synkstatus; i18n EN/SV | ✅ testad (HTTP: 3 konton, `?since=` filtrerar) |
| 3 | Connector för **Google Ads** (`connectors/google.py`, GAQL via REST/OAuth2) + config + `.env.example` + `build_connectors()` | ✅ kompilering + enhetstest av mappningen (`cost_micros`→spend, camelCase). Skarp körning: kräver uppgifter |
| 4 | Mappning konto→kund: `assign_client`/`list_account_mapping` + CLI `map_accounts.py` | ✅ testad (`--list`, assign 1/0) |
| 5 | Nattlig synk: `run_sync.ps1` (UTF-8-logg) + `register-sync-task.ps1` (Task Scheduler 03:00) | ✅ testad (`run_sync.ps1` exit 0, ren logg) |
| 6 | Budgetlarm per kund (≥90% av månadsbudgeten) i fliken Rapportering | ✅ build OK |
| 7 | Postgres som tjänst/container i produktion | ✅ dokumenterat (README + GUIDA §10) |

**Definition av "avslutat arbete":** punkterna 1, 2, 4, 5, 6 kompletta och verifierade; punkt 3
Google klar (bara `.env` återstår att fylla i), Meta klar (väntar på Rebeccas
token). Snapchat återstår att göra med samma mönster.

### Nya filer / viktigaste ändringar
- `backend/connectors/google.py` (ny) · `backend/map_accounts.py` (ny) ·
  `backend/accounts_map.example.json` (ny)
- `backend/run_sync.ps1`, `backend/register-sync-task.ps1` (nya)
- `backend/db.py` (+ sync_log, fetch_accounts, assign_client, list_account_mapping)
- `backend/api.py` (+ `/api/accounts`) · `backend/run_sync.py` (isolering + Google) ·
  `backend/config.py` (+ Google-sektion) · `.env.example` (+ Google)
- `frontend-dashboard.jsx` och `frontend/src/App.jsx` (flikarna Rapportering/Konton + budgetlarm)
