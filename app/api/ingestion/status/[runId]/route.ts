import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── GET /api/ingestion/status/[runId] ──────────────────────────────────────
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ runId: string }> }
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { runId } = await params

    const { data: run, error } = await supabaseAdmin
        .from('ingestion_runs')
        .select('id, status, trades_fetched, trades_new, error_msg, started_at, completed_at')
        .eq('id', runId)
        .eq('user_id', user.id)
        .single()

    if (error || !run) return NextResponse.json({ error: 'Run not found' }, { status: 404 })

    return NextResponse.json({ run })
}
