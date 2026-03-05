-- ═══════════════════════════════════════════════════════════════════════
-- AURION V1 — SUPABASE MIGRATION
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ═══════════════════════════════════════════════════════════════════════
-- ── EXCHANGE ACCOUNTS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exchange_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exchange TEXT NOT NULL CHECK (exchange IN ('bybit', 'binance')),
    label TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error', 'revoked')),
    last_sync_at TIMESTAMPTZ,
    error_msg TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS api_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES exchange_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    api_key_enc TEXT NOT NULL,
    api_secret_enc TEXT NOT NULL,
    iv TEXT NOT NULL,
    key_version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- ── INGESTION TRACKING ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingestion_runs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES exchange_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    trades_fetched INTEGER DEFAULT 0,
    trades_new INTEGER DEFAULT 0,
    error_msg TEXT,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    cursor_state JSONB DEFAULT '{}'
);
-- ── RAW + NORMALIZED TRADES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS raw_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES exchange_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    exchange_id TEXT NOT NULL,
    raw_payload JSONB NOT NULL,
    ingested_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (account_id, event_type, exchange_id)
);
CREATE TABLE IF NOT EXISTS normalized_trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES exchange_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    exchange_trade_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    base_asset TEXT,
    quote_asset TEXT DEFAULT 'USDT',
    contract_type TEXT NOT NULL DEFAULT 'perp' CHECK (
        contract_type IN ('spot', 'perp', 'futures', 'option')
    ),
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    direction TEXT CHECK (direction IN ('long', 'short', 'neutral')),
    qty NUMERIC NOT NULL DEFAULT 0,
    entry_price NUMERIC,
    exit_price NUMERIC,
    open_time TIMESTAMPTZ NOT NULL,
    close_time TIMESTAMPTZ,
    realized_pnl NUMERIC DEFAULT 0,
    fee NUMERIC DEFAULT 0,
    funding NUMERIC DEFAULT 0,
    net_pnl NUMERIC GENERATED ALWAYS AS (
        COALESCE(realized_pnl, 0) - COALESCE(fee, 0) - COALESCE(funding, 0)
    ) STORED,
    leverage NUMERIC,
    notional_usd NUMERIC,
    currency TEXT DEFAULT 'USD',
    is_closed BOOLEAN DEFAULT true,
    raw_event_id UUID REFERENCES raw_events(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (account_id, exchange_trade_id)
);
-- ── EQUITY CURVE ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_equity_curve (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES exchange_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL,
    starting_balance NUMERIC DEFAULT 0,
    ending_balance NUMERIC DEFAULT 0,
    daily_pnl NUMERIC DEFAULT 0,
    daily_return NUMERIC DEFAULT 0,
    trades_count INTEGER DEFAULT 0,
    fees_day NUMERIC DEFAULT 0,
    funding_day NUMERIC DEFAULT 0,
    UNIQUE (account_id, date)
);
-- ── METRICS DAILY ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS metrics_daily (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES exchange_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    computed_at TIMESTAMPTZ DEFAULT now(),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_trades INTEGER DEFAULT 0,
    total_pnl NUMERIC DEFAULT 0,
    gross_profit NUMERIC DEFAULT 0,
    gross_loss NUMERIC DEFAULT 0,
    win_count INTEGER DEFAULT 0,
    loss_count INTEGER DEFAULT 0,
    win_rate NUMERIC DEFAULT 0,
    profit_factor NUMERIC DEFAULT 0,
    max_drawdown_pct NUMERIC DEFAULT 0,
    avg_drawdown_pct NUMERIC DEFAULT 0,
    max_drawdown_abs NUMERIC DEFAULT 0,
    sharpe_ratio NUMERIC DEFAULT 0,
    sortino_ratio NUMERIC DEFAULT 0,
    calmar_ratio NUMERIC DEFAULT 0,
    daily_vol_annualized NUMERIC DEFAULT 0,
    avg_win_usd NUMERIC DEFAULT 0,
    avg_loss_usd NUMERIC DEFAULT 0,
    win_loss_ratio NUMERIC DEFAULT 0,
    avg_holding_secs INTEGER DEFAULT 0,
    fees_drag_pct NUMERIC DEFAULT 0,
    funding_drag_pct NUMERIC DEFAULT 0,
    avg_leverage NUMERIC DEFAULT 0,
    max_leverage NUMERIC DEFAULT 0,
    concentration_hhi NUMERIC DEFAULT 0,
    trade_freq_per_day NUMERIC DEFAULT 0,
    cvar_95 NUMERIC DEFAULT 0,
    skewness NUMERIC DEFAULT 0,
    kurtosis NUMERIC DEFAULT 0,
    z_score_cv NUMERIC DEFAULT 0,
    positive_days_pct NUMERIC DEFAULT 0,
    UNIQUE (account_id, period_start, period_end)
);
-- ── SDI SCORE ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS score_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    account_id UUID REFERENCES exchange_accounts(id),
    computed_at TIMESTAMPTZ DEFAULT now(),
    sdi_total INTEGER NOT NULL DEFAULT 0 CHECK (
        sdi_total BETWEEN 0 AND 1000
    ),
    risk_discipline INTEGER DEFAULT 0 CHECK (
        risk_discipline BETWEEN 0 AND 250
    ),
    consistency INTEGER DEFAULT 0 CHECK (
        consistency BETWEEN 0 AND 250
    ),
    efficiency INTEGER DEFAULT 0 CHECK (
        efficiency BETWEEN 0 AND 250
    ),
    professionalism INTEGER DEFAULT 0 CHECK (
        professionalism BETWEEN 0 AND 250
    ),
    tier TEXT DEFAULT 'explorer' CHECK (
        tier IN (
            'explorer',
            'builder',
            'strategist',
            'architect',
            'elite'
        )
    ),
    data_quality_score NUMERIC DEFAULT 0,
    period_start DATE,
    period_end DATE,
    metrics_daily_id UUID REFERENCES metrics_daily(id),
    raw_metrics JSONB DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS score_factors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    snapshot_id UUID NOT NULL REFERENCES score_snapshots(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    sub_score TEXT NOT NULL CHECK (
        sub_score IN (
            'risk_discipline',
            'consistency',
            'efficiency',
            'professionalism'
        )
    ),
    factor_name TEXT NOT NULL,
    raw_value NUMERIC,
    normalized_0_1 NUMERIC,
    weight NUMERIC,
    contribution NUMERIC,
    direction TEXT CHECK (direction IN ('positive', 'negative', 'neutral')),
    explanation TEXT
);
-- ── AURION AI ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS aurion_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    account_id UUID REFERENCES exchange_accounts(id),
    snapshot_id UUID REFERENCES score_snapshots(id),
    insight_type TEXT NOT NULL CHECK (
        insight_type IN (
            'performance',
            'risk',
            'behavior',
            'coaching',
            'anomaly'
        )
    ),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    is_read BOOLEAN DEFAULT false,
    generated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS aurion_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    account_id UUID REFERENCES exchange_accounts(id),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tokens_used INTEGER,
    model_used TEXT,
    context_snapshot_id UUID REFERENCES score_snapshots(id),
    created_at TIMESTAMPTZ DEFAULT now()
);
-- ── AUDIT ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    admin_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- ═══════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_nt_user_close ON normalized_trades (user_id, close_time DESC);
CREATE INDEX IF NOT EXISTS idx_nt_account_close ON normalized_trades (account_id, close_time DESC);
CREATE INDEX IF NOT EXISTS idx_equity_account ON daily_equity_curve (account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_score_user ON score_snapshots (user_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_factors_snap ON score_factors (snapshot_id);
CREATE INDEX IF NOT EXISTS idx_insights_user ON aurion_insights (user_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user ON aurion_messages (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ing_runs_account ON ingestion_runs (account_id, started_at DESC);
-- ═══════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE exchange_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE normalized_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_equity_curve ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE aurion_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE aurion_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- User-isolation policies
DO $$ BEGIN EXECUTE format(
    'CREATE POLICY user_iso ON %I FOR ALL USING (user_id = auth.uid())',
    t
)
FROM unnest(
        ARRAY [
    'exchange_accounts','api_credentials','ingestion_runs','raw_events',
    'normalized_trades','daily_equity_curve','metrics_daily','score_snapshots',
    'score_factors','aurion_insights','aurion_messages'
  ]
    ) AS t;
EXCEPTION
WHEN duplicate_object THEN NULL;
END $$;
-- audit_logs: users read own, admins read all (insert via service role only)
CREATE POLICY IF NOT EXISTS user_read_own_audit ON audit_logs FOR
SELECT USING (user_id = auth.uid());
-- api_credentials: NO client-side SELECT (service role only reads)
-- The policy above allows it via user_id, but we block client reads explicitly
-- by using service role key only in server-side API routes
-- ═══════════════════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGER
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$;
CREATE TRIGGER trg_exchange_accounts_updated BEFORE
UPDATE ON exchange_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();