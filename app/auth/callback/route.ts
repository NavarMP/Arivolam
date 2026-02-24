import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    // if "next" is in param, use it as the redirect URL. Otherwise, default to home '/'
    const next = searchParams.get('next') ?? '/'

    // Use NEXT_PUBLIC_APP_URL from env if available and not local
    const isLocalEnv = process.env.NODE_ENV === 'development'
    const appUrl = (isLocalEnv ? origin : process.env.NEXT_PUBLIC_APP_URL) || origin

    if (code) {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.delete({ name, ...options })
                    },
                },
            }
        )

        // This is where the magic happens: exchanging the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Check if user has completed onboarding (has a username)
            const { data: { user } } = await supabase.auth.getUser()
            let redirectTo = next

            if (user) {
                const { data: profile } = await supabase
                    .from('arivolam_profiles')
                    .select('username')
                    .eq('id', user.id)
                    .single()

                // If no username, redirect to onboarding
                if (!profile?.username) {
                    redirectTo = '/auth/onboarding'
                }
            }

            // Successful login! Redirect to the target route
            return NextResponse.redirect(`${appUrl}${redirectTo === '/' ? '' : redirectTo}`)
        } else {
            console.error("Auth error:", error)
        }
    }

    // If there's an error or no code, redirect to login page with error
    return NextResponse.redirect(`${appUrl}/auth/login?error=Could not authenticate`)
}
