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
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
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

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // ─── Public routes (always accessible) ───
    const publicRoutes = ['/', '/auth', '/explore', '/debug-auth']
    const isPublicRoute = publicRoutes.some(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    )

    // ─── Dev admin route protection ───
    if (pathname.startsWith('/dev-admin')) {
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/auth/login'
            url.searchParams.set('next', pathname)
            return NextResponse.redirect(url)
        }

        // Check if user is dev admin
        const { data: profile } = await supabase
            .from('arivolam_profiles')
            .select('is_dev_admin')
            .eq('id', user.id)
            .single()

        if (!profile?.is_dev_admin) {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }
    }

    // ─── Campus route protection ───
    if (pathname.startsWith('/campus/')) {
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/auth/login'
            url.searchParams.set('next', pathname)
            return NextResponse.redirect(url)
        }

        // Extract institution slug from URL: /campus/[slug]/...
        const slugMatch = pathname.match(/^\/campus\/([^/]+)/)
        if (slugMatch) {
            const slug = slugMatch[1]

            // Check institution membership
            const { data: institution } = await supabase
                .from('institutions')
                .select('id')
                .eq('slug', slug)
                .single()

            if (institution) {
                const { data: membership } = await supabase
                    .from('institution_members')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('institution_id', institution.id)
                    .eq('is_active', true)
                    .single()

                if (!membership) {
                    // Not a member — redirect to institution login
                    const url = request.nextUrl.clone()
                    url.pathname = '/auth/institution-login'
                    return NextResponse.redirect(url)
                }
            }
        }
    }

    // ─── Redirect logged-in users away from auth pages ───
    if (user && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup'))) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    return supabaseResponse
}
