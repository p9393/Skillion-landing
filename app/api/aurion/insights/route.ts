import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getRiskFlags, getScoreContext } from '@/lib/aurion/tools'

function getAdmin() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

// ── GET /api/aurion/insights ───────────────────────────────────────────────
export async function GET(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get('accountId')
    const admin = getAdmin()

    let query = admin
        .from('aurion_insights')
        .select('id, insight_type, title, body, severity, is_read, generated_at, account_id')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(20)

    if (accountId) query = query.eq('account_id', accountId)
    const { data: insights, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Auto-generate insights if none exist yet
    if (!insights || insights.length === 0) {
        const generated = await generateAndSaveInsights(user.id, accountId, admin)
        return NextResponse.json({ insights: generated })
    }

    return NextResponse.json({ insights })
}

type InsightSeverity = 'info' | 'warning' | 'critical'
type InsightType = 'performance' | 'risk' | 'behavior' | 'coaching' | 'anomaly'

interface InsightInsert {
    user_id: string
    account_id: string | null
    insight_type: InsightType
    title: string
    body: string
    severity: InsightSeverity
}

async function generateAndSaveInsights(
    userId: string,
    accountId: string | null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    admin: any
): Promise<unknown[]> {
    const flagsResult = await getRiskFlags(userId, accountId ?? undefined)
    const scoreResult = await getScoreContext(userId, accountId ?? undefined)

    const flags = (flagsResult.data as { flags?: Array<{ severity: string; flag: string; detail: string }> } | null)?.flags ?? []
    const score = (scoreResult.data as { snapshot?: { sdi_total: number; tier: string; risk_discipline: number; efficiency: number } } | null)?.snapshot

    const inserts: InsightInsert[] = []

    for (const flag of flags.slice(0, 3)) {
        inserts.push({
            user_id: userId,
            account_id: accountId,
            insight_type: 'risk',
            title: flag.flag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            body: flag.detail,
            severity: flag.severity === 'critical' ? 'critical' : 'warning',
        })
    }

    if (score) {
        if (score.risk_discipline < 100) {
            inserts.push({
                user_id: userId,
                account_id: accountId,
                insight_type: 'coaching',
                title: 'Risk Discipline Needs Attention',
                body: `Your Risk Discipline sub-score is ${score.risk_discipline}/250. Reduce max drawdown and average leverage to improve this component significantly.`,
                severity: 'warning',
            })
        }
        if (score.efficiency < 100) {
            inserts.push({
                user_id: userId,
                account_id: accountId,
                insight_type: 'performance',
                title: 'Edge/Efficiency Has Room to Grow',
                body: `Efficiency sub-score is ${score.efficiency}/250. Review your win/loss ratio and profit factor to identify where edge is being lost.`,
                severity: 'info',
            })
        }
        if (score.sdi_total >= 500) {
            const tierLabel = score.tier.charAt(0).toUpperCase() + score.tier.slice(1)
            inserts.push({
                user_id: userId,
                account_id: accountId,
                insight_type: 'performance',
                title: `${tierLabel} Tier — Keep Building`,
                body: `SDI at ${score.sdi_total}/1000 puts you in the ${score.tier} tier. Consistency and risk control are your path to the next level.`,
                severity: 'info',
            })
        }
    }

    if (inserts.length === 0) return []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any).from('aurion_insights').insert(inserts).select('id, insight_type, title, body, severity, is_read, generated_at')
    return (data ?? []) as unknown[]
}
