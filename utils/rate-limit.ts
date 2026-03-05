/**
 * Supabase-based rate limiter.
 * No Redis required — uses audit_logs table as a counter.
 *
 * Usage:
 *   const ok = await checkRateLimit(supabase, userId, 'upload', 5)
 *   if (!ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
 */
import { SupabaseClient } from '@supabase/supabase-js'

export async function checkRateLimit(
    supabase: SupabaseClient,
    userId: string,
    action: string,
    maxPerDay: number,
): Promise<boolean> {
    try {
        const since = new Date(Date.now() - 86400000).toISOString()
        const { count, error } = await supabase
            .from('audit_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('action', action)
            .gte('created_at', since)

        if (error) {
            // On DB error, allow the request (fail open)
            console.warn('[rateLimit] DB error, failing open:', error.message)
            return true
        }

        return (count || 0) < maxPerDay
    } catch {
        return true // Fail open on unexpected errors
    }
}

export async function logAction(
    supabase: SupabaseClient,
    userId: string,
    action: string,
    metadata?: Record<string, unknown>,
): Promise<void> {
    await supabase.from('audit_logs').insert({
        user_id: userId,
        action,
        metadata: metadata || {},
    }).then(({ error }) => {
        if (error) console.warn('[rateLimit] Failed to log action:', error.message)
    })
}
