import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { AURION_SYSTEM_PROMPT, AURION_TOOLS_SCHEMA, classifyIntent, getToolsForIntent } from '@/lib/aurion/prompts'
import { dispatchTool } from '@/lib/aurion/tools'
import { checkRateLimit, logAction } from '@/utils/rate-limit'

function getAdmin() {
    return createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── POST /api/aurion/chat ──────────────────────────────────────────────────
export async function POST(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit: max 30 messages/day
    const admin = getAdmin()
    const allowed = await checkRateLimit(admin, user.id, 'aurion_chat', 30)
    if (!allowed) {
        return NextResponse.json({ error: 'Daily message limit reached (30/day). Try again tomorrow.' }, { status: 429 })
    }

    const body = await req.json().catch(() => ({})) as {
        message?: string
        accountId?: string
        contextWindow?: number
    }

    const userMessage = body.message?.trim()
    if (!userMessage) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

    // Classify intent + determine which tools to make available
    const intent = classifyIntent(userMessage)
    const preferredTools = getToolsForIntent(intent)
    const activeTools = AURION_TOOLS_SCHEMA.filter(t =>
        preferredTools.includes(t.function.name)
    )

    // Fetch conversation history (last N messages)
    const contextN = Math.min(body.contextWindow ?? 8, 16)
    const { data: history } = await admin
        .from('aurion_messages')
        .select('role, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(contextN)

    const conversationHistory = (history ?? []).reverse()

    // Build messages array
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: AURION_SYSTEM_PROMPT },
        ...conversationHistory.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
        })),
        { role: 'user', content: userMessage },
    ]

    // ── Tool-calling loop (max 3 rounds) ────────────────────────────────────────
    let finalContent = ''
    let totalTokens = 0
    const MAX_TOOL_ROUNDS = 3

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages,
            tools: activeTools as OpenAI.Chat.ChatCompletionTool[],
            tool_choice: round === 0 ? 'auto' : 'none',
            temperature: 0.3,
            max_tokens: 1500,
        })

        const choice = response.choices[0]
        totalTokens += response.usage?.total_tokens ?? 0

        // No tool calls — final answer
        if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
            finalContent = choice.message.content ?? ''
            break
        }

        // Process tool calls
        messages.push(choice.message)
        interface ToolCallItem { id: string; function: { name: string; arguments: string } }
        const toolCalls = (choice.message.tool_calls ?? []) as unknown as ToolCallItem[]
        for (const tc of toolCalls) {
            const args = JSON.parse(tc.function.arguments || '{}') as Record<string, string>
            if (body.accountId) args.accountId = body.accountId
            const result = await dispatchTool(tc.function.name, args, user.id)
            messages.push({
                role: 'tool',
                tool_call_id: tc.id,
                content: JSON.stringify(result.data ?? { error: result.error }),
            })
        }
    }

    if (!finalContent) {
        finalContent = 'Unable to generate analysis at this time. Please try again.'
    }

    // ── Save messages to DB ──────────────────────────────────────────────────────
    const msgInserts = [
        { user_id: user.id, account_id: body.accountId ?? null, role: 'user', content: userMessage, model_used: 'gpt-4o' },
        { user_id: user.id, account_id: body.accountId ?? null, role: 'assistant', content: finalContent, tokens_used: totalTokens, model_used: 'gpt-4o' },
    ]
    await admin.from('aurion_messages').insert(msgInserts)
    await logAction(admin, user.id, 'aurion_chat', { intent, tokens: totalTokens })

    return NextResponse.json({ response: finalContent, intent, tokensUsed: totalTokens })
}
