# Guida passo-passo — Savant Ads Dashboard

Dal computer vuoto alla dashboard funzionante. Segui i blocchi in ordine.
I comandi sono per **macOS / Linux**; dove Windows cambia, è indicato con `▸ Windows`.

> Tempo stimato: 20–30 minuti la prima volta (escluso il download dei programmi).

---

## Indice

1. Cosa ti serve installato
2. Preparare il progetto
3. Creare il database Postgres
4. Configurare il backend Python
5. Impostare il file `.env`
6. Popolare con dati di prova
7. Avviare la dashboard
8. Verificare che tutto funzioni
9. Collegare Meta (quando hai l'accesso admin)
10. Automatizzare il sync
11. Aggiungere Google e Snapchat (più avanti)
12. Checklist sicurezza
13. Problemi comuni

---

## 1. Cosa ti serve installato

Controlla di avere questi tre programmi. Apri il terminale e verifica le versioni:

```bash
python3 --version     # serve 3.10 o superiore
psql --version        # PostgreSQL 14 o superiore
node --version        # 18 o superiore (per la dashboard)
```

Se manca qualcosa:
- **Python** → python.org/downloads
- **PostgreSQL** → postgresql.org/download (su macOS in alternativa: `brew install postgresql@16`)
- **Node** → nodejs.org (versione LTS)

`▸ Windows`: dopo aver installato Postgres, assicurati che `psql` sia nel PATH, oppure usa il programma "SQL Shell (psql)" dal menu Start.

---

## 2. Preparare il progetto

Metti la cartella `savant-ads-dashboard` dove preferisci e spostati dentro:

```bash
cd ~/progetti/savant-ads-dashboard      # adatta il percorso al tuo
ls
```

Devi vedere: `backend/`, `frontend-dashboard.jsx`, `README.md`, `.env.example`, `.gitignore`.

---

## 3. Creare il database Postgres

Crea un database vuoto chiamato `savant_ads`:

```bash
createdb savant_ads
```

Se `createdb` non esiste o dà errore, entra in psql e crealo a mano:

```bash
psql postgres
```
```sql
CREATE DATABASE savant_ads;
\q
```

`▸ Windows`: apri "SQL Shell (psql)", premi Invio fino alla password, poi esegui
`CREATE DATABASE savant_ads;` e `\q`.

Non serve creare le tabelle a mano: ci pensa lo script al primo avvio.

---

## 4. Configurare il backend Python

Crea un ambiente virtuale (isola le librerie del progetto) e installa le dipendenze:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate            # ▸ Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Quando l'ambiente è attivo, vedi `(.venv)` all'inizio della riga del terminale.
Da qui in poi lavora sempre con l'ambiente attivo. Per disattivarlo: `deactivate`.

---

## 5. Impostare il file `.env`

Copia il file di esempio e aprilo:

```bash
cp ../.env.example ../.env
```

Apri `.env` (nella cartella principale del progetto) con un editor e controlla la riga del database.
Se Postgres gira in locale senza password, va bene così:

```
DATABASE_URL=postgresql://localhost:5432/savant_ads
```

Se il tuo Postgres ha utente e password, usa questo formato:

```
DATABASE_URL=postgresql://utente:password@localhost:5432/savant_ads
```

I campi `META_ACCESS_TOKEN` e `META_AD_ACCOUNTS` **lasciali vuoti per ora** —
li riempirai al passo 9 quando avrai l'accesso. Senza token, il sistema gira
tranquillamente sui dati di prova.

> ⚠️ Il file `.env` non va mai messo su git: è già escluso dal `.gitignore`.

---

## 6. Popolare con dati di prova

Genera dati finti realistici (30 giorni, 3 piattaforme, 3 clienti):

```bash
python run_sync.py --seed
```

Output atteso, qualcosa tipo:

```
[seed] scritte 360 righe di esempio su 3 piattaforme.
```

Se vedi questo, database e backend funzionano. Puoi controllare i dati:

```bash
psql savant_ads -c "SELECT platform, count(*), round(sum(spend)) AS spesa FROM ad_metrics GROUP BY platform;"
```

---

## 7. Avviare la dashboard

La dashboard è il file `frontend-dashboard.jsx`. Due modi per vederla:

**A) Subito, nell'anteprima** — è la stessa che hai già visto in chat: si apre
direttamente con i dati seed incorporati, senza configurare nulla.

**B) Come progetto vero (consigliato)** — l'app Vite è **già pronta** in `frontend/`
(React + Tailwind + recharts; `frontend/src/App.jsx` è già collegato all'API). Servono
due terminali:

```bash
# Terminale 1 — backend API (dalla cartella backend, con la venv attiva)
uvicorn api:app --reload --port 8000

# Terminale 2 — frontend
cd frontend
npm install        # solo la prima volta
npm run dev
```

Apri il link che compare (di solito `http://localhost:5173`). Con l'API accesa la
dashboard mostra i **dati reali** del DB (badge **live-data**); con l'API spenta usa i
dati seed incorporati (badge **testdata**), quindi niente pagina bianca.

> Nota: `frontend-dashboard.jsx` nella radice resta la copia "sorgente" della dashboard;
> `frontend/src/App.jsx` ne è una copia identica. Se modifichi uno, riallinea l'altro.

---

## 8. Verificare che tutto funzioni

Sulla dashboard devi poter:
- vedere le sei card di KPI in alto (spesa, impression, click, conversioni, ROAS, CPA);
- usare il toggle lingua **EN / SV** in alto a destra: l'interfaccia passa tra inglese
  e svedese (anche i separatori dei numeri); la scelta resta salvata al ricaricamento;
- cliccare i filtri **Meta / Google / Snapchat** e veder cambiare i numeri;
- cambiare l'intervallo **7 / 14 / 30 giorni**;
- vedere le barre del **budget per cliente** e la tabella delle **campagne**.

Se i numeri rispondono ai filtri e la lingua cambia col toggle, il flusso dati → vista funziona.

---

## 9. Collegare Meta (quando hai l'accesso admin)

Questo è il passo che oggi è bloccato in attesa di Rebecca. Quando ti ha aggiunto
come admin/editor al Business portfolio di Savant:

**9.1 — Genera il token**
1. Vai su business.facebook.com → **Business Settings**.
2. **Users → System Users** → seleziona (o crea) un system user.
3. **Generate New Token** → scegli l'app `Savant Media manager` → spunta lo scope **`ads_read`**.
4. Copia il token (lo vedi una volta sola: salvalo subito nel `.env`).

**9.2 — Trova gli ID degli account pubblicitari**
In Business Settings → **Accounts → Ad Accounts**: l'ID è un numero, nell'API si usa
con il prefisso `act_` (es. `act_1234567890`).

**9.3 — Compila il `.env`**
```
META_ACCESS_TOKEN=EAAG...il-tuo-token...
META_AD_ACCOUNTS=act_1234567890,act_9876543210
```

**9.4 — Test rapido** (verifica che il token legga i dati, prima del sync completo):
```bash
curl -G "https://graph.facebook.com/v25.0/act_1234567890/insights" \
  -d "fields=campaign_name,spend,impressions,clicks" \
  -d "date_preset=last_7d" -d "level=campaign" \
  -d "access_token=IL_TUO_TOKEN"
```
Se torna un JSON con le campagne, sei pronto.

**9.5 — Lancia il sync reale** (senza `--seed`):
```bash
cd backend && source .venv/bin/activate
python run_sync.py
```
I dati veri di Meta entrano in `ad_metrics`. La dashboard non cambia: legge le
stesse colonne, quindi mostrerà i numeri reali al posto del seed.

---

## 10. Automatizzare il sync

Per non lanciarlo a mano ogni giorno, schedula `run_sync.py` ogni notte.

**Con cron (macOS / Linux)** — esegui `crontab -e` e aggiungi (ogni notte alle 03:00):
```
0 3 * * * cd /percorso/savant-ads-dashboard/backend && .venv/bin/python run_sync.py >> sync.log 2>&1
```

`▸ Windows`: è già pronto. Registra il task notturno (una volta sola):
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File backend\register-sync-task.ps1
```
Crea il task **SavantAdsSync** (giornaliero, 03:00) che lancia `backend\run_sync.ps1`
(attiva la venv, esegue `run_sync.py`, logga in `backend\sync.log`). Per rimuoverlo:
`Unregister-ScheduledTask -TaskName SavantAdsSync -Confirm:$false`.

Il sync è incrementale: ogni notte ri-scarica solo gli ultimi 28 giorni (la finestra
di attribuzione di Meta) e aggiorna le righe esistenti, senza duplicare. Ogni connettore
gira **isolato**: un errore su una piattaforma non ferma le altre, e l'esito (success/error)
finisce in `sync_log` (visibile nella tab **Konton** della dashboard).

> **Prerequisito Postgres.** Quello portable usato in locale **non riparte dopo un
> reboot**, quindi il task notturno lo presuppone già acceso. In produzione installa
> PostgreSQL con l'**installer ufficiale come servizio** (riparte al boot) o un
> **container** con volume persistente; mantieni lo stesso `DATABASE_URL`. In locale,
> in alternativa, avvia `C:\Users\loren\savant-postgres\start.ps1` all'accensione.

---

## 11. Google (già pronto) e Snapchat (più avanti)

**Google Ads** — il connettore (`backend/connectors/google.py`) **è già scritto**. Serve
solo valorizzare le credenziali nel `.env` (Explorer Access è immediato, niente attesa):
```
GOOGLE_DEVELOPER_TOKEN=...   GOOGLE_CLIENT_ID=...   GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...     GOOGLE_CUSTOMER_IDS=123-456-7890
# GOOGLE_LOGIN_CUSTOMER_ID=...  (manager/MCC, opzionale)
```
Poi `python run_sync.py`: i dati Google entrano in `ad_metrics` e compaiono filtrando su
"google". Dopo il primo sync reale, collega gli account ai clienti per il budget:
```bash
python map_accounts.py --list
python map_accounts.py --account 1234567890 --client "Blomlyckan" --budget 5000
```

**Snapchat** — da fare con lo stesso pattern: una classe in
`backend/connectors/snapchat.py` che eredita da `BaseConnector`, implementa `fetch()`
e ritorna `list[MetricRow]`; poi aggiungila a `run_sync.py → build_connectors()`.
DB e dashboard non si toccano.

---

## 12. Checklist sicurezza

Da rispettare sempre (copre il punto #3 di Rebecca):
- [ ] `.env` è elencato nel `.gitignore` e **non** compare in `git status`.
- [ ] Nessun token o chiave è scritto dentro i file `.py`.
- [ ] Il token Meta è un **System User token** (non personale), così non si rompe
      se cambia la persona.
- [ ] In produzione, i segreti stanno in un secret manager, non in un file sul server.

Verifica veloce che nessun segreto sia tracciato da git:
```bash
git status --ignored | grep .env      # .env deve risultare "ignored"
```

---

## 13. Problemi comuni

| Sintomo | Causa probabile | Soluzione |
|---|---|---|
| `could not connect to server` | Postgres non avviato | Avvia Postgres (`brew services start postgresql@16` o dal pannello servizi) |
| `database "savant_ads" does not exist` | DB non creato | Rifai il passo 3 |
| `ModuleNotFoundError: psycopg2` | Ambiente virtuale non attivo | `source .venv/bin/activate` e reinstalla i requirements |
| `Meta non configurato — lo salto` | Token vuoto nel `.env` | Normale finché non hai l'accesso; usa `--seed` |
| Errore Meta `code 17` | Rate limit raggiunto | Il connettore riprova da solo con attesa; aspetta il reset |
| Errore Meta `code 190` | Token scaduto/non valido | Rigenera il System User token (passo 9.1) |
| La dashboard è vuota | Nessun dato nel DB | Lancia `python run_sync.py --seed` |

---

Se ti blocchi su un passo, segnami il messaggio d'errore esatto e il numero del
passo: si risolve in fretta.
