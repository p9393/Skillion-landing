import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { encrypt } from '@/lib/encryption'
import { verifyBybitCredentials } from '@/lib/connectors/bybit'
import { verifyBinanceCredentials } from '@/lib/connectors/binance'
import { z } from 'zod'

function getAdmin() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

const ConnectSchema = z.object({
    exchange: z.enum(['bybit', 'binance']),
    label: z.string().min(1).max(50),
    apiKey: z.string().min(10).max(200),
    apiSecret: z.string().min(10).max(200),
})

// ── GET /api/accounts ──────────────────────────────────────────────────────
export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdmin()
    const { data: accounts, error } = await admin
        .from('exchange_accounts')
        .select('id, exchange, label, status, last_sync_at, error_msg, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ accounts: accounts ?? [] })
}

// ── POST /api/accounts ─────────────────────────────────────────────────────
export async function POST(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    const parsed = ConnectSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { exchange, label, apiKey, apiSecret } = parsed.data
    const admin = getAdmin()

    // Rate limit: max 5 accounts per user
    const { count } = await admin
        .from('exchange_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .neq('status', 'revoked')

    if ((count ?? 0) >= 5) {
        return NextResponse.json({ error: 'Maximum 5 exchange accounts per user.' }, { status: 429 })
    }

    // Live credential verification
    let isValid = false
    try {
        isValid = exchange === 'bybit'
            ? await verifyBybitCredentials(apiKey, apiSecret)
            : await verifyBinanceCredentials(apiKey, apiSecret)
    } catch {
        return NextResponse.json({ error: 'Unable to reach exchange. Check the API key and try again.' }, { status: 400 })
    }

    if (!isValid) {
        return NextResponse.json({ error: 'Invalid API credentials. Verify the key has read-only permissions.' }, { status: 400 })
    }

    // Encrypt secrets (separate IV per field)
    const encKey = await encrypt(apiKey)
    const encSecret = await encrypt(apiSecret)

    // Create account
    const { data: account, error: accErr } = await admin
        .from('exchange_accounts')
        .insert({ user_id: user.id, exchange, label, status: 'active' })
        .select('id')
        .single()

    if (accErr || !account) {
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    // Store encrypted credentials
    const { error: credErr } = await admin
        .from('api_credentials')
        .insert({
            account_id: account.id,
            user_id: user.id,
            api_key_enc: encKey.cipher,
            api_secret_enc: encSecret.cipher,
            iv: encKey.iv,
        })

    if (credErr) {
        await admin.from('exchange_accounts').delete().eq('id', account.id)
        return NextResponse.json({ error: 'Failed to store credentials' }, { status: 500 })
    }

    await admin.from('audit_logs').insert({
        user_id: user.id,
        action: 'account_connected',
        target_id: account.id,
        metadata: { exchange, label },
    })

    return NextResponse.json({
        success: true,
        accountId: account.id,
        message: `${exchange} account connected. Starting initial sync...`,
    }, { status: 201 })
}
