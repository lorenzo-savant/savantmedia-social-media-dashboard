"""
Modello dati normalizzato.

Ogni connettore (Meta, Google, Snapchat) deve produrre una lista di `MetricRow`.
È il "contratto" comune: finché un connettore restituisce MetricRow, la
dashboard non sa né le importa da quale piattaforma arrivino i dati.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import date


@dataclass
class MetricRow:
    platform: str               # 'meta' | 'google' | 'snapchat'
    account_external_id: str    # es. 'act_1234567890'
    campaign_id: str | None
    campaign_name: str | None
    day: date
    currency: str
    spend: float
    impressions: int
    clicks: int
    conversions: float
    conversion_value: float

    def as_dict(self) -> dict:
        return asdict(self)


def to_float(value, default: float = 0.0) -> float:
    """Meta (e altri) restituiscono i numeri COME STRINGHE. Conversione difensiva."""
    if value is None or value == "":
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def to_int(value, default: int = 0) -> int:
    return int(to_float(value, default))
