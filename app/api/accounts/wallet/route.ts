import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { z } from 'zod'

function getAdmin() {
    return createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

const WalletSchema = z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid EVM wallet address'),
    label: z.string().min(1).max(50).optional(),
    chain: z.enum(['ethereum', 'arbitrum', 'base', 'polygon', 'optimism']).default('ethereum'),
})

/**
 * GET /api/accounts/wallet
 * Returns all registered wallets for the authenticated user
 */
export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdmin()
    const { data: wallets, error } = await admin
        .from('defi_wallets')
        .select('id, address, label, chain, status, created_at, last_sync_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ wallets: wallets ?? [] })
}

/**
 * POST /api/accounts/wallet
 * Registers a new DeFi wallet address (read-only — no private key required)
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    const parsed = WalletSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { address, label, chain } = parsed.data
    const admin = getAdmin()

    // Max 3 wallets per user
    const { count } = await admin
        .from('defi_wallets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .neq('status', 'removed')

    if ((count ?? 0) >= 3) {
        return NextResponse.json({ error: 'Maximum 3 DeFi wallets per user.' }, { status: 429 })
    }

    // Prevent duplicate addresses for same user
    const { data: existing } = await admin
        .from('defi_wallets')
        .select('id')
        .eq('user_id', user.id)
        .eq('address', address.toLowerCase())
        .single()

    if (existing) {
        return NextResponse.json({ error: 'This wallet address is already registered.' }, { status: 409 })
    }

    // Store wallet (checksummed address, lowercase for dedup)
    const { data: wallet, error: insertErr } = await admin
        .from('defi_wallets')
        .insert({
            user_id: user.id,
            address: address.toLowerCase(),
            label: label ?? `${chain.charAt(0).toUpperCase() + chain.slice(1)} Wallet`,
            chain,
            status: 'pending_sync',
        })
        .select('id, address, label, chain, status')
        .single()

    if (insertErr || !wallet) {
        return NextResponse.json({ error: 'Failed to register wallet.' }, { status: 500 })
    }

    // Audit log
    await admin.from('audit_logs').insert({
        user_id: user.id,
        action: 'wallet_registered',
        target_id: wallet.id,
        metadata: { address: wallet.address, chain },
    })

    return NextResponse.json({
        success: true,
        wallet,
        message: `${chain} wallet registered. On-chain data will be synced shortly.`,
    }, { status: 201 })
}

/**
 * DELETE /api/accounts/wallet
 * Removes a registered wallet
 */
export async function DELETE(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { walletId } = await req.json().catch(() => ({})) as { walletId?: string }
    if (!walletId) return NextResponse.json({ error: 'walletId required' }, { status: 400 })

    const admin = getAdmin()
    const { error } = await admin
        .from('defi_wallets')
        .update({ status: 'removed' })
        .eq('id', walletId)
        .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
