/**
 * Legenda. Presente SEMPRE quando ci sono due o più serie: è il canale
 * d'identità affidabile, il colore da solo non basta mai. Il segno rispecchia
 * il mark del grafico (rettangolo per aree e barre, tratto per le linee).
 * Il testo resta nei token d'inchiostro — mai colorato come la serie.
 */
export function Legend({
  items,
  mark = "rect",
}: {
  items: { label: string; color: string; value?: string }[];
  mark?: "rect" | "line";
}) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5">
          {mark === "rect" ? (
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: it.color }}
            />
          ) : (
            <span
              aria-hidden
              className="h-[2px] w-4 shrink-0 rounded-full"
              style={{ background: it.color }}
            />
          )}
          <span className="text-[11.5px] text-ink-secondary">{it.label}</span>
          {it.value && <span className="tnum text-[11.5px] font-medium text-ink">{it.value}</span>}
        </li>
      ))}
    </ul>
  );
}
