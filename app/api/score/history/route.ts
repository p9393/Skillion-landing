import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { explainScoreDelta } from '@/lib/scoring/explainability'

function getAdmin() {
    return createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// ── GET /api/score/history ─────────────────────────────────────────────────
// Returns last N score snapshots with delta explanations
export async function GET(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const n = Math.min(parseInt(searchParams.get('n') ?? '20', 10), 50)
    const accountId = searchParams.get('accountId')
    const admin = getAdmin()

    let query = admin
        .from('score_snapshots')
        .select('id, sdi_total, risk_discipline, consistency, efficiency, professionalism, tier, data_quality_score, period_start, period_end, computed_at, account_id')
        .eq('user_id', user.id)
        .order('computed_at', { ascending: false })
        .limit(n)

    if (accountId) query = query.eq('account_id', accountId)

    const { data: snapshots, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const list = snapshots ?? []

    // Compute delta explanations between consecutive snapshots
    const withDeltas = list.map((snap, i) => {
        if (i === list.length - 1) {
            return { ...snap, delta: null }
        }
        const prev = list[i + 1] // list is DESC, so next in array = older
        const delta = explainScoreDelta(
            { ...prev, factors: undefined },
            { ...snap, factors: undefined }
        )
        return { ...snap, delta }
    })

    return NextResponse.json({ history: withDeltas })
}
