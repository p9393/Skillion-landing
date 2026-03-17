/**
 * POST /api/aurion/reanalyze
 *
 * Triggers a full recompute: fetches trades from DB, runs metrics engine,
 * recomputes SDI score, saves new snapshot + factors + auto-generates insights.
 *
 * Rate limit: max 3 recomputes per account per day.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { computeAndSaveMetrics } from '@/lib/metrics/engine'
import { checkRateLimit, logAction } from '@/utils/rate-limit'

function getAdmin() {
    return createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json().catch(() => ({})) as { accountId?: string; periodDays?: number }
        const { accountId, periodDays = 90 } = body

        const admin = getAdmin()

        // Resolve which accounts to recompute
        let accountIds: string[] = []

        if (accountId) {
            // Verify ownership
            const { data: acc } = await admin
                .from('exchange_accounts')
                .select('id')
                .eq('id', accountId)
                .eq('user_id', user.id)
                .eq('status', 'active')
                .single()

            if (!acc) return NextResponse.json({ error: 'Account not found or not active.' }, { status: 404 })
            accountIds = [accountId]
        } else {
            // Recompute for all active accounts of this user
            const { data: accounts } = await admin
                .from('exchange_accounts')
                .select('id')
                .eq('user_id', user.id)
                .eq('status', 'active')

            accountIds = (accounts ?? []).map(a => a.id)
        }

        if (accountIds.length === 0) {
            return NextResponse.json({
                error: 'No active exchange accounts found. Connect an exchange first.',
            }, { status: 404 })
        }

        // Rate limit: max 3 recomputes per day across all accounts
        const allowed = await checkRateLimit(admin, user.id, 'reanalyze', 3)
        if (!allowed) {
            return NextResponse.json({
                error: 'Rate limit: max 3 recomputes per day. Try again tomorrow.',
            }, { status: 429 })
        }

        // Run metrics engine for each account
        const results: Array<{
            accountId: string
            sdiTotal?: number
            tier?: string
            error?: string
        }> = []

        for (const accId of accountIds) {
            try {
                const { sdiTotal, snapshotId } = await computeAndSaveMetrics({
                    accountId: accId,
                    userId: user.id,
                    periodDays,
                })

                // Fetch tier for response
                const { data: snap } = await admin
                    .from('score_snapshots')
                    .select('tier')
                    .eq('id', snapshotId)
                    .single()

                results.push({ accountId: accId, sdiTotal, tier: snap?.tier ?? 'unknown' })
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err)
                results.push({ accountId: accId, error: msg })
            }
        }

        await logAction(admin, user.id, 'reanalyze', {
            accountCount: accountIds.length,
            results: results.map(r => ({ accountId: r.accountId, sdiTotal: r.sdiTotal, error: r.error })),
        })

        const success = results.filter(r => !r.error)
        const failed = results.filter(r => r.error)

        return NextResponse.json({
            success: true,
            computed: success.length,
            failed: failed.length,
            results,
            message: success.length > 0
                ? `Score recomputed for ${success.length} account(s). SDI: ${success[0]?.sdiTotal ?? 'N/A'} (${success[0]?.tier ?? ''})`
                : 'Computation failed for all accounts.',
        })

    } catch (err) {
        console.error('[reanalyze] Error:', err)
        const message = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 })
    }
}
