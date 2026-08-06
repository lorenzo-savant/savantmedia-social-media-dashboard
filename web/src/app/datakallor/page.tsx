import {
  Badge,
  Card,
  CardHead,
  KeyValue,
  Note,
  PLATFORM_LABEL,
  PLATFORM_VAR,
  PageHeader,
} from "@/components/ui/primitives";
import { API_SOURCES, API_VERSIONS, DERIVED_METRICS, NOT_AVAILABLE } from "@/lib/api-catalog";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/prefs";

export default async function SourcesPage() {
  const lang = await getLang();
  const s = t(lang);

  return (
    <>
      <PageHeader title={s.sources.title} sub={s.sources.subtitle} />

      <div className="mb-5">
        <Note title={s.demoTitle}>{s.sources.intro}</Note>
      </div>

      <div className="space-y-5">
        {API_SOURCES.map((src) => (
          <Card key={src.platform} as="article" className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 px-4 pt-4 sm:px-5 sm:pt-5">
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: PLATFORM_VAR[src.platform] }}
              />
              <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{src.label}</h2>
              <Badge tone="neutral">{API_VERSIONS[src.platform]}</Badge>
            </div>

            {/* --- connessione --- */}
            <div className="grid gap-x-8 px-4 pt-2 sm:px-5 lg:grid-cols-2">
              <dl className="divide-y divide-hairline">
                <KeyValue k={s.sources.endpoint} v={src.endpoint} mono />
                <KeyValue k={s.sources.method} v={src.method} mono />
                <KeyValue k={s.sources.granularity} v={src.granularity} mono />
              </dl>
              <dl className="divide-y divide-hairline">
                <KeyValue k={s.sources.auth} v={src.auth} />
                <KeyValue k={s.accounts.scope} v={src.scope} mono />
                <KeyValue k={s.sources.docs} v={src.docs} mono />
              </dl>
            </div>

            {/* --- env --- */}
            <div className="px-4 pt-4 sm:px-5">
              <h3 className="mb-2 text-[11px] font-semibold tracking-[0.02em] text-ink-muted">
                {s.sources.envVars}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {src.envVars.map((v) => (
                  <code
                    key={v}
                    className="rounded-md bg-sunken px-1.5 py-1 font-mono text-[11px] text-ink-secondary"
                  >
                    {v}
                  </code>
                ))}
              </div>
            </div>

            {/* --- mappatura campi --- */}
            <div className="mt-4 px-4 sm:px-5">
              <h3 className="mb-2 text-[11px] font-semibold tracking-[0.02em] text-ink-muted">
                {s.sources.fields}
              </h3>
              <div className="overflow-x-auto rounded-xl border border-hairline">
                <table className="w-full min-w-[560px] text-[12px]">
                  <thead>
                    <tr className="border-b border-hairline bg-sunken/50 text-ink-muted">
                      <th scope="col" className="px-3 py-2 text-left font-medium">
                        {s.sources.metric}
                      </th>
                      <th scope="col" className="px-3 py-2 text-left font-medium">
                        {s.sources.apiField}
                      </th>
                      <th scope="col" className="px-3 py-2 text-left font-medium">
                        {s.sources.note}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {src.fields.map((fld) => (
                      <tr key={fld.metric} className="border-b border-hairline last:border-0 align-top">
                        <td className="px-3 py-2 font-medium text-ink">{fld.metric}</td>
                        <td className="px-3 py-2">
                          {fld.field ? (
                            <code className="font-mono text-[11px] text-ink-secondary">{fld.field}</code>
                          ) : (
                            <Badge tone="warning">{s.sources.notProvided}</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[11.5px] leading-relaxed text-ink-muted">
                          {fld.note ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* --- breakdowns --- */}
            <div className="mt-4 px-4 sm:px-5">
              <h3 className="mb-2 text-[11px] font-semibold tracking-[0.02em] text-ink-muted">
                {s.sources.breakdowns}
              </h3>
              <ul className="space-y-2">
                {src.breakdowns.map((b) => (
                  <li key={b.param} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <code className="rounded-md bg-sunken px-1.5 py-0.5 font-mono text-[11px] text-ink-secondary">
                      {b.param}
                    </code>
                    <span className="text-[11.5px] text-ink-muted">
                      {b.values.map((v) => (
                        <span key={v} className="mr-1.5 whitespace-nowrap">
                          {v}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* --- trappole --- */}
            <div className="mt-4 px-4 pb-4 sm:px-5 sm:pb-5">
              <h3 className="mb-2 text-[11px] font-semibold tracking-[0.02em] text-ink-muted">
                {s.sources.gotchas}
              </h3>
              <ul className="space-y-1.5">
                {src.gotchas.map((g) => (
                  <li key={g} className="flex gap-2 text-[12px] leading-relaxed text-ink-secondary">
                    <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-muted" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 rounded-xl bg-sunken/60 px-3 py-2.5 text-[11.5px] leading-relaxed text-ink-secondary">
                <span className="font-semibold text-ink">{s.sources.rateLimit}. </span>
                {src.rateLimit}
              </div>
            </div>
          </Card>
        ))}

        {/* --- derivate --- */}
        <Card>
          <CardHead title={s.sources.derived} sub={s.notes.ratios} />
          <div className="overflow-x-auto px-4 pb-4 pt-3 sm:px-5">
            <table className="w-full min-w-[520px] text-[12px]">
              <thead>
                <tr className="border-b border-hairline text-ink-muted">
                  <th scope="col" className="py-2 pr-3 text-left font-medium">
                    {s.sources.metric}
                  </th>
                  <th scope="col" className="px-3 py-2 text-left font-medium">
                    {s.sources.formula}
                  </th>
                  <th scope="col" className="py-2 pl-3 text-left font-medium">
                    {s.sources.note}
                  </th>
                </tr>
              </thead>
              <tbody>
                {DERIVED_METRICS.map((d) => (
                  <tr key={d.metric} className="border-b border-hairline last:border-0 align-top">
                    <td className="py-2 pr-3 font-medium text-ink">{d.metric}</td>
                    <td className="px-3 py-2">
                      <code className="font-mono text-[11px] text-ink-secondary">{d.formula}</code>
                    </td>
                    <td className="py-2 pl-3 text-[11.5px] leading-relaxed text-ink-muted">
                      {d.note ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* --- cosa non c'è --- */}
        <Card>
          <CardHead title={s.sources.notAvailable} sub={s.sources.notAvailableIntro} />
          <ul className="space-y-3 px-4 pb-4 pt-3 sm:px-5">
            {NOT_AVAILABLE.map((n) => (
              <li key={n.label} className="border-l-2 border-hairline-strong pl-3">
                <div className="text-[12.5px] font-medium text-ink">{n.label}</div>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-muted">{n.reason}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4 sm:p-5">
          <h2 className="mb-2 text-[13px] font-semibold text-ink">{s.notes.reach}</h2>
          <p className="text-[12px] leading-relaxed text-ink-secondary">{s.notes.reachBody}</p>
          <h2 className="mb-2 mt-4 text-[13px] font-semibold text-ink">{s.notes.attribution}</h2>
          <p className="text-[12px] leading-relaxed text-ink-secondary">{s.notes.attributionBody(4)}</p>
          <h2 className="mb-2 mt-4 text-[13px] font-semibold text-ink">ROAS</h2>
          <p className="text-[12px] leading-relaxed text-ink-secondary">{s.notes.roasNull}</p>
          <h2 className="mb-2 mt-4 text-[13px] font-semibold text-ink">
            {PLATFORM_LABEL.meta} · {PLATFORM_LABEL.google} · {PLATFORM_LABEL.snapchat}
          </h2>
          <p className="text-[12px] leading-relaxed text-ink-secondary">{s.notes.currency}</p>
        </Card>
      </div>
    </>
  );
}
