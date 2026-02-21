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

// ─── OAuth Login ───
export async function loginWithOAuth(provider: 'google' | 'github' | 'facebook' | 'apple', nextUrl: string = '/') {
    const supabase = await createClient()

    let callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
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

// ─── Institution Login ───
export async function institutionLogin(formData: FormData) {
    const supabase = await createClient()

    const institutionId = formData.get('institutionId') as string
    const identifier = formData.get('identifier') as string // reg_no, admission_no, or username
    const password = formData.get('password') as string

    // Check enrollment record
    const { data: enrollment, error: enrollError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('institution_id', institutionId)
        .or(`register_number.eq.${identifier},admission_number.eq.${identifier},username.eq.${identifier}`)
        .single()

    if (enrollError || !enrollment) {
        return { error: 'Invalid credentials. Please check your institution, username, or password.' }
    }

    // Verify Password
    // If there is no password hash, the enrollment hasn't been set up with one yet.
    if (!enrollment.password_hash) {
        return { error: 'Your account requires a password reset. Please contact administration.' }
    }

    const bcrypt = await import('bcryptjs')
    const isValid = await bcrypt.compare(password, enrollment.password_hash)

    if (!isValid) {
        return { error: 'Invalid credentials. Please check your username and password.' }
    }

    // Check if user is also logged into Arivolam
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        // User is logged into Arivolam — link enrollment if not claimed
        if (!enrollment.is_claimed) {
            await supabase
                .from('enrollments')
                .update({ linked_user_id: user.id, is_claimed: true })
                .eq('id', enrollment.id)

            // Create institution membership
            await supabase
                .from('institution_members')
                .upsert({
                    user_id: user.id,
                    institution_id: institutionId,
                    role: enrollment.role,
                    register_number: enrollment.register_number,
                    admission_number: enrollment.admission_number,
                    department: enrollment.department,
                })
        }
    }

    // Create custom ERP Session
    const { createSession } = await import('@/lib/auth')
    await createSession({
        enrollment_id: enrollment.id,
        institution_id: institutionId,
        role: enrollment.role,
        identifier: identifier,
    })

    // Get institution slug for redirect
    const { data: institution } = await supabase
        .from('institutions')
        .select('slug')
        .eq('id', institutionId)
        .single()

    revalidatePath('/', 'layout')
    redirect(`/campus/${institution?.slug || 'sias'}`)
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
