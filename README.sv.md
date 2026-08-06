# Savant Ads — enad annonsrapportering

> 🇮🇹 Denna fil på italienska: [`README.md`](README.md) · 📨 Vad som behövs för skarp data: [`TILL-REBECCA.md`](TILL-REBECCA.md)

Meta, Google Ads och Snapchat i **en enda vy**. Ingen manuell inloggning på tre
plattformar, ingen export till Excel, inga siffror som inte går att lita på.

Systemet hämtar annonsdata varje natt, normaliserar den till en gemensam modell
och visar den i en dashboard som fungerar lika bra i mobilen som på skärmen.

---

## Innehåll

1. [Snabbstart — se demon på 60 sekunder](#snabbstart--se-demon-på-60-sekunder)
2. [Vad du ser i dashboarden](#vad-du-ser-i-dashboarden)
3. [Regeln: bara data som faktiskt går att hämta](#regeln-bara-data-som-faktiskt-går-att-hämta)
4. [Så är systemet byggt](#så-är-systemet-byggt)
5. [Projektstruktur](#projektstruktur)
6. [Från demodata till skarp data](#från-demodata-till-skarp-data)
7. [Databas och nattlig synk](#databas-och-nattlig-synk)
8. [Säkerhet](#säkerhet)
9. [Ordlista](#ordlista)
10. [Status och nästa steg](#status-och-nästa-steg)
11. [Felsökning](#felsökning)

---

## Snabbstart — se demon på 60 sekunder

```bash
cd web
npm install
npm run dev
```

Öppna **http://localhost:3000**.

Det är allt. **Ingen databas, inga API-nycklar, ingen backend behövs.** Dashboarden
körs på genererad demodata så att den går att visa och diskutera redan innan
åtkomsten till annonskontona är på plats.

Att siffrorna är genererade döljs inte: det står **DEMO** uppe i vänstra hörnet och
en ruta högst upp på startsidan förklarar det. Men *strukturen* är äkta — varje
kolumn motsvarar ett riktigt fält i Meta-, Google- eller Snapchat-API:et, och sidan
**Datakällor** visar exakt vilket.

Demodatan innehåller 5 kunder, 11 annonskonton, 31 kampanjer och 90 dagars historik.

---

## Vad du ser i dashboarden

Sex sidor. Gränssnittet är **mobilanpassat först** (bottenmeny i telefonen,
sidomeny på datorn), finns på **svenska och engelska** (växlas uppe i hörnet) och
har **ljust och mörkt läge**.

### 1. Översikt

Helheten på en skärm.

- **Nyckeltal** för perioden med förändring mot föregående lika lång period:
  total kostnad, konverteringar, ROAS, klick, visningar, videovisningar.
  Varje ruta har en minigraf som visar utvecklingen dag för dag.
- **Daglig kostnad per plattform** — staplad yta, så att summan av ytorna är den
  faktiska totalkostnaden den dagen. För muspekaren över grafen och du får alla
  plattformarnas siffror för den dagen samtidigt. Knappen **Tabellvy** byter till
  en tabell med samma data (samma siffror, ingen färg som krävs för att läsa dem).
- **Kostnad per plattform** — hovra över en stapel för att få klick, CTR, CPC,
  konverteringar, CPA, ROAS, räckvidd och frekvens för just den plattformen.
- **Från visning till konvertering** — visningar → klick → konverteringar, med
  CTR och konverteringsgrad mellan stegen.
- **Budgetpacing per kund** — det viktigaste blocket för månadsavstämningen. Se
  nedan.
- **Största kampanjer** — de sex som drar mest budget, klickbara.

### 2. Kampanjer

Varje kampanj som levererat under perioden, en rad per kampanj. Sorterbar på alla
kolumner (kostnad, visningar, klick, CTR, CPC, konverteringar, CPA, ROAS) och
sökbar på kampanj- eller kundnamn.

I telefonen blir varje rad ett kort med de fyra viktigaste talen — en tabell med
åtta sifferkolumner går inte att läsa på en mobilskärm.

Klicka på en kampanj för att få **kampanjdetaljen**:

- nyckeltal för just den kampanjen, inklusive räckvidd och frekvens där
  plattformen ger dem
- daglig kostnadskurva
- fördelningar på **placering, enhet, ålder, kön och land** — hämtade med
  plattformens egna breakdown-parametrar, med parameternamnet utskrivet
- kampanjens inställningar: mål, budstrategi, dagsbudget, konverteringsåtgärd,
  attributionsfönster, kampanj-ID och konto-ID

Kampanj-ID:t är utskrivet så att raden går att slå upp direkt i Meta Business
Manager eller Google Ads.

### 3. Kunder

Ett kort per kund med:

- **Budgetläge**: hur mycket som är spenderat hittills i månaden, **prognos för
  hela månaden** och den avtalade månadsbudgeten. Mätaren har ett litet streck
  som visar var kostnaden *borde* ligga idag om budgeten förbrukades jämnt — utan
  det strecket säger "62 % av budgeten" ingenting, för 62 % är utmärkt den 20:e
  och alarmerande den 8:e.
- **Status**: Över budget · Nära gränsen · I fas · Under budget. Statusen sätts på
  prognosen, inte på det som redan är spenderat, så larmet kommer i tid.
- Resultat i perioden: kostnad, konverteringar, CPA, ROAS.
- Fördelning per plattform.
- En markering om kunden är en **leadkund** — då är CPA nyckeltalet, inte ROAS.

### 4. Insikter

Fördelningar per plattform på fem dimensioner: **placering, enhet, ålder, kön,
land**. Under varje rubrik står den API-parameter som ger just den fördelningen.

Taxonomierna slås medvetet **inte** ihop mellan plattformarna. Meta använder
åldersintervallen 18–24, 25–34, 35–44 …; Snapchat använder 13–17, 18–20, 21–24,
25–34, 35+; Google har dessutom en "Okänd"-hink. Att lägga ihop dem skulle ge tal
som *ser* jämförbara ut utan att vara det. Samma sak med placeringar: "Instagram ·
Reels" och "YouTube" är inte samma sorts sak.

### 5. Konton

Driftsidan.

- **Ett kort per plattform**: API-version, endpoint, behörighet, och en lista över
  vilka nycklar som är satta och vilka som saknas. Bara namnen på variablerna
  visas — **aldrig värdena**.
- **En tabell per annonskonto**: konto-ID, plattform, kund, kostnad i perioden,
  antal kampanjer, antal rader som skrivits vid senaste synken, synkstatus och
  tidpunkt.
- **"Vad som saknas för skarp data"** — en konkret lista över de miljövariabler
  som fortfarande är tomma, per plattform.

### 6. Datakällor

Kontraktet. För varje siffra i dashboarden: vilket API, vilken endpoint, vilket
fältnamn, och vilken fallgrop som måste hanteras. Sidan listar också **vad
API:erna inte ger** — lika viktigt, för det förklarar varför vissa självklara
kolumner saknas.

---

## Regeln: bara data som faktiskt går att hämta

> Varje tal som visas ska motsvara ett fält som verkligen går att läsa med en
> API-nyckel. Inga uppskattningar, inga påhittade mätvärden.

Det låter självklart men är det inte: de flesta annonsdashboards fyller luckor med
gissningar. Här är fyra ställen där regeln syns direkt i gränssnittet.

### ROAS visas som "–", aldrig som 0

ROAS kan bara räknas om konverteringsåtgärden har ett **värde** konfigurerat i
plattformen. För ett köp finns ett ordervärde. För ett lead — en jobbansökan, en
bokad tid — finns oftast inget värde alls.

En nolla skulle betyda "kampanjen har inte gett något tillbaka", vilket är fel om
kampanjen levererar leads till en bra kostnad. Därför står det ett streck, och
kunden är markerad som leadkund så att man tittar på CPA istället.

### Räckvidd summeras aldrig per dag — och finns inte alls för Google

Räckvidd är **deduplicerad**: samma person som ser annonsen tre dagar i rad räknas
en gång, inte tre. Att lägga ihop dagliga räckviddstal ger därför ett tal som är
för högt och saknar mening. Siffran hämtas som ett eget anrop över hela perioden.

**Google Ads API exponerar ingen räckvidd per kampanj och dag.** Den kolumnen är
tom — inte uppskattad utifrån visningar.

Och det finns **ingen räckvidd över plattformsgränsen**: ingen plattform kan
deduplicera mot en annan, så samma person räknas en gång per plattform. Därför
finns det medvetet inget totalt räckviddstal på Översikt.

### De senaste dagarnas konverteringar är inte färdiga

Meta använder som standard attributionsfönstret **7 dagar klick / 1 dag visning**,
Google en datadriven modell. En konvertering som sker idag kan tillskrivas ett
klick som hände för sex dagar sedan — och den dyker upp i rapporten först efteråt.

Det betyder att gårdagens siffror är **för låga** och justeras uppåt under de
följande dagarna. Grafen markerar därför de fyra senaste dagarna som "ännu inte
färdigattribuerade", och nattsynken hämtar om **28 dagar** varje gång (inte bara
gårdagen) just för att fånga upp de sena konverteringarna.

### Kvoter räknas på summor, inte som medelvärden

CTR för en månad är `totala klick ÷ totala visningar` — inte medelvärdet av de
dagliga CTR-talen. Ett medelvärde skulle väga en dag med 10 visningar lika tungt
som en dag med två miljoner. Samma sak gäller CPC, CPM, CPA och ROAS.

De sparas heller aldrig i databasen: de räknas fram vid uppslag, i SQL-vyn
`ad_metrics_enriched`. Ett sparat nyckeltal blir fel så fort någon rad uppdateras
i efterhand — vilket händer varje natt på grund av attributionsfönstret.

### Valuta

Alla belopp visas i **SEK**, kontots valuta (`account_currency` hos Meta,
`customer.currency_code` hos Google). **Ingen valutaomräkning görs.** Att summera
konton i olika valutor utan en växelkurs är ett av de vanligaste sätten att
producera felaktiga tal i en annonsrapport — om ett konto i framtiden rapporterar
i EUR måste vi ta ställning till kurs och kursdatum först.

---

## Så är systemet byggt

```
   Meta Marketing API  ─┐
                        │      ┌──────────────┐      ┌──────────┐      ┌───────────┐
   Google Ads API      ─┼─────▶│  connectors  │─────▶│ Postgres │─────▶│ dashboard │
                        │      │ (MetricRow)  │      │ad_metrics│      │ (Next.js) │
   Snapchat API        ─┘      └──────────────┘      └──────────┘      └───────────┘
                                normalisering          lagring          presentation
```

Varje plattform kallar sina mätvärden olika. Meta returnerar `spend` som en
sträng; Google returnerar `cost_micros` i miljondelar; Snapchat kallar klick för
`swipes`. **Connectorn** för varje plattform översätter detta till en gemensam
modell — `MetricRow` — och därifrån och framåt vet resten av systemet inte längre
vilken plattform datan kom ifrån.

Att lägga till en fjärde plattform är alltså att skriva en ny connector-klass.
Ingenting annat behöver ändras.

Datan lagras rå och additiv i tabellen `ad_metrics`, en rad per
plattform/konto/kampanj/dag. Dashboarden läser från vyn `ad_metrics_enriched`, som
lägger på läsbara namn och räknar fram CTR, CPC, CPM, CPA och ROAS.

Synken är **idempotent**: den skriver med en naturlig nyckel
(plattform, konto, kampanj, datum), så att hämta om samma 28 dagar varje natt
uppdaterar raderna istället för att duplicera dem.

### Teknik

| Lager | Val | Varför |
|---|---|---|
| Dashboard | Next.js 16 (App Router), TypeScript, Tailwind 4 | Renderas på servern → mobilen får färdigfiltrerad data, inte hela datamängden |
| Grafer | Handskriven SVG, inget bibliotek | Färgerna är CSS-variabler, så mörkt läge kräver inget separat tema. Noll extra KB att ladda ner |
| Backend | Python, FastAPI, `requests` | Inga tunga SDK:er — Google Ads nås via GAQL över REST |
| Databas | PostgreSQL | Vyer, naturliga nycklar, upsert |
| Schemaläggning | Windows Task Scheduler | Redan på plats på maskinen; enkelt att flytta till en server senare |

### Detaljer värda att känna till

**Filtren ligger i webbadressen** (`?d=30&p=meta,google&c=taktil`), inte i
webbläsarens minne. En länk till "Taktil Analytics, senaste 7 dagarna" går därför att
skicka vidare, bakåtknappen fungerar, och sidan renderas färdigfiltrerad på
servern. När filtret ändras ligger den gamla vyn kvar nedtonad tills den nya är
klar — ingen laddningsskelett som hoppar.

**Färgerna är validerade.** Meta blå, Google grön, Snapchat gul är körda genom ett
verktyg som mäter färgblindhetsseparation, ljushetsband och kontrast mot
bakgrunden — i både ljust och mörkt läge. Dessutom har varje graf en **tabellvy**,
så att inget värde bara går att läsa via färg.

**Språket ligger i en cookie.** Servern renderar därför direkt på rätt språk; det
blinkar aldrig till engelska innan sidan hinner rätta sig.

**Demodatan är deterministisk.** Den räknas fram från en hash av
(kampanj, datum), så talen för en viss dag ändras inte när man byter period. Går
man från 7 till 30 dagar står de redan sedda siffrorna kvar.

---

## Projektstruktur

| Sökväg | Innehåll |
|---|---|
| `web/` | **Dashboarden** (Next.js). Kör `npm run dev` här |
| `web/src/app/page.tsx` | Översikt |
| `web/src/app/kampanjer/` | Kampanjlista + kampanjdetalj |
| `web/src/app/kunder/` | Kunder och budgetläge |
| `web/src/app/insikter/` | Fördelningar per dimension |
| `web/src/app/konton/` | Anslutningar, nycklar, synklogg |
| `web/src/app/datakallor/` | Fältmappningen mot API:erna |
| `web/src/app/api/` | `/api/metrics`, `/api/accounts`, `/api/health` |
| `web/src/lib/api-catalog.ts` | **Kontraktet**: varje mätvärde → endpoint + fältnamn + fallgrop |
| `web/src/lib/demo/` | Demokatalog (kunder, konton, kampanjer) och generator |
| `web/src/lib/aggregate.ts` | Summeringar och härledda nyckeltal |
| `backend/schema.sql` | Databasschema + vyn med härledda mätvärden |
| `backend/models.py` | `MetricRow` — den gemensamma modellen |
| `backend/connectors/meta.py` | Meta Insights (asynkron rapport, retry, paginering) |
| `backend/connectors/google.py` | Google Ads (GAQL via REST, OAuth2) |
| `backend/db.py` | Idempotent upsert, `sync_log`, kontoöversikt |
| `backend/run_sync.py` | Kör synken (`--seed` för provdata) |
| `backend/map_accounts.py` | Koppla konto → kund → månadsbudget |
| `backend/api.py` | Läs-API: `GET /api/metrics`, `GET /api/accounts` |
| `backend/register-sync-task.ps1` | Registrerar den nattliga körningen |
| `frontend/`, `frontend-dashboard.jsx` | Första versionen (Vite + React). Ersatt av `web/` |

---

## Från demodata till skarp data

Fyra steg. Steg 1 är det enda som kräver något av någon annan.

### Steg 1 — Åtkomst till annonskontona

Se [`TILL-REBECCA.md`](TILL-REBECCA.md) för den fullständiga listan: vad som ska
göras, i vilken plattform, och i vilken ordning.

Kortversionen: administratörsbehörighet i Metas företagsportfölj, åtkomst till
Google Ads-förvaltarkontot samt utvecklartoken, och listan över vilken kund som
hör till vilket annonskonto och med vilken månadsbudget.

### Steg 2 — Fyll i `.env`

```bash
cp .env.example .env
```

Sedan fylls nycklarna i. Sidan **Konton** i dashboarden visar löpande vilka som
fortfarande saknas.

### Steg 3 — Kör synken

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate     # PowerShell
pip install -r requirements.txt

python run_sync.py        # hämtar senaste 28 dagarna från de plattformar som är konfigurerade
```

Varje connector körs **isolerat**: om Meta fallerar hämtar Google ändå sin data,
och felet hamnar i tabellen `sync_log` (och syns på sidan Konton).

### Steg 4 — Koppla dashboarden till databasen

Starta läs-API:et:

```bash
cd backend
uvicorn api:app --reload --port 8000
```

Avkommentera sedan `rewrites` i [`web/next.config.ts`](web/next.config.ts):

```ts
async rewrites() {
  return [{ source: "/api/:path*", destination: "http://127.0.0.1:8000/api/:path*" }];
}
```

Klart. **Ingen komponent behöver ändras** — rutterna i `web/src/app/api/` svarar
med exakt samma JSON som `backend/api.py` (samma kolumnnamn, samma format), just
för att bytet ska vara en konfigurationsrad och inte ett omskrivningsprojekt.

### Koppla konto till kund och budget

Efter första skarpa synken behöver annonskontona kopplas till kunder, annars vet
inte budgetpanelen vilken budget som gäller:

```bash
python map_accounts.py --list                        # nuvarande koppling
python map_accounts.py --file accounts_map.json      # allt på en gång, se *.example.json
python map_accounts.py --account act_123 --client "Vinterhamn AB" --budget 85000
```

---

## Databas och nattlig synk

### Automatisk körning

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File backend\register-sync-task.ps1
```

Registrerar uppgiften **SavantAdsSync** i Windows Task Scheduler, som kör
`backend\run_sync.ps1` **varje natt kl. 03:00**. Skriptet aktiverar den virtuella
miljön, kör `run_sync.py` och loggar till `backend\sync.log`.

Kontrollera: `Get-ScheduledTask -TaskName SavantAdsSync`
Ta bort: `Unregister-ScheduledTask -TaskName SavantAdsSync -Confirm:$false`

### Postgres i drift

Lokalt körs en **portabel** Postgres (mappen `savant-postgres`). Den är smidig men
**startar inte om av sig själv efter en omstart av datorn** — vilket gör att den
nattliga synken tyst slutar fungera.

För drift dygnet runt, välj ett av två:

- installera **PostgreSQL med den officiella installeraren** som en Windows-tjänst
  (startar med datorn), eller
- kör den i en **container** (`docker run postgres`) med en beständig volym.

I båda fallen behålls samma `DATABASE_URL` i `.env`. Ingen kodändring.

---

## Säkerhet

Nycklar och lösenord finns **bara** i den lokala filen `.env`, som är utesluten
från Git via `.gitignore`. Ingenting ligger i koden. Det är precis den typ av
läcka som annars hamnar i ett repos historik och blir kvar där.

- **Ingen ska mejla nycklar.** Ge behörighet i respektive plattform — token skapas
  där, av den som har behörigheten.
- Meta-token blir en **System User-token**, kopplad till *företaget* och inte till
  en person. Den slutar därför inte fungera om någon byter jobb.
- Alla behörigheter som begärs är **läsbehörigheter** (`ads_read` hos Meta). Inget
  i systemet kan ändra en kampanj, pausa en annons eller flytta en budget.
- Sidan Konton läser `.env` för att visa vad som saknas, men returnerar **bara
  ja/nej per variabel** — värdena lämnar aldrig servern.
- Läs-API:et exponerar ingen skrivoperation alls.

---

## Ordlista

För den som inte lever i annonsplattformarna dagligen.

| Term | Betydelse |
|---|---|
| **Visning** (impression) | Annonsen har renderats en gång på någons skärm |
| **Räckvidd** (reach) | Antal *unika personer* som sett annonsen. Summeras aldrig över dagar |
| **Frekvens** | Visningar ÷ räckvidd. Hur många gånger samma person sett annonsen |
| **Klick** | Klick på annonsen. Hos Snapchat heter det `swipes` |
| **CTR** | Klick ÷ visningar. Hur väl annonsen fångar intresse |
| **CPC** | Kostnad per klick |
| **CPM** | Kostnad per tusen visningar. Måttet på hur dyr målgruppen är |
| **Konvertering** | Den handling vi räknar: köp, ansökan, bokning. Definieras per kund |
| **CPA** | Kostnad per konvertering. Nyckeltalet för leadkunder |
| **ROAS** | Konverteringsvärde ÷ kostnad. Kräver att värde är konfigurerat |
| **Attributionsfönster** | Hur långt efter ett klick en konvertering ändå räknas till annonsen |
| **Pacing** | Om budgeten förbrukas i rätt takt för att räcka månaden ut |
| **Prospecting** | Kampanj mot nya, kalla målgrupper |
| **Retargeting** | Kampanj mot personer som redan besökt sajten |
| **PMax** | Performance Max — Googles automatiserade kampanjtyp som går på alla nätverk |
| **Placering** | Var annonsen visades: Instagram Reels, Facebook Feed, YouTube … |

---

## Status och nästa steg

- [x] Gemensam datamodell och normaliserat databasschema
- [x] Connector för Meta Insights (asynkron rapport, backoff vid rate limit)
- [x] Connector för Google Ads (GAQL via REST)
- [x] Idempotent synk med `sync_log`, varje connector isolerad
- [x] Läs-API (FastAPI) mot vyn `ad_metrics_enriched`
- [x] Koppling konto → kund → månadsbudget
- [x] Nattlig automatisk synk (Task Scheduler)
- [x] Dashboard i Next.js: sex vyer, mobilanpassad, svenska/engelska, ljust/mörkt
- [x] Budgetpacing med prognos och larm per kund
- [x] Fördelningar per placering, enhet, ålder, kön och land
- [x] Dokumenterad fältmappning mot API:erna (sidan Datakällor)
- [ ] **Åtkomst till annonskontona** — se [`TILL-REBECCA.md`](TILL-REBECCA.md)
- [ ] Connector för Snapchat Marketing API (samma mönster som Google)
- [ ] Postgres som tjänst eller container i drift
- [ ] Budgetlarm även via e-post eller Slack i synkjobbet (idag: bara i dashboarden)
- [ ] Publicering på en intern adress så att fler kan öppna dashboarden utan att
      starta den lokalt

---

## Felsökning

**Porten 3000 är upptagen.** Next.js väljer nästa lediga port automatiskt och
skriver ut den (`http://localhost:3001`). Inget behöver göras.

**Dashboarden visar DEMO trots att nycklarna är ifyllda.** Rewrite-blocket i
`web/next.config.ts` är fortfarande utkommenterat, eller så svarar inte
`uvicorn` på port 8000. Kontrollera med `curl http://127.0.0.1:8000/health`.

**Synken skriver inget.** Öppna sidan **Konton** — den listar exakt vilka
miljövariabler som saknas per plattform. Är alla satta, titta i
`backend\sync.log` och i tabellen `sync_log`.

**`Variabel d'ambiente mancante`** vid start av backend. `.env` saknas eller är
tom. Kopiera `.env.example` och fyll i.

**Meta svarar med felkod 17.** Rate limit — Metas kvot baseras på kontots
annonskostnad. Connectorn väntar och försöker igen med exponentiell backoff upp
till sex gånger; det är normalt vid stora historiska hämtningar.

**Google svarar 401 eller "developer token not approved".** Utvecklartoken saknar
åtkomstnivå, eller så pekar `GOOGLE_LOGIN_CUSTOMER_ID` inte på rätt
förvaltarkonto. Basic access räcker för rapportering.

**Siffrorna för igår ser låga ut.** Det är attributionsfönstret — de fylls på
under de närmaste dagarna. Se avsnittet ovan.
