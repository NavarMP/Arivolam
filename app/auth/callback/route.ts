import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
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

            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${redirectTo}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${redirectTo}`)
            } else {
                return NextResponse.redirect(`${origin}${redirectTo}`)
            }
        }
    }

    // Return to login with error
    return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
}
