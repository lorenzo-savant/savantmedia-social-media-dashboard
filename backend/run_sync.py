"""
Entry point del sync ETL.

  python run_sync.py            # sync incrementale (ultimi LOOKBACK_DAYS giorni)
  python run_sync.py --seed     # popola il DB con dati finti per sviluppare la dashboard
                                #   senza ancora avere il token Meta

Gira solo i connettori configurati. Oggi: Meta (se c'è il token). Domani aggiungi
Google e Snapchat istanziandoli nella lista `connectors` qui sotto.
"""
from __future__ import annotations

import argparse
import random
from datetime import date, timedelta

import config
from connectors.base import BaseConnector
from connectors.meta import MetaConnector
from connectors.google import GoogleAdsConnector
from db import (
    apply_schema, upsert_metrics, get_conn,
    start_sync_log, finish_sync_log,
)
from models import MetricRow


def build_connectors() -> list[BaseConnector]:
    connectors: list[BaseConnector] = []
    if config.meta_is_configured():
        connectors.append(MetaConnector())
    else:
        print("[sync] Meta non configurato (manca token o account) — lo salto.")
    if config.google_is_configured():
        connectors.append(GoogleAdsConnector())
    else:
        print("[sync] Google Ads non configurato (mancano credenziali) — lo salto.")
    # TODO domani: SnapchatConnector()
    return connectors


def run_incremental() -> None:
    apply_schema()
    until = date.today()
    since = until - timedelta(days=config.LOOKBACK_DAYS)
    connectors = build_connectors()
    if not connectors:
        print("[sync] nessun connettore configurato. Usa --seed per dati di prova.")
        return
    # Ogni connettore gira ISOLATO: un errore su una piattaforma non ferma le altre,
    # e l'esito (success/error) finisce in sync_log per la panoramica account.
    failures = 0
    for c in connectors:
        log_id = start_sync_log(c.platform)
        try:
            rows = c.fetch(since, until)
            n = upsert_metrics(rows)
            finish_sync_log(log_id, "success", rows=n)
            print(f"[sync] {c.platform}: {n} righe scritte.")
        except Exception as exc:  # noqa: BLE001 — isolamento volutamente ampio
            finish_sync_log(log_id, "error", error=str(exc))
            failures += 1
            print(f"[sync] {c.platform}: ERRORE — {exc}")
            continue
    if failures:
        print(f"[sync] completato con {failures} connettore/i in errore "
              f"(dettagli in sync_log).")


def run_seed() -> None:
    """Dati finti realistici, nello STESSO formato dei dati veri.
    Quando arriva il token Meta, i dati reali sostituiscono questi senza cambiare
    nulla nella dashboard."""
    apply_schema()
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "INSERT INTO clients (name, monthly_budget) VALUES "
            "('Vinterhamn AB', 8000), ('Blomlyckan', 5000), "
            "('Taktil Analytics', 12000) ON CONFLICT (name) DO NOTHING"
        )

    platforms = ["meta", "google", "snapchat"]
    accounts = {
        "meta": ("act_1000000001", "Savant – Meta"),
        "google": ("123-456-7890", "Savant – Google Ads"),
        "snapchat": ("snap_55501", "Savant – Snapchat"),
    }
    campaigns = ["Brand Awareness", "Retargeting", "AI Twin Launch", "Lead Gen Q3"]
    rows: list[MetricRow] = []
    today = date.today()
    for d in range(30):
        day = today - timedelta(days=d)
        for p in platforms:
            ext_id, _ = accounts[p]
            for camp in campaigns:
                base = random.uniform(40, 400)
                impr = int(base * random.uniform(80, 200))
                clicks = int(impr * random.uniform(0.005, 0.04))
                conv = clicks * random.uniform(0.02, 0.12)
                rows.append(
                    MetricRow(
                        platform=p, account_external_id=ext_id,
                        campaign_id=f"{p}_{camp}".replace(" ", "_"),
                        campaign_name=camp, day=day, currency="EUR",
                        spend=round(base, 2), impressions=impr, clicks=clicks,
                        conversions=round(conv, 1),
                        conversion_value=round(conv * random.uniform(15, 60), 2),
                    )
                )
    n = upsert_metrics(rows)
    # collega gli account ai clienti seed
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("UPDATE accounts SET client_id = (SELECT id FROM clients "
                    "WHERE name='Vinterhamn AB') WHERE platform='meta'")
        cur.execute("UPDATE accounts SET client_id = (SELECT id FROM clients "
                    "WHERE name='Blomlyckan') WHERE platform='google'")
        cur.execute("UPDATE accounts SET client_id = (SELECT id FROM clients "
                    "WHERE name='Taktil Analytics') WHERE platform='snapchat'")
    print(f"[seed] scritte {n} righe di esempio su 3 piattaforme.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", action="store_true", help="popola con dati finti")
    args = parser.parse_args()
    run_seed() if args.seed else run_incremental()
