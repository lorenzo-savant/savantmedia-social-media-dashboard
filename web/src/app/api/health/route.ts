import { NextResponse } from "next/server";
import { connectionStatus } from "@/lib/connection";
import { getDataset } from "@/lib/demo/generate";

export const dynamic = "force-dynamic";

/** Sonda di stato. Espone SOLO booleani sulle credenziali, mai i valori. */
export async function GET() {
  const ds = getDataset();
  const conn = await connectionStatus();
  return NextResponse.json({
    status: "ok",
    mode: "demo",
    data_through: ds.endDate,
    window_start: ds.startDate,
    rows: ds.rows.length,
    connectors: Object.fromEntries(
      Object.entries(conn).map(([k, v]) => [k, { ready: v.ready, missing: v.missing }]),
    ),
  });
}
