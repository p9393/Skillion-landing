import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

export const dynamic = "force-dynamic";

// ─── Per-user rate limiter (10 req/min) ─────────────────────────────
const userRateMap = new Map<string, { count: number; resetAt: number }>();
const AURION_RATE_MAX = 10;
const AURION_RATE_WINDOW = 60_000; // 1 min

function checkUserRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = userRateMap.get(userId);
  if (!record || now > record.resetAt) {
    userRateMap.set(userId, { count: 1, resetAt: now + AURION_RATE_WINDOW });
    return true;
  }
  if (record.count >= AURION_RATE_MAX) return false;
  record.count++;
  return true;
}

// ─── Sanitize input: trim + max length ──────────────────────────────
function sanitizeMessage(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 800) return null;
  return trimmed;
}

export async function POST(req: Request) {
    // ── Auth gate ─────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json(
            { error: "Accesso riservato agli utenti Skillion registrati." },
            { status: 401 }
        );
    }

    // ── Rate limiting (10 req/min per user) ────────────────────────
    if (!checkUserRateLimit(user.id)) {
        return NextResponse.json(
            { error: "Limite richieste raggiunto. Riprova tra qualche istante." },
            { status: 429 }
        );
    }

    // ── OpenAI key check ──────────────────────────────────────────
    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
            { error: "Servizio temporaneamente non disponibile." },
            { status: 500 }
        );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let body: { message?: unknown };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Body JSON non valido." }, { status: 400 });
    }

    const message = sanitizeMessage(body?.message);
    if (!message) {
        return NextResponse.json({ error: "Messaggio mancante o troppo lungo (max 800 caratteri)." }, { status: 400 });
    }

    const systemPrompt =
        "Sei Aurion, il layer di intelligenza analitica di Skillion Finance. " +
        "Tono professionale, calmo, istituzionale. " +
        "Interpreti dati comportamentali, tracci la progressione e fornisci feedback sulla disciplina finanziaria. " +
        "Non fornire mai consigli finanziari personalizzati. " +
        `L'utente autenticato è: ${user.email ?? "membro Skillion"}.` +
        "Rispondi in italiano a meno che l'utente scriva in un'altra lingua.";

    const models = ["gpt-4o", "gpt-4o-mini"];

    for (const model of models) {
        try {
            const completion = await openai.chat.completions.create({
                model,
                temperature: 0.45,
                max_tokens: 600,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message },
                ],
            });

            const reply = completion.choices?.[0]?.message?.content?.trim() ?? "";
            return NextResponse.json({ reply, model });

        } catch (err: unknown) {
            const isModelError =
                err instanceof Error &&
                (err.message.includes("model") || err.message.includes("access") || err.message.includes("404"));

            console.error(`[Aurion] ${model} error:`, err instanceof Error ? err.message : err);

            if (isModelError && model !== models[models.length - 1]) continue;

            const errMsg = err instanceof Error ? err.message : "Errore sconosciuto";
            return NextResponse.json({ error: `Aurion non disponibile: ${errMsg}` }, { status: 500 });
        }
    }

    return NextResponse.json({ error: "Nessun modello disponibile." }, { status: 500 });
}