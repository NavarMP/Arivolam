'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

// ─── Email/Password Login ───
export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

// ─── Email/Password Signup ───
export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const phone = formData.get('phone') as string

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                phone: phone,
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

import { getURL } from '@/utils/get-url'

// ─── OAuth Login ───
export async function loginWithOAuth(provider: 'google' | 'github' | 'facebook' | 'apple', nextUrl: string = '/') {
    const supabase = await createClient()

    let callbackUrl = `${getURL()}auth/callback`
    if (nextUrl !== '/') {
        callbackUrl += `?next=${encodeURIComponent(nextUrl)}`
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: callbackUrl,
        },
    })

    if (error) {
        return { error: error.message }
    }

    if (data.url) {
        redirect(data.url)
    }
}

// ─── Sign Out ───
export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/')
}



// ─── Get User Institutions ───
export async function getUserInstitutions() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data } = await supabase
        .from('institution_members')
        .select(`
            *,
            institutions:institution_id (
                id, name, slug, short_name, logo_url, cover_url
            )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)

    return data || []
}
