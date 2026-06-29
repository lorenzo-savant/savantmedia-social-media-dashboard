"""
Connettore Meta Marketing API (Insights) — SOLA LETTURA.

Flusso usato (async, robusto per report grandi):
  1. POST /{account}/insights  -> ritorna un report_run_id
  2. GET  /{report_run_id}     -> polling finché async_status == 'Job Completed'
  3. GET  /{report_run_id}/insights -> risultati (paginati)

Gestisce: backoff esponenziale sull'errore 17 (rate limit), paginazione,
conversione stringa->numero, estrazione conversioni/valore dagli `actions`.

Per ESEGUIRLO serve solo META_ACCESS_TOKEN + META_AD_ACCOUNTS nel .env.
Fino ad allora la dashboard gira su dati seed.
"""
from __future__ import annotations

import time
from datetime import date

import requests

import config
from connectors.base import BaseConnector
from models import MetricRow, to_float, to_int

GRAPH = "https://graph.facebook.com"

# Quali "action_type" contiamo come conversione. Adatta alla configurazione di Savant
# (acquisti, lead, ecc.). Lasciato esplicito apposta: le conversioni su Meta dipendono
# da come sono tracciati gli eventi, non c'è un singolo campo "conversions".
CONVERSION_ACTIONS = {
    "purchase",
    "offsite_conversion.fb_pixel_purchase",
    "lead",
    "complete_registration",
}

FIELDS = [
    "campaign_id",
    "campaign_name",
    "spend",
    "impressions",
    "clicks",
    "actions",
    "action_values",
    "account_currency",
]

# error code 17 = User request limit reached (rate limit basato sulla spesa)
RATE_LIMIT_ERROR_CODES = {17, 4, 32, 613}
MAX_RETRIES = 6


class MetaConnector(BaseConnector):
    platform = "meta"

    def __init__(self, token: str | None = None, accounts: list[str] | None = None):
        self.token = token or config.META_ACCESS_TOKEN
        self.accounts = accounts or config.META_AD_ACCOUNTS
        self.version = config.META_API_VERSION
        self.session = requests.Session()

    # -- HTTP con retry/backoff ------------------------------------------------
    def _request(self, method: str, url: str, **kwargs) -> dict:
        params = kwargs.pop("params", {})
        params.setdefault("access_token", self.token)
        delay = 60  # secondi; raddoppia a ogni 429/error 17, cap 16 min
        for attempt in range(MAX_RETRIES):
            resp = self.session.request(method, url, params=params, **kwargs)
            if resp.status_code == 200:
                return resp.json()
            body = resp.json() if resp.content else {}
            code = body.get("error", {}).get("code")
            if code in RATE_LIMIT_ERROR_CODES or resp.status_code == 429:
                wait = min(delay, 960)
                print(f"[meta] rate limit (code {code}); attendo {wait}s "
                      f"(tentativo {attempt + 1}/{MAX_RETRIES})")
                time.sleep(wait)
                delay *= 2
                continue
            # errore non recuperabile
            raise RuntimeError(f"[meta] errore API {resp.status_code}: {body}")
        raise RuntimeError("[meta] superato il numero massimo di retry sul rate limit")

    # -- API async insights ----------------------------------------------------
    def _start_report(self, account: str, since: date, until: date) -> str:
        url = f"{GRAPH}/{self.version}/{account}/insights"
        data = {
            "level": "campaign",
            "fields": ",".join(FIELDS),
            "time_increment": 1,  # una riga per giorno
            "time_range": f'{{"since":"{since:%Y-%m-%d}","until":"{until:%Y-%m-%d}"}}',
        }
        res = self._request("POST", url, params=data)
        return res["report_run_id"]

    def _wait_report(self, report_run_id: str) -> None:
        url = f"{GRAPH}/{self.version}/{report_run_id}"
        for _ in range(120):  # ~10 min max
            res = self._request("GET", url)
            status = res.get("async_status")
            if status == "Job Completed":
                return
            if status in ("Job Failed", "Job Skipped"):
                raise RuntimeError(f"[meta] report fallito: {res}")
            time.sleep(5)
        raise RuntimeError("[meta] timeout in attesa del report")

    def _fetch_results(self, report_run_id: str) -> list[dict]:
        url = f"{GRAPH}/{self.version}/{report_run_id}/insights"
        params = {"limit": 500}
        out: list[dict] = []
        while url:
            res = self._request("GET", url, params=params)
            out.extend(res.get("data", []))
            url = res.get("paging", {}).get("next")
            params = {}  # 'next' contiene già tutti i parametri
        return out

    # -- mapping verso il modello normalizzato ---------------------------------
    @staticmethod
    def _extract_conversions(row: dict) -> tuple[float, float]:
        conversions = 0.0
        for a in row.get("actions", []) or []:
            if a.get("action_type") in CONVERSION_ACTIONS:
                conversions += to_float(a.get("value"))
        value = 0.0
        for a in row.get("action_values", []) or []:
            if a.get("action_type") in CONVERSION_ACTIONS:
                value += to_float(a.get("value"))
        return conversions, value

    def _to_rows(self, account: str, raw: list[dict]) -> list[MetricRow]:
        rows = []
        for r in raw:
            conversions, value = self._extract_conversions(r)
            rows.append(
                MetricRow(
                    platform=self.platform,
                    account_external_id=account,
                    campaign_id=r.get("campaign_id"),
                    campaign_name=r.get("campaign_name"),
                    day=date.fromisoformat(r["date_start"]),
                    currency=r.get("account_currency", "EUR"),
                    spend=to_float(r.get("spend")),          # <- arriva come stringa!
                    impressions=to_int(r.get("impressions")),
                    clicks=to_int(r.get("clicks")),
                    conversions=conversions,
                    conversion_value=value,
                )
            )
        return rows

    def fetch(self, since: date, until: date) -> list[MetricRow]:
        if not self.token or not self.accounts:
            raise RuntimeError(
                "Meta non configurato: imposta META_ACCESS_TOKEN e META_AD_ACCOUNTS nel .env"
            )
        all_rows: list[MetricRow] = []
        for account in self.accounts:
            print(f"[meta] sync {account} {since} -> {until}")
            run_id = self._start_report(account, since, until)
            self._wait_report(run_id)
            raw = self._fetch_results(run_id)
            all_rows.extend(self._to_rows(account, raw))
            print(f"[meta]   {len(raw)} righe da {account}")
        return all_rows
