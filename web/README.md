# Savant Ads — dashboard (Next.js)

Interfaccia della dashboard: Next.js 16 (App Router) + Tailwind 4 + TypeScript.

```bash
npm install
npm run dev      # http://localhost:3000
```

Gira **senza backend e senza chiavi API**: i dati vengono da un generatore
deterministico in `src/lib/demo/`. È la modalità pensata per la demo.

## La regola del progetto

> Ogni numero mostrato deve corrispondere a un campo che si può davvero leggere
> con una API key. Niente stime, niente metriche inventate.

Il contratto sta in [`src/lib/api-catalog.ts`](src/lib/api-catalog.ts) ed è
visibile a schermo nella pagina **Datakällor**: per ogni metrica, l'endpoint, il
nome esatto del campo e la trappola di conversione (`cost_micros` in
micro-unità, i numeri Meta che arrivano come stringhe, `swipes` di Snapchat al
posto di `clicks`…). La stessa pagina elenca anche ciò che le API **non** danno,
e che quindi non è in dashboard.

Tre conseguenze visibili nell'interfaccia:

- **Il ROAS è `–`, non `0`**, quando l'azione di conversione non ha un valore
  configurato (tipico dei lead). Zero direbbe "non ha reso niente", che è falso.
- **Google non ha la reach** a livello campagna/giorno: la colonna resta vuota.
  E non esiste una reach cross-platform, perché nessuna piattaforma deduplica
  contro le altre — quindi in Översikt non c'è un totale di reach.
- **Le ultime 4 giornate sono marcate come "in maturazione"**: con la finestra
  7d_click di Meta le conversioni recenti continuano ad arrivare. È il motivo
  per cui il sync notturno ri-scarica 28 giorni (`LOOKBACK_DAYS`).

I rapporti (CTR, CPC, CPM, CPA, ROAS) sono sempre calcolati sulle somme del
periodo, mai come media dei valori giornalieri.

## Struttura

| Percorso | Cosa c'è |
|---|---|
| `src/app/page.tsx` | Översikt: KPI, andamento spesa, split piattaforma, pacing budget |
| `src/app/kampanjer/` | tabella campagne + pagina di dettaglio con i breakdown |
| `src/app/kunder/` | risultati e stato budget per cliente |
| `src/app/insikter/` | breakdown per placering / enhet / ålder / kön / land |
| `src/app/konton/` | stato connettori, credenziali mancanti, log di sync |
| `src/app/datakallor/` | la mappatura campo → API |
| `src/app/api/` | `/api/metrics`, `/api/accounts`, `/api/health` |
| `src/lib/demo/` | catalogo (clienti, account, campagne) e generatore |
| `src/lib/aggregate.ts` | aggregazioni e metriche derivate |
| `src/components/charts/` | grafici in SVG, senza librerie |

## Passare ai dati veri

Le route in `src/app/api/` restituiscono **lo stesso JSON** dell'API FastAPI in
`../backend/api.py` (snake_case, le colonne della view `ad_metrics_enriched`).
Con il backend acceso basta decommentare il rewrite in
[`next.config.ts`](next.config.ts):

```ts
async rewrites() {
  return [{ source: "/api/:path*", destination: "http://127.0.0.1:8000/api/:path*" }];
}
```

Nessun componente cambia: la forma dei dati è identica.

## Note di implementazione

**Filtri nella URL.** Periodo, piattaforme e cliente stanno in `?d=&p=&c=`, non
nello stato React: un link a "Taktil Analytics, ultimi 7 giorni" è condivisibile, il
tasto Indietro funziona, e il render resta lato server — al browser arrivano i
dati già filtrati invece dell'intero dataset. Durante il refetch il contenuto
precedente resta a opacità ridotta: niente skeleton, niente salto di layout.

**Grafici scritti a mano in SVG.** Nessuna libreria di charting: i colori sono
variabili CSS, quindi il tema scuro non richiede un secondo tema per i grafici.
La palette categorica (Meta blu, Google verde, Snapchat giallo) è stata passata
a un validatore per separazione CVD, banda di luminosità e contrasto, in chiaro
e in scuro. Ogni grafico ha il gemello in **tabella**, che è il canale
accessibile obbligatorio quando il colore da solo non basta.

**Lingua in un cookie.** Svedese di default, inglese col toggle. Il server rende
già nella lingua giusta, quindi non c'è il lampo di testo inglese all'avvio.

**Dati deterministici.** Il generatore è hash-based su `(campagna, giorno)`: i
numeri di un giorno non dipendono dall'ampiezza della finestra selezionata, così
passando da 7 a 30 giorni le cifre già viste non cambiano.
