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

    // Do not run middleware on auth callback or public assets
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
    const isPendingRoute = request.nextUrl.pathname === '/pending'
    const isLoginRoute = request.nextUrl.pathname === '/auth/login'

    // If trying to access dashboard but not logged in -> Redirect to login
    if (isDashboardRoute && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
    }

    // If trying to access pending but not logged in -> Redirect to login
    if (isPendingRoute && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
    }

    // If logged in, check profile activation status
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_activated')
            .eq('id', user.id)
            .single()

        const isActivated = profile?.is_activated || false

        // If logged in but NOT activated, and trying to access dashboard -> Redirect to pending
        if (isDashboardRoute && !isActivated) {
            const url = request.nextUrl.clone()
            url.pathname = '/pending'
            return NextResponse.redirect(url)
        }

        // If logged in AND activated, and trying to access pending -> Redirect to dashboard
        if (isPendingRoute && isActivated) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }

        // If logged in and trying to access login page -> Redirect to dashboard (or pending)
        if (isLoginRoute) {
            const url = request.nextUrl.clone()
            url.pathname = isActivated ? '/dashboard' : '/pending'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
