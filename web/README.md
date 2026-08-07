# Savant Ads — dashboard (Next.js)

Dashboardens gränssnitt: Next.js 16 (App Router) + Tailwind 4 + TypeScript.

```bash
npm install
npm run dev      # http://localhost:3000
```

Körs **utan backend och utan API-nycklar**: datan kommer från en deterministisk
generator i `src/lib/demo/`. Det är läget som är tänkt för demon.

## Projektets regel

> Varje siffra som visas måste motsvara ett fält som faktiskt går att läsa
> med en API-nyckel. Inga uppskattningar, inga påhittade mätvärden.

Kontraktet finns i [`src/lib/api-catalog.ts`](src/lib/api-catalog.ts) och
syns på skärmen på sidan **Datakällor**: för varje mätvärde visas endpointen,
fältets exakta namn och konverteringsfällan (`cost_micros` i
mikroenheter, Metas siffror som kommer som strängar, Snapchats `swipes` i
stället för `clicks`…). Samma sida listar också det som API:erna **inte** ger,
och som därför inte finns i dashboarden.

Tre synliga konsekvenser i gränssnittet:

- **ROAS är `–`, inte `0`**, när konverteringshändelsen inte har något
  konfigurerat värde (typiskt för leads). Noll skulle säga "den gav ingenting", vilket är falskt.
- **Google har ingen räckvidd** på kampanj-/dagsnivå: kolumnen förblir tom.
  Och det finns ingen räckvidd över plattformsgränsen, eftersom ingen plattform
  deduplicerar mot de andra — därför finns ingen total räckvidd på Översikt.
- **De senaste 4 dagarna markeras som "ännu inte färdigattribuerade"**: med Metas
  7d_click-fönster fortsätter de senaste konverteringarna att komma in. Det är
  skälet till att nattsynken hämtar om 28 dagar (`LOOKBACK_DAYS`).

Kvoterna (CTR, CPC, CPM, CPA, ROAS) beräknas alltid på periodens summor,
aldrig som ett medelvärde av dagsvärdena.

## Struktur

| Sökväg | Vad som finns där |
|---|---|
| `src/app/page.tsx` | Översikt: KPI:er, kostnadsutveckling, plattformssplit, budgetpacing |
| `src/app/kampanjer/` | kampanjtabell + detaljsida med breakdowns |
| `src/app/kunder/` | resultat och budgetstatus per kund |
| `src/app/insikter/` | breakdown per placering / enhet / ålder / kön / land |
| `src/app/konton/` | status för connectors, saknade uppgifter, synklogg |
| `src/app/datakallor/` | mappningen fält → API |
| `src/app/api/` | `/api/metrics`, `/api/accounts`, `/api/health` |
| `src/lib/demo/` | katalog (kunder, konton, kampanjer) och generator |
| `src/lib/aggregate.ts` | aggregeringar och härledda mätvärden |
| `src/components/charts/` | diagram i SVG, utan bibliotek |

## Gå över till skarp data

Routerna i `src/app/api/` returnerar **samma JSON** som FastAPI-API:et i
`../backend/api.py` (snake_case, kolumnerna från vyn `ad_metrics_enriched`).
Med backend igång räcker det att avkommentera rewriten i
[`next.config.ts`](next.config.ts):

```ts
async rewrites() {
  return [{ source: "/api/:path*", destination: "http://127.0.0.1:8000/api/:path*" }];
}
```

Ingen komponent ändras: datans form är identisk.

## Implementationsnoteringar

**Filter i URL:en.** Period, plattformar och kund ligger i `?d=&p=&c=`, inte
i React-state: en länk till "Taktil Analytics, senaste 7 dagarna" går att dela,
bakåtknappen fungerar, och renderingen sker fortfarande på servern — webbläsaren
får redan filtrerad data i stället för hela datamängden. Under en refetch ligger
det tidigare innehållet kvar med sänkt opacitet: ingen skeleton, inget layouthopp.

**Handritade diagram i SVG.** Inget diagrambibliotek: färgerna är
CSS-variabler, så det mörka temat kräver inget separat tema för diagrammen.
Den kategoriska paletten (Meta blå, Google grön, Snapchat gul) har körts genom
en validator för CVD-separation, luminansband och kontrast, i ljust
och mörkt läge. Varje diagram har en tvilling i form av en **tabell**, som är den
obligatoriska tillgängliga kanalen när färgen ensam inte räcker.

**Språket i en cookie.** Svenska som standard, engelska via växlaren. Servern
renderar redan på rätt språk, så det blir ingen blink av engelsk text vid start.

**Deterministisk data.** Generatorn är hashbaserad på `(kampanj, dag)`:
siffrorna för en dag beror inte på hur brett det valda fönstret är, så när man
går från 7 till 30 dagar ändras inte de siffror man redan sett.
