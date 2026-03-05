-- ═══════════════════════════════════════════════════════════════════════
-- AURION V1 — pg_cron Daily Recompute
-- Run this in Supabase SQL Editor AFTER 001_aurion_v1.sql
-- Requires pg_cron extension to be enabled in your Supabase project:
-- Dashboard → Database → Extensions → search "pg_cron" → Enable
-- ═══════════════════════════════════════════════════════════════════════
-- Enable the pg_cron extension (run once)
CREATE EXTENSION IF NOT EXISTS pg_cron;
-- ── Daily function: recomputes metrics for all active accounts ─────────────
-- This calls the ingestion_runs table to find accounts due for recompute.
-- The actual compute is triggered via edge function or handled server-side.
-- Here we create a helper table + stored procedure for tracking.
-- Job 1: Mark accounts due for daily sync (1:00 UTC)
-- In production: this function would call a webhook/edge function that
-- triggers computeAndSaveMetrics for each active account.
-- For Supabase Free/Pro: use the Supabase Edge Functions + pg_net instead.
SELECT cron.schedule(
        'aurion-daily-metric-flag',
        -- job name
        '0 1 * * *',
        -- every day at 01:00 UTC
        $$
        UPDATE exchange_accounts
        SET status = 'pending_sync'
        WHERE status = 'active'
            AND (
                last_sync_at IS NULL
                OR last_sync_at < now() - INTERVAL '20 hours'
            );
$$
);
-- Job 2: Cleanup old ingestion_runs (keeps last 30 days, runs at 02:00 UTC)
SELECT cron.schedule(
        'aurion-cleanup-ingestion-runs',
        '0 2 * * *',
        $$
        DELETE FROM ingestion_runs
        WHERE started_at < now() - INTERVAL '30 days';
$$
);
-- Job 3: Cleanup old raw_events (keeps last 90 days, runs at 03:00 UTC)
SELECT cron.schedule(
        'aurion-cleanup-raw-events',
        '0 3 * * *',
        $$
        DELETE FROM raw_events
        WHERE ingested_at < now() - INTERVAL '90 days';
$$
);
-- Job 4: Cleanup old read aurion_insights (keeps last 60 days)
SELECT cron.schedule(
        'aurion-cleanup-old-insights',
        '0 4 * * *',
        $$
        DELETE FROM aurion_insights
        WHERE is_read = true
            AND generated_at < now() - INTERVAL '60 days';
$$
);
-- ── Verify jobs are scheduled ──────────────────────────────────────────────
-- Run this to check:
-- SELECT * FROM cron.job;
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
-- ══════════════════════════════════════════════════════════════════════════
-- NOTE: For the actual metrics recompute (computeAndSaveMetrics), use
-- Supabase Edge Functions with pg_net to call your /api/aurion/reanalyze
-- endpoint on a schedule. Example:
--
-- SELECT cron.schedule(
--   'aurion-daily-recompute',
--   '0 1 * * *',
--   $$
--     SELECT net.http_post(
--       url := 'https://your-project.vercel.app/api/aurion/reanalyze',
--       headers := '{"Authorization": "Bearer <SERVICE_KEY>"}',
--       body := '{"all": true}'
--     );
--   $$
-- );
-- ══════════════════════════════════════════════════════════════════════════