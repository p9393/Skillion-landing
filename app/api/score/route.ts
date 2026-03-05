import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

function getAdmin() {
    return createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// ── GET /api/score ─────────────────────────────────────────────────────────
// Returns latest score snapshot + factors for the authenticated user
export async function GET(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get('accountId')
    const admin = getAdmin()

    // Latest snapshot
    let query = admin
        .from('score_snapshots')
        .select('id, sdi_total, risk_discipline, consistency, efficiency, professionalism, tier, data_quality_score, period_start, period_end, computed_at')
        .eq('user_id', user.id)
        .order('computed_at', { ascending: false })
        .limit(1)

    if (accountId) query = query.eq('account_id', accountId)

    const { data: snapshot, error: snapErr } = await query.single()
    if (snapErr && snapErr.code !== 'PGRST116') {
        return NextResponse.json({ error: snapErr.message }, { status: 500 })
    }
    if (!snapshot) {
        return NextResponse.json({ snapshot: null, factors: [] })
    }

    // Factors for this snapshot
    const { data: factors } = await admin
        .from('score_factors')
        .select('sub_score, factor_name, raw_value, normalized_0_1, weight, contribution, direction, explanation')
        .eq('snapshot_id', snapshot.id)
        .order('sub_score', { ascending: true })

    return NextResponse.json({ snapshot, factors: factors ?? [] })
}
