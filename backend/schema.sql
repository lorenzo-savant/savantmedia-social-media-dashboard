-- ============================================================================
-- Savant Ads Dashboard — schema normalizzato cross-platform
-- ----------------------------------------------------------------------------
-- Idea di fondo: ogni piattaforma (Meta, Google, Snapchat...) chiama le
-- metriche in modo diverso. Qui le riduciamo a UN modello unico, così la
-- dashboard legge sempre gli stessi campi indipendentemente dalla sorgente.
-- I connettori scrivono in `ad_metrics`; la dashboard legge da `ad_metrics_enriched`.
-- ============================================================================

-- Clienti: serve per la feature "budget per cliente" citata da Rebecca.
CREATE TABLE IF NOT EXISTS clients (
    id             SERIAL PRIMARY KEY,
    name           TEXT UNIQUE NOT NULL,
    monthly_budget NUMERIC(14, 2),               -- budget mensile pianificato (NULL = non impostato)
    created_at     TIMESTAMPTZ DEFAULT now()
);

-- Account pubblicitari, uno per piattaforma. Mappano l'ID esterno (es. act_123
-- per Meta, customer id per Google) all'eventuale cliente e alla valuta.
CREATE TABLE IF NOT EXISTS accounts (
    id          SERIAL PRIMARY KEY,
    platform    TEXT NOT NULL CHECK (platform IN ('meta', 'google', 'snapchat')),
    external_id TEXT NOT NULL,                    -- es. 'act_1234567890'
    name        TEXT,
    client_id   INT REFERENCES clients(id),
    currency    TEXT NOT NULL DEFAULT 'EUR',
    UNIQUE (platform, external_id)
);

-- Tabella dei fatti, grana giornaliera: una riga per piattaforma/account/campagna/giorno.
-- Salviamo SOLO metriche grezze e additive; i rapporti (CTR, CPA, ROAS) sono
-- calcolati nella view, mai salvati, così non si "congelano" valori sbagliati.
CREATE TABLE IF NOT EXISTS ad_metrics (
    id               BIGSERIAL PRIMARY KEY,
    platform         TEXT NOT NULL CHECK (platform IN ('meta', 'google', 'snapchat')),
    account_id       INT  NOT NULL REFERENCES accounts(id),
    campaign_id      TEXT,
    campaign_name    TEXT,
    date             DATE NOT NULL,
    currency         TEXT NOT NULL,
    spend            NUMERIC(14, 2) NOT NULL DEFAULT 0,
    impressions      BIGINT         NOT NULL DEFAULT 0,
    clicks           BIGINT         NOT NULL DEFAULT 0,
    conversions      NUMERIC(14, 2) NOT NULL DEFAULT 0,
    conversion_value NUMERIC(14, 2) NOT NULL DEFAULT 0,   -- valore conversioni, per il ROAS
    updated_at       TIMESTAMPTZ DEFAULT now(),

    -- Chiave naturale: rende il sync IDEMPOTENTE. Il connettore fa UPSERT su questa
    -- chiave, quindi ri-scaricare la finestra di 28 giorni di Meta (attribuzione che
    -- si chiude in ritardo) aggiorna le righe invece di duplicarle.
    UNIQUE (platform, account_id, campaign_id, date)
);

CREATE INDEX IF NOT EXISTS idx_ad_metrics_date     ON ad_metrics (date);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_account  ON ad_metrics (account_id);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_platform ON ad_metrics (platform);

-- Log dei sync: tiene traccia di ogni esecuzione ETL (utile per il sync
-- incrementale, il debug dei rate limit e il monitoraggio).
CREATE TABLE IF NOT EXISTS sync_log (
    id                  SERIAL PRIMARY KEY,
    platform            TEXT NOT NULL,
    account_external_id TEXT,
    started_at          TIMESTAMPTZ DEFAULT now(),
    finished_at         TIMESTAMPTZ,
    status              TEXT,                     -- 'running' | 'success' | 'error'
    rows_upserted       INT,
    error               TEXT
);

-- ----------------------------------------------------------------------------
-- View arricchita: è QUI che la dashboard legge. Aggiunge nomi leggibili e i
-- rapporti derivati, calcolati on-the-fly (niente divisioni per zero).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW ad_metrics_enriched AS
SELECT
    m.id,
    m.platform,
    m.account_id,
    a.name           AS account_name,
    c.name           AS client_name,
    c.monthly_budget AS client_monthly_budget,
    m.campaign_id,
    m.campaign_name,
    m.date,
    m.currency,
    m.spend,
    m.impressions,
    m.clicks,
    m.conversions,
    m.conversion_value,
    -- metriche derivate
    CASE WHEN m.impressions > 0 THEN m.clicks::numeric / m.impressions      ELSE 0 END AS ctr,
    CASE WHEN m.clicks      > 0 THEN m.spend / m.clicks                      ELSE 0 END AS cpc,
    CASE WHEN m.impressions > 0 THEN m.spend / m.impressions * 1000          ELSE 0 END AS cpm,
    CASE WHEN m.conversions > 0 THEN m.spend / m.conversions                 ELSE 0 END AS cpa,
    CASE WHEN m.spend       > 0 THEN m.conversion_value / m.spend            ELSE 0 END AS roas
FROM ad_metrics m
JOIN accounts a ON a.id = m.account_id
LEFT JOIN clients c ON c.id = a.client_id;
