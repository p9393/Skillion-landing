import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { assignTier } from '@/app/lib/tier-certification'

function getAdmin() {
    return createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

/**
 * POST /api/certify
 * 
 * Reads the latest score_snapshot for the authenticated user,
 * computes the correct tier via `assignTier`, and updates:
 *   - score_snapshots.tier
 *   - user_certifications table (upsert)
 * 
 * Called automatically after every score computation.
 * Can also be called manually from the dashboard.
 */
export async function POST() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdmin()

    // 1. Get the latest snapshot
    const { data: snapshot, error: snapErr } = await admin
        .from('score_snapshots')
        .select('id, sdi_total, tier')
        .eq('user_id', user.id)
        .order('computed_at', { ascending: false })
        .limit(1)
        .single()

    if (snapErr || !snapshot) {
        return NextResponse.json({ error: 'No score snapshot found' }, { status: 404 })
    }

    // 2. Assign tier based on SDI score
    const newTier = assignTier(snapshot.sdi_total)
    const tierChanged = newTier !== snapshot.tier

    // 3. Update the snapshot tier
    const { error: updateErr } = await admin
        .from('score_snapshots')
        .update({ tier: newTier })
        .eq('id', snapshot.id)

    if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // 4. Upsert into user_certifications (maintains certification history)
    await admin
        .from('user_certifications')
        .upsert({
            user_id: user.id,
            snapshot_id: snapshot.id,
            tier: newTier,
            sdi_at_certification: snapshot.sdi_total,
            certified_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

    return NextResponse.json({
        success: true,
        sdi_total: snapshot.sdi_total,
        previous_tier: snapshot.tier,
        new_tier: newTier,
        tier_changed: tierChanged,
    })
}

/**
 * GET /api/certify
 * Returns the current certification status for the authenticated user.
 */
export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdmin()

    const { data: cert, error } = await admin
        .from('user_certifications')
        .select('tier, sdi_at_certification, certified_at')
        .eq('user_id', user.id)
        .order('certified_at', { ascending: false })
        .limit(1)
        .single()

    if (error || !cert) {
        return NextResponse.json({ certified: false })
    }

    return NextResponse.json({
        certified: true,
        tier: cert.tier,
        sdi_at_certification: cert.sdi_at_certification,
        certified_at: cert.certified_at,
    })
}
