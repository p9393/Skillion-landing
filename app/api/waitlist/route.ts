import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email as string | undefined)?.trim().toLowerCase();

    // Basic validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // Dev mode: just log and return success
      console.log(`[Waitlist] New signup (no API key): ${email}`);
      return NextResponse.json({ success: true, dev: true });
    }

    // Domain skillion.finance is now verified on Resend — using the official domain.
    const FROM_NOTIFY = "Skillion Waitlist <contact@skillion.finance>";
    const FROM_USER = "Skillion Finance <contact@skillion.finance>";

    // Send notification to Skillion admin
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_NOTIFY,
        to: ["contact@skillion.finance"],
        subject: `[Waitlist] New signup: ${email}`,
        html: `
          <div style="font-family:monospace;background:#05060a;color:#fff;padding:24px;border-radius:12px">
            <h2 style="color:#22d3ee;margin:0 0 12px">New Waitlist Signup</h2>
            <p style="margin:0;color:rgba(255,255,255,0.6)">Email: <strong style="color:#fff">${email}</strong></p>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.4);font-size:12px">${new Date().toISOString()}</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Waitlist] Resend error (notify):", err);
      return NextResponse.json({ error: "Email service error." }, { status: 500 });
    }

    // Send confirmation email to user
    const res2 = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_USER,
        to: [email],
        subject: "You're on the Skillion waitlist.",
        html: `
          <div style="font-family:-apple-system,sans-serif;background:#05060a;color:#fff;padding:40px;max-width:480px;margin:auto;border-radius:16px;border:1px solid rgba(255,255,255,0.08)">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">
              <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#22d3ee,#d946ef)"></div>
              <div>
                <div style="font-size:13px;font-weight:600;letter-spacing:0.08em">SKILLION</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.45)">FINANCE</div>
              </div>
            </div>
            <h1 style="font-size:24px;font-weight:600;margin:0 0 12px;line-height:1.3">
              You're in the queue.
            </h1>
            <p style="color:rgba(255,255,255,0.55);font-size:15px;line-height:1.6;margin:0 0 24px">
              Access to Skillion is merit-gated. We'll review your place in the cohort and reach out when your invitation is ready.<br><br>
              In the meantime — keep your discipline sharp.
            </p>
            <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;margin-top:8px">
              <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;font-style:italic">
                "Your discipline is your edge. Your edge is your capital." — Aurion
              </p>
            </div>
            <div style="margin-top:24px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.2);font-size:11px">
              Skillion Finance · contact@skillion.finance<br>
              You received this because you signed up at skillion.finance
            </div>
          </div>
        `,
      }),
    });

    if (!res2.ok) {
      const err2 = await res2.text();
      console.error("[Waitlist] Resend error (confirm):", err2);
      // Don't fail the whole request if only confirmation fails
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[Waitlist] Unexpected error:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
