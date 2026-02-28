-- ============================================================
-- Skillion: MT4/MT5 Integration Schema Migration
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================
-- 1. Add sync_token to profiles (if column doesn't exist)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS sync_token uuid DEFAULT gen_random_uuid() UNIQUE;
-- Backfill existing profiles
UPDATE profiles
SET sync_token = gen_random_uuid()
WHERE sync_token IS NULL;
-- 2. MT4/MT5 raw trade history
CREATE TABLE IF NOT EXISTS mt4_trades (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ticket bigint NOT NULL,
    symbol varchar(20) NOT NULL DEFAULT '',
    trade_type varchar(10) NOT NULL DEFAULT 'buy',
    lots numeric(10, 2) NOT NULL DEFAULT 0,
    open_time timestamptz,
    close_time timestamptz,
    open_price numeric(12, 5) DEFAULT 0,
    close_price numeric(12, 5) DEFAULT 0,
    profit numeric(12, 2) NOT NULL DEFAULT 0,
    commission numeric(12, 2) NOT NULL DEFAULT 0,
    swap numeric(12, 2) NOT NULL DEFAULT 0,
    platform varchar(10) DEFAULT 'MT4',
    broker varchar(100) DEFAULT '',
    mt_login varchar(50) DEFAULT '',
    mt_server varchar(100) DEFAULT '',
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, ticket)
);
ALTER TABLE mt4_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own trades" ON mt4_trades FOR
SELECT USING (auth.uid() = user_id);
-- 3. Computed SDI Scores (one per user, updated on every sync)
CREATE TABLE IF NOT EXISTS sdi_scores (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    computed_at timestamptz DEFAULT now(),
    sdi_score numeric(6, 2) DEFAULT 0,
    sharpe_ratio numeric(8, 4) DEFAULT 0,
    sortino_ratio numeric(8, 4) DEFAULT 0,
    max_drawdown_pct numeric(6, 3) DEFAULT 0,
    win_rate numeric(5, 3) DEFAULT 0,
    profit_factor numeric(8, 4) DEFAULT 0,
    z_score_consistency numeric(8, 4) DEFAULT 0,
    total_trades int DEFAULT 0,
    trading_days int DEFAULT 0,
    tier varchar(20) DEFAULT 'explorer',
    net_profit numeric(12, 2) DEFAULT 0,
    gross_profit numeric(12, 2) DEFAULT 0,
    gross_loss numeric(12, 2) DEFAULT 0,
    platform varchar(10) DEFAULT 'MT4',
    broker varchar(100) DEFAULT '',
    mt_login varchar(50) DEFAULT '',
    mt_server varchar(100) DEFAULT '',
    raw_metrics jsonb DEFAULT '[]'
);
ALTER TABLE sdi_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own score" ON sdi_scores FOR
SELECT USING (auth.uid() = user_id);
-- Service role can write to both tables (needed by API routes)
GRANT ALL ON mt4_trades TO service_role;
GRANT ALL ON sdi_scores TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;
-- 4. Index for performance
CREATE INDEX IF NOT EXISTS mt4_trades_user_id_idx ON mt4_trades(user_id);
CREATE INDEX IF NOT EXISTS mt4_trades_close_time_idx ON mt4_trades(close_time);
CREATE INDEX IF NOT EXISTS sdi_scores_user_id_idx ON sdi_scores(user_id);