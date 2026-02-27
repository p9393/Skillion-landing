import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Professional HTML Email Templates ─────────────────────────────────────

function adminNotificationHtml(email: string, timestamp: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Waitlist Signup</title>
</head>
<body style="margin:0;padding:0;background:#05060a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#05060a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#0a0c14;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:13px;font-weight:700;color:#818cf8;letter-spacing:0.15em;text-transform:uppercase;">Skillion Finance</span>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.25);color:#34d399;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;letter-spacing:0.08em;">NEW SIGNUP</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 6px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:rgba(255,255,255,0.3);font-weight:600;">Waitlist Entry</p>
              <h1 style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">New user on the waitlist</h1>

              <!-- Email box -->
              <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:12px;padding:18px 20px;margin-bottom:24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <p style="margin:0 0 4px 0;font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:rgba(255,255,255,0.3);font-weight:600;">Email Address</p>
                      <p style="margin:0;font-size:16px;font-weight:600;color:#a5b4fc;">${email}</p>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span style="font-size:22px;">✉️</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Meta info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;">
                <tr>
                  <td width="50%" style="padding:12px 14px;background:rgba(255,255,255,0.03);border-right:1px solid rgba(255,255,255,0.05);">
                    <p style="margin:0 0 3px 0;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:rgba(255,255,255,0.3);font-weight:600;">Timestamp</p>
                    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.6);font-weight:500;">${timestamp}</p>
                  </td>
                  <td width="50%" style="padding:12px 14px;background:rgba(255,255,255,0.03);">
                    <p style="margin:0 0 3px 0;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:rgba(255,255,255,0.3);font-weight:600;">Source</p>
                    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.6);font-weight:500;">skillion.finance</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);text-align:center;">
                Skillion Finance · Reputation Protocol · <a href="https://www.skillion.finance" style="color:rgba(129,140,248,0.7);text-decoration:none;">skillion.finance</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function userConfirmationHtml(email: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're on the Skillion Waitlist</title>
</head>
<body style="margin:0;padding:0;background:#05060a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#05060a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#0a0c14;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;max-width:560px;width:100%;">
          <!-- Top gradient bar -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#6366f1,#38bdf8,#a855f7);font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <!-- Header -->
          <tr>
            <td style="padding:32px 36px 0;">
              <p style="margin:0 0 20px 0;font-size:13px;font-weight:700;color:#818cf8;letter-spacing:0.15em;text-transform:uppercase;">Skillion Finance</p>
              <!-- Icon -->
              <div style="width:52px;height:52px;background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(168,85,247,0.15));border:1px solid rgba(99,102,241,0.3);border-radius:14px;display:inline-flex;margin-bottom:20px;text-align:center;line-height:52px;font-size:24px;">
                &#x2713;
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:0 36px 28px;">
              <h1 style="margin:0 0 10px 0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.25;">You're on the list.</h1>
              <p style="margin:0 0 24px 0;font-size:15px;color:rgba(255,255,255,0.5);line-height:1.6;">
                We've registered <strong style="color:rgba(165,180,252,0.9);">${email}</strong> for early access to the Skillion Beta.
              </p>

              <!-- Info box -->
              <div style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.15);border-radius:12px;padding:20px 22px;margin-bottom:24px;">
                <p style="margin:0 0 12px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:rgba(255,255,255,0.3);font-weight:700;">What happens next</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom:10px;vertical-align:top;">
                      <span style="color:#818cf8;font-weight:700;margin-right:10px;">01</span>
                      <span style="font-size:13px;color:rgba(255,255,255,0.55);">Your profile enters the founding cohort queue</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:10px;vertical-align:top;">
                      <span style="color:#818cf8;font-weight:700;margin-right:10px;">02</span>
                      <span style="font-size:13px;color:rgba(255,255,255,0.55);">Access is granted progressively, merit-based</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="vertical-align:top;">
                      <span style="color:#818cf8;font-weight:700;margin-right:10px;">03</span>
                      <span style="font-size:13px;color:rgba(255,255,255,0.55);">You'll receive a direct invite when your slot opens</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="https://www.skillion.finance" style="display:inline-block;background:linear-gradient(90deg,#6366f1,#38bdf8);color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:13px 28px;border-radius:10px;letter-spacing:0.04em;">Explore Skillion →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Disclaimer -->
          <tr>
            <td style="padding:18px 36px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);line-height:1.6;">
                Skillion Finance is a reputation analytics platform. This is not a financial offer or solicitation.
                You received this email because you requested early access at <a href="https://www.skillion.finance" style="color:rgba(129,140,248,0.5);text-decoration:none;">skillion.finance</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const debug: string[] = [];
  try {
    debug.push("Received request");
    const body = await req.json();
    const email = (body.email as string | undefined)?.trim().toLowerCase();
    debug.push(`Parsed email: ${email}`);

    // Basic validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address.", debug },
        { status: 400 }
      );
    }

    // Insert into Supabase 'waitlist' table
    debug.push("Initializing Supabase client");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      debug.push("Missing Supabase credentials");
      return NextResponse.json({ error: "Configuration error", debug }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    debug.push("Inserting into waitlist table");
    const { error: dbError } = await supabase
      .from("waitlist")
      .insert({ email });
    debug.push(`Insertion completed, error: ${dbError ? dbError.message : "none"}`);

    if (dbError) {
      // If already registered — return success silently
      if (dbError.code === "23505") {
        return NextResponse.json({ success: true, message: "Already on waitlist.", debug });
      }
      return NextResponse.json({ error: "Could not save to waitlist.", detail: dbError, debug }, { status: 500 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    debug.push(`Resend key present: ${!!apiKey}`);

    if (!apiKey) {
      debug.push("Skipping emails (dev mode — no RESEND_API_KEY)");
      return NextResponse.json({ success: true, dev: true, debug });
    }

    const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC";

    // ── 1. Admin notification email ──────────────────────────────────
    debug.push("Sending admin notification via Resend");
    const notifyRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Skillion Waitlist <contact@skillion.finance>",
        to: ["contact@skillion.finance"],
        subject: `[Waitlist] New signup: ${email}`,
        html: adminNotificationHtml(email, timestamp),
      }),
    });
    debug.push(`Admin notify status: ${notifyRes.status}`);

    if (!notifyRes.ok) {
      const err = await notifyRes.text();
      debug.push(`Resend notify error: ${err}`);
      // Don't fail — continue to confirmation email
    }

    // ── 2. User confirmation email ───────────────────────────────────
    debug.push("Sending confirmation email to user");
    const confirmRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Aurion — Skillion Finance <contact@skillion.finance>",
        to: [email],
        subject: "You're on the Skillion waitlist.",
        html: userConfirmationHtml(email),
      }),
    });
    debug.push(`User confirmation status: ${confirmRes.status}`);

    if (!confirmRes.ok) {
      const err2 = await confirmRes.text();
      debug.push(`Resend confirmation error: ${err2}`);
    }

    debug.push("Fully completed");
    return NextResponse.json({ success: true, debug });
  } catch (e) {
    debug.push(`Exception caught: ${String(e)}`);
    return NextResponse.json({ error: "Server error.", detail: String(e), debug }, { status: 500 });
  }
}
