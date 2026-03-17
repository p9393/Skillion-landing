import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Fully public routes — skip auth entirely
    if (
        request.nextUrl.pathname.startsWith('/api') ||
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/auth/callback') ||
        request.nextUrl.pathname === '/' ||
        request.nextUrl.pathname === '/terms' ||
        request.nextUrl.pathname === '/privacy'
    ) {
        return supabaseResponse
    }

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')
    const isPendingRoute   = request.nextUrl.pathname === '/pending'
    const isLoginRoute     = request.nextUrl.pathname === '/auth/login'
    const isForgotRoute    = request.nextUrl.pathname === '/auth/forgot-password'
    const isAdminRoute     = request.nextUrl.pathname.startsWith('/admin')

    // ── Auth pages (login, forgot-password) ─────────────────────────
    // Allow unauthenticated. If already logged-in, redirect away.
    if (isLoginRoute || isForgotRoute) {
        if (!user) return supabaseResponse
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_activated')
            .eq('id', user.id)
            .single()
        const isActivated = profile?.is_activated || false
        const url = request.nextUrl.clone()
        url.pathname = isActivated ? '/dashboard' : '/pending'
        return NextResponse.redirect(url)
    }

    // ── Non-authenticated access to protected routes ─────────────────
    if ((isDashboardRoute || isPendingRoute || isAdminRoute) && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
    }

    // ── Authenticated route checks ───────────────────────────────────
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_activated, is_admin')
            .eq('id', user.id)
            .single()

        const isActivated = profile?.is_activated || false
        const isAdmin     = profile?.is_admin     || false

        // /admin — requires is_admin flag
        if (isAdminRoute && !isAdmin) {
            const url = request.nextUrl.clone()
            url.pathname = isActivated ? '/dashboard' : '/pending'
            return NextResponse.redirect(url)
        }

        // /dashboard — requires activation
        if (isDashboardRoute && !isActivated) {
            const url = request.nextUrl.clone()
            url.pathname = '/pending'
            return NextResponse.redirect(url)
        }

        // /pending — if already activated, send to dashboard
        if (isPendingRoute && isActivated) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
