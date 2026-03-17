import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

export const dynamic = "force-dynamic";

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

    // ── OpenAI key check ──────────────────────────────────────────
    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
            { error: "Servizio temporaneamente non disponibile." },
            { status: 500 }
        );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let body: { message?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Body JSON non valido." }, { status: 400 });
    }

    const message = body?.message?.trim();
    if (!message) {
        return NextResponse.json({ error: "Messaggio mancante." }, { status: 400 });
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