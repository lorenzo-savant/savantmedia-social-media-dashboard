"""
API read-only: serve la view `ad_metrics_enriched` al frontend.

Avvio (dalla cartella backend, con la venv attiva):
    uvicorn api:app --reload --port 8000

La dashboard Vite chiama GET /api/metrics tramite proxy. Se l'API non risponde,
il frontend usa i dati seed incorporati: nessuna pagina bianca.
"""
from __future__ import annotations

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

import db

app = FastAPI(title="Savant Ads API", version="1.0")

# In locale il frontend gira su un'altra porta (5173): abilitiamo CORS.
# Sono dati di sola lettura, quindi qui va bene aprire a tutte le origini.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/metrics")
def metrics(since: str | None = Query(None, description="Filtro data, formato YYYY-MM-DD")):
    """Righe di `ad_metrics_enriched`, opzionalmente da `since` in poi."""
    return db.fetch_enriched(since=since)


@app.get("/api/accounts")
def accounts(since: str | None = Query(None, description="Spesa da questa data (YYYY-MM-DD)")):
    """Panoramica account: piattaforma, cliente, spesa nel periodo, ultimo sync."""
    return db.fetch_accounts(since=since)
