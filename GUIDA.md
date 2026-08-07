# Steg-för-steg-guide — Savant Ads Dashboard

> 💡 **Vill du bara se dashboarden?** Då räcker `cd web && npm install && npm run dev`
> — ingen databas, inga nycklar. Den här guiden är för att sätta upp **hela** kedjan
> med Postgres och den nattliga synken. Översikt: [`README.md`](README.md)
> (italiensk kopia: [`README.it.md`](README.it.md)).

Från tom dator till fungerande dashboard. Följ blocken i ordning.
Kommandona gäller **macOS / Linux**; där Windows skiljer sig anges det med `▸ Windows`.

> Uppskattad tid: 20–30 minuter första gången (exklusive nedladdning av programmen).

---

## Innehåll

1. Vad du behöver ha installerat
2. Förbereda projektet
3. Skapa Postgres-databasen
4. Konfigurera Python-backenden
5. Ställa in `.env`-filen
6. Fylla på med demodata
7. Starta dashboarden
8. Kontrollera att allt fungerar
9. Koppla Meta (när du har admin-åtkomst)
10. Automatisera synken
11. Lägga till Google och Snapchat (längre fram)
12. Säkerhetschecklista
13. Vanliga problem

---

## 1. Vad du behöver ha installerat

Kontrollera att du har dessa tre program. Öppna terminalen och verifiera versionerna:

```bash
python3 --version     # kräver 3.10 eller senare
psql --version        # PostgreSQL 14 eller senare
node --version        # 18 eller senare (för dashboarden)
```

Om något saknas:
- **Python** → python.org/downloads
- **PostgreSQL** → postgresql.org/download (på macOS alternativt: `brew install postgresql@16`)
- **Node** → nodejs.org (LTS-versionen)

`▸ Windows`: efter att du installerat Postgres, se till att `psql` finns i PATH, eller använd programmet "SQL Shell (psql)" från Start-menyn.

---

## 2. Förbereda projektet

Lägg mappen `savant-ads-dashboard` där du vill och gå in i den:

```bash
cd ~/projekt/savant-ads-dashboard      # anpassa sökvägen till din
ls
```

Du ska se: `backend/`, `frontend-dashboard.jsx`, `README.md`, `.env.example`, `.gitignore`.

---

## 3. Skapa Postgres-databasen

Skapa en tom databas med namnet `savant_ads`:

```bash
createdb savant_ads
```

Om `createdb` inte finns eller ger fel, gå in i psql och skapa den manuellt:

```bash
psql postgres
```
```sql
CREATE DATABASE savant_ads;
\q
```

`▸ Windows`: öppna "SQL Shell (psql)", tryck Enter tills lösenordsfrågan, kör sedan
`CREATE DATABASE savant_ads;` och `\q`.

Du behöver inte skapa tabellerna manuellt: det sköter skriptet vid första körningen.

---

## 4. Konfigurera Python-backenden

Skapa en virtuell miljö (isolerar projektets bibliotek) och installera beroendena:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate            # ▸ Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

När miljön är aktiv ser du `(.venv)` i början av terminalraden.
Arbeta hädanefter alltid med miljön aktiv. För att avaktivera den: `deactivate`.

---

## 5. Ställa in `.env`-filen

Kopiera exempelfilen och öppna den:

```bash
cp ../.env.example ../.env
```

Öppna `.env` (i projektets huvudmapp) i en editor och kontrollera databasraden.
Om Postgres kör lokalt utan lösenord fungerar det som det är:

```
DATABASE_URL=postgresql://localhost:5432/savant_ads
```

Om din Postgres har användare och lösenord, använd det här formatet:

```
DATABASE_URL=postgresql://användare:lösenord@localhost:5432/savant_ads
```

Fälten `META_ACCESS_TOKEN` och `META_AD_ACCOUNTS` **lämnar du tomma tills vidare** —
du fyller i dem i steg 9 när du har åtkomsten. Utan token kör systemet
utan problem på demodata.

> ⚠️ Filen `.env` ska aldrig läggas på git: den är redan exkluderad via `.gitignore`.

---

## 6. Fylla på med demodata

Generera realistisk men påhittad data (30 dagar, 3 plattformar, 3 kunder):

```bash
python run_sync.py --seed
```

Förväntad output, ungefär så här:

```
[seed] scritte 360 righe di esempio su 3 piattaforme.
```

Ser du detta fungerar databas och backend. Du kan kontrollera datan:

```bash
psql savant_ads -c "SELECT platform, count(*), round(sum(spend)) AS spesa FROM ad_metrics GROUP BY platform;"
```

---

## 7. Starta dashboarden

Dashboarden är Next.js-appen i `web/`. Den behöver **varken databas eller nycklar**
för att starta — den kör på genererad demodata:

```bash
cd web
npm install        # endast första gången
npm run dev        # http://localhost:3000
```

Det räcker för att se hela gränssnittet: sex vyer, svenska/engelska, ljust/mörkt läge.

**Vill du se datan från databasen** i stället för demodatan, starta läs-API:et i en
andra terminal och peka appen dit:

```bash
# Terminal 2 — backend-API (från mappen backend, med venv aktiv)
uvicorn api:app --reload --port 8000
```

Avkommentera sedan `rewrites` i `web/next.config.ts`. Rutterna under
`web/src/app/api/` svarar med samma JSON som `backend/api.py`, så inget i
gränssnittet behöver ändras.

> Obs: den tidigare Vite-appen (`frontend/` och `frontend-dashboard.jsx`) är
> borttagen ur repot. Stegen ovan är de som gäller.

---

## 8. Kontrollera att allt fungerar

På dashboarden ska du kunna:
- se de sex KPI-korten högst upp (kostnad, visningar, klick, konverteringar, ROAS, CPA);
- använda språkväxlaren **EN / SV** uppe till höger: gränssnittet växlar mellan engelska
  och svenska (även talens avgränsare); valet sparas vid omladdning;
- klicka på filtren **Meta / Google / Snapchat** och se siffrorna ändras;
- byta intervallet **7 / 14 / 30 dagar**;
- se staplarna för **budget per kund** och tabellen med **kampanjer**.

Om siffrorna reagerar på filtren och språket byts med växlaren fungerar flödet data → vy.

---

## 9. Koppla Meta (när du har admin-åtkomst)

Det här är steget som i dag är blockerat i väntan på Rebecca. När hon har lagt till
dig som admin/redaktör i Savants Business-portfölj:

**9.1 — Generera token**
1. Gå till business.facebook.com → **Business Settings**.
2. **Users → System Users** → välj (eller skapa) en system user.
3. **Generate New Token** → välj appen `Savant Media manager` → bocka i scopet **`ads_read`**.
4. Kopiera token (den visas bara en gång: spara den direkt i `.env`).

**9.2 — Hitta annonskontonas ID:n**
I Business Settings → **Accounts → Ad Accounts**: ID:t är ett nummer, i API:et används det
med prefixet `act_` (t.ex. `act_1234567890`).

**9.3 — Fyll i `.env`**
```
META_ACCESS_TOKEN=EAAG...din-token...
META_AD_ACCOUNTS=act_1234567890,act_9876543210
```

**9.4 — Snabbtest** (kontrollera att token kan läsa data, innan den fullständiga synken):
```bash
curl -G "https://graph.facebook.com/v25.0/act_1234567890/insights" \
  -d "fields=campaign_name,spend,impressions,clicks" \
  -d "date_preset=last_7d" -d "level=campaign" \
  -d "access_token=DIN_TOKEN"
```
Kommer det tillbaka en JSON med kampanjerna är du redo.

**9.5 — Kör den skarpa synken** (utan `--seed`):
```bash
cd backend && source .venv/bin/activate
python run_sync.py
```
Metas skarpa data hamnar i `ad_metrics`. Dashboarden ändras inte: den läser
samma kolumner och visar därför de riktiga siffrorna i stället för seed-datan.

---

## 10. Automatisera synken

För att slippa köra den manuellt varje dag, schemalägg `run_sync.py` varje natt.

**Med cron (macOS / Linux)** — kör `crontab -e` och lägg till (varje natt kl. 03:00):
```
0 3 * * * cd /sökväg/savant-ads-dashboard/backend && .venv/bin/python run_sync.py >> sync.log 2>&1
```

`▸ Windows`: allt är redan klart. Registrera det nattliga tasket (bara en gång):
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File backend\register-sync-task.ps1
```
Det skapar tasket **SavantAdsSync** (dagligen, 03:00) som kör `backend\run_sync.ps1`
(aktiverar venv, kör `run_sync.py`, loggar till `backend\sync.log`). För att ta bort det:
`Unregister-ScheduledTask -TaskName SavantAdsSync -Confirm:$false`.

Synken är inkrementell: varje natt hämtas bara de senaste 28 dagarna om igen (Metas
attributionsfönster) och befintliga rader uppdateras, utan dubbletter. Varje connector
körs **isolerat**: ett fel på en plattform stoppar inte de andra, och utfallet (success/error)
hamnar i `sync_log` (syns i fliken **Konton** på dashboarden).

> **Förutsättning: Postgres.** Den portabla som används lokalt **startar inte om efter en
> reboot**, så det nattliga tasket förutsätter att den redan är igång. I produktion, installera
> PostgreSQL med den **officiella installern som tjänst** (startar om vid boot) eller som
> **container** med persistent volym; behåll samma `DATABASE_URL`. Lokalt kan du alternativt
> köra `C:\Users\loren\savant-postgres\start.ps1` vid uppstart.

---

## 11. Google (redan klart) och Snapchat (längre fram)

**Google Ads** — connectorn (`backend/connectors/google.py`) **är redan skriven**. Det enda
som behövs är att fylla i uppgifterna i `.env` (Explorer Access ges direkt, ingen väntan):
```
GOOGLE_DEVELOPER_TOKEN=...   GOOGLE_CLIENT_ID=...   GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...     GOOGLE_CUSTOMER_IDS=123-456-7890
# GOOGLE_LOGIN_CUSTOMER_ID=...  (förvaltarkonto/MCC, valfritt)
```
Kör sedan `python run_sync.py`: Google-datan hamnar i `ad_metrics` och dyker upp när du
filtrerar på "google". Efter den första skarpa synken, koppla kontona till kunderna för budgeten:
```bash
python map_accounts.py --list
python map_accounts.py --account 1234567890 --client "Blomlyckan" --budget 5000
```

**Snapchat** — görs enligt samma mönster: en klass i
`backend/connectors/snapchat.py` som ärver från `BaseConnector`, implementerar `fetch()`
och returnerar `list[MetricRow]`; lägg sedan till den i `run_sync.py → build_connectors()`.
Databas och dashboard rörs inte.

---

## 12. Säkerhetschecklista

Ska alltid följas (täcker Rebeccas punkt #3):
- [ ] `.env` finns med i `.gitignore` och syns **inte** i `git status`.
- [ ] Ingen token eller nyckel är skriven direkt i `.py`-filerna.
- [ ] Meta-token är en **System User-token** (inte personlig), så den slutar inte
      fungera om personen byts ut.
- [ ] I produktion ligger hemligheterna i en secret manager, inte i en fil på servern.

Snabb kontroll att inga hemligheter spåras av git:
```bash
git status --ignored | grep .env      # .env ska visas som "ignored"
```

---

## 13. Vanliga problem

| Symtom | Trolig orsak | Lösning |
|---|---|---|
| `could not connect to server` | Postgres är inte startad | Starta Postgres (`brew services start postgresql@16` eller från tjänstepanelen) |
| `database "savant_ads" does not exist` | Databasen är inte skapad | Gör om steg 3 |
| `ModuleNotFoundError: psycopg2` | Virtuella miljön är inte aktiv | `source .venv/bin/activate` och installera om requirements |
| `Meta non configurato — lo salto` | Tom token i `.env` | Normalt tills du har åtkomsten; använd `--seed` |
| Meta-fel `code 17` | Rate limit har nåtts | Connectorn försöker igen själv med väntetid; invänta återställningen |
| Meta-fel `code 190` | Utgången/ogiltig token | Generera om System User-token (steg 9.1) |
| Dashboarden är tom | Ingen data i databasen | Kör `python run_sync.py --seed` |

---

Fastnar du på ett steg, skicka det exakta felmeddelandet och stegets nummer:
det löser sig snabbt.
