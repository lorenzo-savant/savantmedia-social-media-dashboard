/**
 * GET /api/accounts — stesso contratto di `db.fetch_accounts` (backend FastAPI):
 * un account per riga, con spesa nel periodo e ultimo esito di sync.
 */

import { NextResponse } from "next/server";
import { ACCOUNTS, CAMPAIGNS, CLIENT_BY_ID } from "@/lib/demo/catalog";
import { getDataset } from "@/lib/demo/generate";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since");

  const ds = getDataset();
  const spend = new Map<string, number>();
  for (const r of ds.rows) {
    if (since && r.date < since) continue;
    spend.set(r.accountId, (spend.get(r.accountId) ?? 0) + r.spend);
  }
  const sync = new Map(ds.syncLog.map((e) => [e.accountId, e]));

  const out = ACCOUNTS.map((a, i) => {
    const client = CLIENT_BY_ID.get(a.clientId);
    const log = sync.get(a.id);
    return {
      id: i + 1,
      platform: a.platform,
      external_id: a.id,
      account_name: a.name,
      client_name: client?.name ?? null,
      client_monthly_budget: client?.monthlyBudget ?? null,
      spend: Math.round((spend.get(a.id) ?? 0) * 100) / 100,
      currency: a.currency,
      last_sync_status: log?.status ?? null,
      last_sync_at: log?.finishedAt ?? null,
      rows_upserted: log?.rowsUpserted ?? null,
      campaigns: CAMPAIGNS.filter((c) => c.accountId === a.id).length,
      timezone: a.timezone,
      attribution: a.attribution,
    };
  });

  return NextResponse.json(out, { headers: { "x-savant-source": "demo" } });
}
