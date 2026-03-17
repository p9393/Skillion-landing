import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { runIngestion } from '@/lib/ingestion/pipeline'
import { checkRateLimit, logAction } from '@/utils/rate-limit'

const supabaseAdmin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── POST /api/ingestion/trigger ─────────────────────────────────────────────
export async function POST(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({})) as { accountId?: string }
    const accountId = body.accountId

    if (!accountId) {
        return NextResponse.json({ error: 'accountId is required' }, { status: 400 })
    }

    // Verify ownership
    const { data: account } = await supabaseAdmin
        .from('exchange_accounts')
        .select('id, exchange, status')
        .eq('id', accountId)
        .eq('user_id', user.id)
        .single()

    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    if (account.status === 'revoked') {
        return NextResponse.json({ error: 'Account is revoked' }, { status: 400 })
    }

    // Rate limit: max 3 syncs per account per day
    const allowed = await checkRateLimit(supabaseAdmin, user.id, `ingestion_${accountId}`, 3)
    if (!allowed) {
        return NextResponse.json({
            error: 'Rate limit: maximum 3 syncs per account per day.',
        }, { status: 429 })
    }

    // Log the trigger attempt
    await logAction(supabaseAdmin, user.id, `ingestion_${accountId}`, { exchange: account.exchange })

    // Run ingestion async (don't await — return runId for polling)
    // In production: push to a queue. Here: fire-and-forget with error capture
    let runId: string | null = null

    try {
        // Start ingestion (runs in background, but we return runId immediately)
        const promise = runIngestion(accountId, user.id)

        // Wait max 2s for run ID to be created, then return
        const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 2000))
        const result = await Promise.race([
            promise.then(r => r),
            timeout,
        ])

        if (result) {
            runId = result.runId
        }
    } catch (err) {
        // Ingestion failure is logged internally by pipeline
        console.error('[trigger] Ingestion error:', err)
    }

    return NextResponse.json({
        success: true,
        runId,
        message: 'Sync started. Poll /api/ingestion/status/[runId] for progress.',
    })
}
