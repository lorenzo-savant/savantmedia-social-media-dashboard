"""
Connettore Google Ads (GAQL via REST) — SOLA LETTURA.

Stesso pattern del connettore Meta: eredita da BaseConnector e restituisce
`list[MetricRow]`. Usa l'HTTP diretto sull'endpoint `googleAds:searchStream`
(niente SDK pesante: bastano `requests` + OAuth2 refresh token), coerente con
il resto del progetto.

Flusso:
  1. Access token: POST a oauth2.googleapis.com/token con il refresh token.
  2. Per ogni customer id: POST .../customers/{id}/googleAds:searchStream con la
     query GAQL a livello campagna/giorno. Risposta = array di chunk con `results`.

Credenziali da .env (vedi config.py):
  GOOGLE_DEVELOPER_TOKEN, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN, GOOGLE_LOGIN_CUSTOMER_ID (MCC, opz.), GOOGLE_CUSTOMER_IDS.

NOTE sul mapping (trappole):
  * `metrics.cost_micros` è in MICRO-unità → spend = cost_micros / 1_000_000.
  * la risposta REST usa chiavi camelCase (`costMicros`, `conversionsValue`,
    `currencyCode`) anche se la GAQL è in snake_case.
  * gli interi int64 (impressions, clicks, cost_micros) arrivano come STRINGHE.
  * il customer id nell'URL va senza trattini ('123-456-7890' -> '1234567890').
"""
from __future__ import annotations

import time
from datetime import date

import requests

import config
from connectors.base import BaseConnector
from models import MetricRow, to_float, to_int

OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token"
ADS_API = "https://googleads.googleapis.com"

# Errori transitori → retry con backoff (rate limit / indisponibilità).
RETRY_STATUS = {429, 500, 503}
MAX_RETRIES = 5


class GoogleAdsConnector(BaseConnector):
    platform = "google"

    def __init__(self, customer_ids: list[str] | None = None):
        self.developer_token = config.GOOGLE_DEVELOPER_TOKEN
        self.client_id = config.GOOGLE_CLIENT_ID
        self.client_secret = config.GOOGLE_CLIENT_SECRET
        self.refresh_token = config.GOOGLE_REFRESH_TOKEN
        self.login_customer_id = _digits(config.GOOGLE_LOGIN_CUSTOMER_ID)
        self.customer_ids = customer_ids or config.GOOGLE_CUSTOMER_IDS
        self.version = config.GOOGLE_API_VERSION
        self.session = requests.Session()

    # -- OAuth2 ----------------------------------------------------------------
    def _access_token(self) -> str:
        resp = self.session.post(
            OAUTH_TOKEN_URL,
            data={
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": self.refresh_token,
                "grant_type": "refresh_token",
            },
            timeout=30,
        )
        if resp.status_code != 200:
            raise RuntimeError(f"[google] OAuth fallito {resp.status_code}: {resp.text}")
        return resp.json()["access_token"]

    def _headers(self, token: str) -> dict:
        headers = {
            "Authorization": f"Bearer {token}",
            "developer-token": self.developer_token,
            "Content-Type": "application/json",
        }
        if self.login_customer_id:
            headers["login-customer-id"] = self.login_customer_id
        return headers

    # -- searchStream con retry ------------------------------------------------
    def _search_stream(self, customer_id: str, token: str, query: str) -> list[dict]:
        url = f"{ADS_API}/{self.version}/customers/{customer_id}/googleAds:searchStream"
        delay = 10
        for attempt in range(MAX_RETRIES):
            resp = self.session.post(url, headers=self._headers(token),
                                     json={"query": query}, timeout=120)
            if resp.status_code == 200:
                data = resp.json()
                chunks = data if isinstance(data, list) else [data]
                results: list[dict] = []
                for chunk in chunks:
                    results.extend(chunk.get("results", []))
                return results
            if resp.status_code in RETRY_STATUS:
                print(f"[google] {resp.status_code} su {customer_id}; attendo {delay}s "
                      f"(tentativo {attempt + 1}/{MAX_RETRIES})")
                time.sleep(delay)
                delay = min(delay * 2, 320)
                continue
            raise RuntimeError(f"[google] errore API {resp.status_code}: {resp.text}")
        raise RuntimeError(f"[google] superato il numero massimo di retry su {customer_id}")

    # -- mapping verso il modello normalizzato ---------------------------------
    @staticmethod
    def _to_row(account_external_id: str, r: dict) -> MetricRow:
        campaign = r.get("campaign", {})
        metrics = r.get("metrics", {})
        segments = r.get("segments", {})
        customer = r.get("customer", {})
        return MetricRow(
            platform="google",
            account_external_id=account_external_id,
            campaign_id=str(campaign.get("id")) if campaign.get("id") is not None else None,
            campaign_name=campaign.get("name"),
            day=date.fromisoformat(segments["date"]),
            currency=customer.get("currencyCode", "EUR"),
            # cost_micros (stringa, micro-unità) -> euro
            spend=round(to_float(metrics.get("costMicros")) / 1_000_000, 2),
            impressions=to_int(metrics.get("impressions")),
            clicks=to_int(metrics.get("clicks")),
            conversions=to_float(metrics.get("conversions")),
            conversion_value=to_float(metrics.get("conversionsValue")),
        )

    def fetch(self, since: date, until: date) -> list[MetricRow]:
        if not config.google_is_configured():
            raise RuntimeError(
                "Google non configurato: imposta GOOGLE_DEVELOPER_TOKEN, "
                "GOOGLE_CLIENT_ID/SECRET, GOOGLE_REFRESH_TOKEN e GOOGLE_CUSTOMER_IDS nel .env"
            )
        query = (
            "SELECT campaign.id, campaign.name, customer.currency_code, "
            "metrics.cost_micros, metrics.impressions, metrics.clicks, "
            "metrics.conversions, metrics.conversions_value, segments.date "
            "FROM campaign "
            f"WHERE segments.date BETWEEN '{since:%Y-%m-%d}' AND '{until:%Y-%m-%d}'"
        )
        token = self._access_token()
        all_rows: list[MetricRow] = []
        for raw_id in self.customer_ids:
            cid = _digits(raw_id)
            print(f"[google] sync {raw_id} {since} -> {until}")
            results = self._search_stream(cid, token, query)
            all_rows.extend(self._to_row(cid, r) for r in results)
            print(f"[google]   {len(results)} righe da {raw_id}")
        return all_rows


def _digits(value: str) -> str:
    """'123-456-7890' -> '1234567890' (i customer id Google nell'API sono solo cifre)."""
    return "".join(ch for ch in (value or "") if ch.isdigit())
