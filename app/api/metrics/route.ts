import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

function getAdmin() {
    return createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// ── GET /api/metrics ───────────────────────────────────────────────────────
export async function GET(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get('accountId')
    const admin = getAdmin()

    let query = admin
        .from('metrics_daily')
        .select('*')
        .eq('user_id', user.id)
        .order('computed_at', { ascending: false })
        .limit(1)

    if (accountId) query = query.eq('account_id', accountId)

    const { data: metrics, error } = await query.single()
    if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ metrics: metrics ?? null })
}
