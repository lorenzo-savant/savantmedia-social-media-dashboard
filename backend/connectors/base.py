"""
Interfaccia comune dei connettori.

Ogni piattaforma implementa `fetch()` e restituisce una lista di MetricRow.
Aggiungere Google o Snapchat domani = scrivere una nuova classe che eredita da
qui, senza toccare né il DB né la dashboard.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import date

from models import MetricRow


class BaseConnector(ABC):
    platform: str = "base"

    @abstractmethod
    def fetch(self, since: date, until: date) -> list[MetricRow]:
        """Scarica le metriche normalizzate nell'intervallo [since, until]."""
        raise NotImplementedError
