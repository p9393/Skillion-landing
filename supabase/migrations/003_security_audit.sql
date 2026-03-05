-- ═══════════════════════════════════════════════════════════════════════
-- AURION V1 — Security Audit & RLS Verification
-- Run this in Supabase SQL Editor to verify all security policies.
-- ═══════════════════════════════════════════════════════════════════════
-- ── 1. Verify RLS is enabled on all tables ──────────────────────────────────
SELECT schemaname,
    tablename,
    rowsecurity AS rls_enabled,
    CASE
        WHEN rowsecurity THEN '✅'
        ELSE '❌ MISSING'
    END AS status
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'exchange_accounts',
        'api_credentials',
        'ingestion_runs',
        'raw_events',
        'normalized_trades',
        'daily_equity_curve',
        'metrics_daily',
        'score_snapshots',
        'score_factors',
        'aurion_insights',
        'aurion_messages',
        'audit_logs'
    )
ORDER BY tablename;
-- ── 2. List all RLS policies ────────────────────────────────────────────────
SELECT schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename,
    policyname;
-- ── 3. Verify no table has SELECT without user_id filter ───────────────────
-- This checks that every SELECT policy requires auth.uid() or service role
SELECT tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
    AND cmd IN ('SELECT', 'ALL')
    AND qual NOT LIKE '%auth.uid()%'
    AND roles != '{service_role}'::text [];
-- Expected: 0 rows (all policies should reference auth.uid())
-- ── 4. Verify api_credentials are NOT directly accessible ──────────────────
-- api_credentials should only be accessible via service_role (backend)
SELECT tablename,
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'api_credentials'
    AND schemaname = 'public';
-- ── 5. Check for any tables without RLS that have user data ─────────────────
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
    AND rowsecurity = false
    AND tablename NOT IN (
        -- Tables that are intentionally public (no user data):
        'waitlist_entries' -- Add any other public tables here
    );
-- Expected: 0 rows (all user data tables should have RLS)
-- ── 6. Verify encryption key is set (server-side check) ────────────────────
-- NOTE: Cannot verify ENCRYPTION_KEY_B64 from SQL, but verify it's set
-- in your Vercel environment variables and in .env.local.
-- Run this TypeScript snippet to verify:
-- import { selfTest } from '@/lib/encryption'
-- await selfTest() // should return true
-- ── 7. Audit recent sensitive actions ───────────────────────────────────────
SELECT user_id,
    action,
    created_at,
    metadata
FROM audit_logs
WHERE action IN (
        'connect_exchange',
        'disconnect_exchange',
        'aurion_chat',
        'reanalyze'
    )
ORDER BY created_at DESC
LIMIT 50;
-- ── 8. Check for orphaned api_credentials (no parent account) ───────────────
SELECT ac.id,
    ac.exchange,
    ac.created_at
FROM api_credentials ac
    LEFT JOIN exchange_accounts ea ON ea.id = ac.account_id
WHERE ea.id IS NULL;
-- Expected: 0 rows
-- ── 9. Check for accounts without credentials ───────────────────────────────
SELECT ea.id,
    ea.exchange,
    ea.user_id,
    ea.status
FROM exchange_accounts ea
    LEFT JOIN api_credentials ac ON ac.account_id = ea.id
WHERE ea.status = 'active'
    AND ac.id IS NULL;
-- Expected: 0 rows (active accounts must have credentials)
-- ── 10. RLS self-test: should see only own data ─────────────────────────────
-- Run as an authenticated user (not service role) to verify data isolation:
-- SELECT count(*) FROM normalized_trades;
-- SELECT count(*) FROM score_snapshots;
-- Should only return rows where user_id = auth.uid()
-- ═══════════════════════════════════════════════════════════════════════
-- SECURITY CHECKLIST:
-- [x] RLS enabled on all user-data tables
-- [x] api_credentials: only service_role can read (never anon/authenticated)
-- [x] All data encrypted at rest (AES-256-GCM via ENCRYPTION_KEY_B64)
-- [x] API keys never logged (audit_logs stores action metadata, not keys)
-- [x] Rate limiting on all sensitive endpoints (3 syncs/day, 30 chats/day)
-- [x] Credential verification before any key is saved
-- [x] Only read-only permissions accepted (withdrawal flag checked)
-- [x] Audit logs for: connect, disconnect, sync trigger, reanalyze, chat
-- ═══════════════════════════════════════════════════════════════════════