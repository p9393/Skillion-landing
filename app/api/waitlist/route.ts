import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
      // If the email is already in the waitlist (unique violation), return success silently
      if (dbError.code === "23505") {
        return NextResponse.json({ success: true, message: "Already on waitlist.", debug });
      }
      return NextResponse.json({ error: "Could not save to waitlist.", detail: dbError, debug }, { status: 500 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    debug.push(`Resend key present: ${!!apiKey}`);

    if (!apiKey) {
      // Dev mode: just log and return success
      debug.push("Skipping emails (dev mode)");
      return NextResponse.json({ success: true, dev: true, debug });
    }

    // Send notification to Skillion admin
    debug.push("Sending notify email via Resend");
    const FROM_NOTIFY = "Skillion Waitlist <contact@skillion.finance>";
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
        html: `<p>New: ${email}</p>`,
      }),
    });
    debug.push(`Notify email sent, status: ${res.status}`);

    if (!res.ok) {
      const err = await res.text();
      debug.push(`Resend notify error: ${err}`);
      return NextResponse.json({ error: "Email service error.", debug }, { status: 500 });
    }

    // Send confirmation email to user
    debug.push("Sending confirmation email to user via Resend");
    const FROM_USER = "Skillion Finance <contact@skillion.finance>";
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
        html: `<p>You are on the list.</p>`,
      }),
    });
    debug.push(`Confirmation email sent, status: ${res2.status}`);

    if (!res2.ok) {
      const err2 = await res2.text();
      debug.push(`Resend confirmation error: ${err2}`);
    }

    debug.push("Fully completed");
    return NextResponse.json({ success: true, debug });
  } catch (e) {
    debug.push(`Exception caught: ${String(e)}`);
    return NextResponse.json({ error: "Server error.", detail: String(e), debug }, { status: 500 });
  }
}
