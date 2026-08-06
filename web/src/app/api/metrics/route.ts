/**
 * GET /api/metrics — stesso CONTRATTO dell'endpoint FastAPI del backend.
 *
 * Le colonne sono esattamente quelle di `ENRICHED_COLUMNS` in backend/db.py,
 * in snake_case, servite dalla view `ad_metrics_enriched`. Quando il backend
 * Python è acceso basta puntare il frontend lì (o mettere un rewrite in
 * next.config): nessun componente cambia, perché la forma dei dati è identica.
 */

import { NextResponse } from "next/server";
import { ACCOUNT_BY_ID, CLIENT_BY_ID } from "@/lib/demo/catalog";
import { getDataset } from "@/lib/demo/generate";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since");
  const platform = searchParams.get("platform");
  const limit = Number(searchParams.get("limit")) || undefined;

  const ds = getDataset();
  let rows = ds.rows;
  if (since) rows = rows.filter((r) => r.date >= since);
  if (platform) rows = rows.filter((r) => r.platform === platform);

  const out = rows.map((r) => {
    const account = ACCOUNT_BY_ID.get(r.accountId);
    const client = CLIENT_BY_ID.get(r.clientId);
    const value = r.conversionValue;
    return {
      platform: r.platform,
      account_name: account?.name ?? null,
      client_name: client?.name ?? null,
      client_monthly_budget: client?.monthlyBudget ?? null,
      campaign_id: r.campaignId,
      campaign_name: r.campaignName,
      date: r.date,
      currency: r.currency,
      spend: r.spend,
      impressions: r.impressions,
      clicks: r.clicks,
      conversions: r.conversions,
      conversion_value: value,
      // rapporti calcolati come nella view SQL: mai divisioni per zero
      ctr: r.impressions > 0 ? r.clicks / r.impressions : 0,
      cpc: r.clicks > 0 ? r.spend / r.clicks : 0,
      cpm: r.impressions > 0 ? (r.spend / r.impressions) * 1000 : 0,
      cpa: r.conversions > 0 ? r.spend / r.conversions : 0,
      // null (non 0) quando il valore di conversione non è configurato
      roas: value != null && r.spend > 0 ? value / r.spend : null,
      // campi che la view SQL non ha ma le API sì — utili al frontend
      reach: r.reach,
      video_views: r.videoViews,
      objective: r.objective,
    };
  });

  return NextResponse.json(limit ? out.slice(0, limit) : out, {
    headers: { "x-savant-source": "demo" },
  });
}
