"""
Accesso al database: applica lo schema e fa l'UPSERT idempotente delle metriche.

L'upsert usa la chiave naturale (platform, account_id, campaign_id, date) definita
nello schema: ri-scaricare la finestra di 28 giorni aggiorna le righe, non le duplica.
"""
from __future__ import annotations

import datetime
import decimal
import pathlib
from contextlib import contextmanager

import psycopg2
import psycopg2.extras

from config import DATABASE_URL
from models import MetricRow

SCHEMA_PATH = pathlib.Path(__file__).parent / "schema.sql"


@contextmanager
def get_conn():
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def apply_schema() -> None:
    """Crea tabelle e view se non esistono (idempotente)."""
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(SCHEMA_PATH.read_text())


def get_or_create_account(cur, platform: str, external_id: str, currency: str) -> int:
    cur.execute(
        """
        INSERT INTO accounts (platform, external_id, currency)
        VALUES (%s, %s, %s)
        ON CONFLICT (platform, external_id) DO UPDATE SET currency = EXCLUDED.currency
        RETURNING id
        """,
        (platform, external_id, currency),
    )
    return cur.fetchone()[0]


def upsert_metrics(rows: list[MetricRow]) -> int:
    """Inserisce/aggiorna le righe normalizzate. Ritorna quante ne ha scritte."""
    if not rows:
        return 0

    with get_conn() as conn, conn.cursor() as cur:
        # risolvi gli account_id una sola volta per (platform, external_id)
        account_cache: dict[tuple[str, str], int] = {}
        payload = []
        for r in rows:
            key = (r.platform, r.account_external_id)
            if key not in account_cache:
                account_cache[key] = get_or_create_account(
                    cur, r.platform, r.account_external_id, r.currency
                )
            payload.append(
                (
                    r.platform, account_cache[key], r.campaign_id, r.campaign_name,
                    r.day, r.currency, r.spend, r.impressions, r.clicks,
                    r.conversions, r.conversion_value,
                )
            )

        psycopg2.extras.execute_values(
            cur,
            """
            INSERT INTO ad_metrics
                (platform, account_id, campaign_id, campaign_name, date, currency,
                 spend, impressions, clicks, conversions, conversion_value)
            VALUES %s
            ON CONFLICT (platform, account_id, campaign_id, date) DO UPDATE SET
                spend            = EXCLUDED.spend,
                impressions      = EXCLUDED.impressions,
                clicks           = EXCLUDED.clicks,
                conversions      = EXCLUDED.conversions,
                conversion_value = EXCLUDED.conversion_value,
                campaign_name    = EXCLUDED.campaign_name,
                updated_at       = now()
            """,
            payload,
        )
        return len(payload)


# Colonne della view che l'API serve al frontend (stessa forma del seed JS).
ENRICHED_COLUMNS = (
    "platform", "account_name", "client_name", "client_monthly_budget",
    "campaign_id", "campaign_name", "date", "currency",
    "spend", "impressions", "clicks", "conversions", "conversion_value",
    "ctr", "cpc", "cpm", "cpa", "roas",
)


def _jsonify(row: dict) -> dict:
    """Rende una riga JSON-serializzabile: Decimal -> float, date -> 'YYYY-MM-DD'."""
    out = {}
    for k, v in row.items():
        if isinstance(v, decimal.Decimal):
            out[k] = float(v)
        elif isinstance(v, (datetime.date, datetime.datetime)):
            out[k] = v.isoformat()
        else:
            out[k] = v
    return out


def fetch_enriched(since: str | None = None) -> list[dict]:
    """Legge `ad_metrics_enriched` (opz. da una data in poi) per l'API/dashboard."""
    sql = f"SELECT {', '.join(ENRICHED_COLUMNS)} FROM ad_metrics_enriched"
    params: list = []
    if since:
        sql += " WHERE date >= %s"
        params.append(since)
    sql += " ORDER BY date, platform, campaign_name"
    with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(sql, params)
        return [_jsonify(dict(r)) for r in cur.fetchall()]


# --- sync_log: un record per (connettore, run) ------------------------------
# Scritto in transazioni indipendenti (commit per chiamata), così l'esito resta
# anche se il connettore poi fallisce. È la sorgente della "panoramica account".

def start_sync_log(platform: str, account_external_id: str | None = None) -> int:
    """Apre una riga di sync (status 'running') e ritorna il suo id."""
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "INSERT INTO sync_log (platform, account_external_id, status) "
            "VALUES (%s, %s, 'running') RETURNING id",
            (platform, account_external_id),
        )
        return cur.fetchone()[0]


def finish_sync_log(log_id: int, status: str, rows: int | None = None,
                    error: str | None = None) -> None:
    """Chiude la riga di sync: 'success' o 'error', con righe scritte/errore."""
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "UPDATE sync_log SET finished_at = now(), status = %s, "
            "rows_upserted = %s, error = %s WHERE id = %s",
            (status, rows, error, log_id),
        )


def fetch_accounts(since: str | None = None) -> list[dict]:
    """Panoramica account: piattaforma, cliente, spesa nel periodo, ultimo sync.

    Unisce `accounts` + `clients`, la spesa aggregata da `ad_metrics` (opz. da
    `since`), e l'ultima riga di `sync_log` per piattaforma.
    """
    sql = """
        SELECT
            a.id,
            a.platform,
            a.external_id,
            a.name              AS account_name,
            c.name              AS client_name,
            c.monthly_budget    AS client_monthly_budget,
            COALESCE(s.spend, 0) AS spend,
            a.currency,
            ls.status           AS last_sync_status,
            ls.finished_at      AS last_sync_at
        FROM accounts a
        LEFT JOIN clients c ON c.id = a.client_id
        LEFT JOIN (
            SELECT account_id, SUM(spend) AS spend
            FROM ad_metrics
            WHERE (%(since)s IS NULL OR date >= %(since)s)
            GROUP BY account_id
        ) s ON s.account_id = a.id
        LEFT JOIN LATERAL (
            SELECT status, finished_at
            FROM sync_log
            WHERE platform = a.platform
            ORDER BY id DESC
            LIMIT 1
        ) ls ON TRUE
        ORDER BY a.platform, c.name NULLS LAST, a.external_id
    """
    with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(sql, {"since": since})
        return [_jsonify(dict(r)) for r in cur.fetchall()]


# --- Mappatura account -> cliente (Task 4) ----------------------------------

def assign_client(external_id: str, client_name: str,
                  monthly_budget: float | None = None,
                  platform: str | None = None) -> int:
    """Collega un account (per external_id) a un cliente, creandolo se serve.

    Ritorna quanti account sono stati aggiornati (0 se l'external_id non esiste).
    """
    with get_conn() as conn, conn.cursor() as cur:
        if monthly_budget is not None:
            cur.execute(
                "INSERT INTO clients (name, monthly_budget) VALUES (%s, %s) "
                "ON CONFLICT (name) DO UPDATE SET monthly_budget = EXCLUDED.monthly_budget "
                "RETURNING id",
                (client_name, monthly_budget),
            )
        else:
            cur.execute(
                "INSERT INTO clients (name) VALUES (%s) "
                "ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id",
                (client_name,),
            )
        client_id = cur.fetchone()[0]
        if platform:
            cur.execute(
                "UPDATE accounts SET client_id = %s WHERE external_id = %s AND platform = %s",
                (client_id, external_id, platform),
            )
        else:
            cur.execute(
                "UPDATE accounts SET client_id = %s WHERE external_id = %s",
                (client_id, external_id),
            )
        return cur.rowcount


def list_account_mapping() -> list[dict]:
    """Account con cliente collegato e budget (per il comando --list)."""
    with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(
            "SELECT a.platform, a.external_id, a.name AS account_name, "
            "c.name AS client_name, c.monthly_budget "
            "FROM accounts a LEFT JOIN clients c ON c.id = a.client_id "
            "ORDER BY a.platform, a.external_id"
        )
        return [_jsonify(dict(r)) for r in cur.fetchall()]
