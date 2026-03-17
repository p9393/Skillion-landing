import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const supabaseAdmin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── DELETE /api/accounts/[id] — disconnect account ─────────────────────────
export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    // Verify ownership
    const { data: account } = await supabaseAdmin
        .from('exchange_accounts')
        .select('id, exchange, label')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    // Delete credentials first (ON DELETE CASCADE will also clean up, but explicit is safer)
    await supabaseAdmin.from('api_credentials').delete().eq('account_id', id)

    // Mark as revoked (keep data for audit, hard delete optional)
    await supabaseAdmin
        .from('exchange_accounts')
        .update({ status: 'revoked' })
        .eq('id', id)

    // Audit
    await supabaseAdmin.from('audit_logs').insert({
        user_id: user.id,
        action: 'account_disconnected',
        target_id: id,
        metadata: { exchange: account.exchange, label: account.label },
    })

    return NextResponse.json({ success: true })
}
