import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

/**
 * POST /api/beta-invite
 * 
 * Admin-only endpoint to move a waitlisted user into the Closed Beta.
 * - Creates a Supabase auth user invitation
 * - Sends a branded beta access email via Resend
 * - Marks the waitlist entry as 'invited'
 * 
 * Body: { email: string }
 * Requires: x-admin-secret header matching ADMIN_SECRET env var
 */
export async function POST(req: NextRequest) {
    // ── Admin auth ──────────────────────────────────────────────────────
    const secret = req.headers.get('x-admin-secret')
    if (!secret || secret !== process.env.ADMIN_SECRET) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const email = (body.email as string | undefined)?.trim().toLowerCase()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const admin = createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ── Check waitlist entry ────────────────────────────────────────────
    const { data: entry } = await admin
        .from('waitlist')
        .select('id, status')
        .eq('email', email)
        .single()

    if (!entry) {
        return NextResponse.json({ error: 'Email not found in waitlist' }, { status: 404 })
    }

    if (entry.status === 'invited') {
        return NextResponse.json({ error: 'User already invited', already_invited: true }, { status: 409 })
    }

    // ── Create Supabase invite ──────────────────────────────────────────
    const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.skillion.finance'}/auth/callback?type=beta`,
    })

    if (inviteErr) {
        console.error('[beta-invite] Supabase invite error:', inviteErr.message)
        return NextResponse.json({ error: inviteErr.message }, { status: 500 })
    }

    // ── Send branded beta access email ──────────────────────────────────
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: 'Aurion — Skillion Finance <contact@skillion.finance>',
                to: [email],
                subject: "Your Skillion Beta access is ready.",
                html: betaInviteHtml(email),
            }),
        })
    }

    // ── Mark waitlist entry as invited ─────────────────────────────────
    await admin
        .from('waitlist')
        .update({ status: 'invited', invited_at: new Date().toISOString() })
        .eq('email', email)

    return NextResponse.json({ success: true, email, invited_at: new Date().toISOString() })
}

function betaInviteHtml(email: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Skillion Beta Access</title>
</head>
<body style="margin:0;padding:0;background:#05060a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#05060a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0a0c14;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
        <tr><td style="height:3px;background:linear-gradient(90deg,#00F0FF,#7000FF);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:36px 36px 0;">
          <p style="margin:0 0 20px 0;font-size:13px;font-weight:700;color:#00F0FF;letter-spacing:0.15em;text-transform:uppercase;">Skillion Finance</p>
          <h1 style="margin:0 0 12px 0;font-size:28px;font-weight:700;color:#ffffff;line-height:1.2;">Your Beta access is ready.</h1>
          <p style="margin:0 0 28px 0;font-size:15px;color:rgba(255,255,255,0.5);line-height:1.7;">
            <strong style="color:rgba(165,180,252,0.9);">${email}</strong> — you've been selected as a Founding Member of the Skillion Closed Beta. Welcome to the network.
          </p>
          <div style="background:rgba(0,240,255,0.05);border:1px solid rgba(0,240,255,0.15);border-radius:12px;padding:20px 22px;margin-bottom:28px;">
            <p style="margin:0 0 12px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:rgba(255,255,255,0.3);font-weight:700;">Founding Member Benefits</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding-bottom:10px;vertical-align:top;">
                <span style="color:#00F0FF;font-weight:700;margin-right:10px;">✓</span>
                <span style="font-size:13px;color:rgba(255,255,255,0.6);">Full SDI Score access — all 4 sub-scores + factor breakdown</span>
              </td></tr>
              <tr><td style="padding-bottom:10px;vertical-align:top;">
                <span style="color:#00F0FF;font-weight:700;margin-right:10px;">✓</span>
                <span style="font-size:13px;color:rgba(255,255,255,0.6);">Aurion AI chat — personal performance intelligence</span>
              </td></tr>
              <tr><td style="vertical-align:top;">
                <span style="color:#00F0FF;font-weight:700;margin-right:10px;">✓</span>
                <span style="font-size:13px;color:rgba(255,255,255,0.6);">Founding Member badge — locked into your reputation profile</span>
              </td></tr>
            </table>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td>
              <a href="https://www.skillion.finance/auth/login" style="display:inline-block;background:linear-gradient(90deg,#00F0FF,#7000FF);color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;letter-spacing:0.04em;">Access Beta Platform →</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 36px;border-top:1px solid rgba(255,255,255,0.06);margin-top:28px;">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);line-height:1.6;">
            Skillion Finance is a reputation analytics platform. Not financial advice. You received this because you signed up at
            <a href="https://www.skillion.finance" style="color:rgba(0,240,255,0.5);text-decoration:none;">skillion.finance</a>.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
