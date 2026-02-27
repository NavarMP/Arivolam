'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSession } from '@/lib/auth'

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )
}

// ─── Get Unified Auth Status (For Client Components) ───
import { getSession } from '@/lib/auth'

export async function getAuthStatus() {
    try {
        const erpSession = await getSession();
        return {
            isAuthenticated: !!erpSession,
            session: erpSession || null
        };
    } catch (error) {
        return { isAuthenticated: false, session: null };
    }
}

// ─── Register a New Institution ───
export async function registerInstitution(formData: FormData) {
    const supabase = getServiceClient()

    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const shortName = (formData.get('shortName') as string) || null
    const city = (formData.get('city') as string) || null
    const state = (formData.get('state') as string) || null
    const country = (formData.get('country') as string) || 'India'
    const description = (formData.get('description') as string) || null
    const adminEmail = formData.get('adminEmail') as string
    const adminName = formData.get('adminName') as string
    const adminPassword = formData.get('adminPassword') as string

    if (!name || !slug || !adminEmail || !adminName || !adminPassword) {
        return { error: 'All required fields must be filled.' }
    }

    if (adminPassword.length < 6) {
        return { error: 'Password must be at least 6 characters.' }
    }

    // Normalize slug
    const normalizedSlug = slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

    if (normalizedSlug.length < 3) {
        return { error: 'Slug must be at least 3 characters.' }
    }

    try {
        // Check slug availability
        const { data: existing } = await supabase
            .from('institutions')
            .select('id')
            .eq('slug', normalizedSlug)
            .maybeSingle()

        if (existing) {
            return { error: 'This slug is already taken. Please choose another.' }
        }

        // Create institution (is_active = false, needs dev-admin approval)
        const { data: institution, error: instError } = await supabase
            .from('institutions')
            .insert({
                name,
                slug: normalizedSlug,
                short_name: shortName,
                city,
                state,
                country,
                description,
                is_active: false,
                is_verified: false,
            })
            .select('id')
            .single()

        if (instError || !institution) {
            console.error('Institution creation error:', instError)
            return { error: 'Failed to create institution. Please try again.' }
        }

        // Hash the admin password
        const bcrypt = await import('bcryptjs')
        const passwordHash = await bcrypt.hash(adminPassword, 10)

        // Create the founding admin enrollment
        const { error: enrollError } = await supabase
            .from('enrollments')
            .insert({
                institution_id: institution.id,
                email: adminEmail,
                register_number: 'ADMIN-001',
                admission_number: 'ADMIN-001',
                username: adminEmail,
                password_hash: passwordHash,
                role: 'admin',
                is_claimed: false,
                is_approved: true, // Auto-approve the founding admin
            })

        if (enrollError) {
            console.error('Admin enrollment error:', enrollError)
            // Clean up institution if enrollment fails
            await supabase.from('institutions').delete().eq('id', institution.id)
            return { error: 'Failed to create admin account. Please try again.' }
        }

        revalidatePath('/campus')
        return { success: true, slug: normalizedSlug }
    } catch (err: unknown) {
        console.error('Register institution error:', err)
        return { error: 'An unexpected error occurred.' }
    }
}

// ─── Campus Login (Universal) ───
export async function campusLogin(formData: FormData) {
    const supabase = getServiceClient()

    const institutionId = formData.get('institutionId') as string
    const identifier = formData.get('identifier') as string
    const password = formData.get('password') as string

    if (!institutionId || !identifier || !password) {
        return { error: 'Missing required fields.' }
    }

    try {
        // 1. Check institution is active
        const { data: institution, error: instError } = await supabase
            .from('institutions')
            .select('id, slug, is_active, name')
            .eq('id', institutionId)
            .single()

        if (instError || !institution) {
            return { error: 'Institution not found.' }
        }

        if (!institution.is_active) {
            return { error: 'This institution is pending approval by the Arivolam team. Please check back later.' }
        }

        // 2. Find enrollment
        const { data: enrollment, error: enrollError } = await supabase
            .from('enrollments')
            .select('*')
            .eq('institution_id', institutionId)
            .or(`register_number.eq.${identifier},admission_number.eq.${identifier},username.eq.${identifier},email.eq.${identifier}`)
            .single()

        if (enrollError || !enrollment) {
            return { error: 'Invalid credentials. Please check your ID and password.' }
        }

        // 3. Check approval status
        if (enrollment.is_approved === false) {
            return { error: 'Your account is pending approval by the institution admin. Please check back later.' }
        }

        // 4. Verify password
        if (!enrollment.password_hash) {
            return { error: 'Your account requires a password reset. Please contact your institution admin.' }
        }

        const bcrypt = await import('bcryptjs')
        const isValid = await bcrypt.compare(password, enrollment.password_hash)

        if (!isValid) {
            return { error: 'Invalid credentials. Please check your ID and password.' }
        }

        // 5. Auto-link to Arivolam user if logged in
        const authClient = await createClient()
        const { data: { user } } = await authClient.auth.getUser()
        if (user && !enrollment.is_claimed) {
            await supabase
                .from('enrollments')
                .update({ linked_user_id: user.id, is_claimed: true })
                .eq('id', enrollment.id)

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

        // 6. Create JWT session
        await createSession({
            enrollment_id: enrollment.id,
            institution_id: institutionId,
            role: enrollment.role,
            identifier: identifier,
        })

        revalidatePath('/campus', 'layout')
        return { success: true, slug: institution.slug }
    } catch (err: unknown) {
        console.error('Campus login error:', err)
        return { error: 'An unexpected error occurred during login.' }
    }
}

// ─── Campus Signup ───
export async function campusSignup(formData: FormData) {
    const supabase = getServiceClient()

    const institutionId = formData.get('institutionId') as string
    const fullName = formData.get('fullName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const registerNumber = (formData.get('registerNumber') as string) || null
    const admissionNumber = (formData.get('admissionNumber') as string) || null
    const role = (formData.get('role') as string) || 'student'
    const department = (formData.get('department') as string) || null
    const password = formData.get('password') as string

    if (!institutionId || !fullName || !password || !email || !phone) {
        return { error: 'All required fields must be filled.' }
    }

    if (!email.includes('@')) {
        return { error: 'Please enter a valid email address.' }
    }

    if (role === 'student' && !registerNumber && !admissionNumber) {
        return { error: 'Students must provide at least one: Register Number or Admission Number.' }
    }

    if (password.length < 6) {
        return { error: 'Password must be at least 6 characters.' }
    }

    try {
        // Check institution exists and is active
        const { data: institution } = await supabase
            .from('institutions')
            .select('id, is_active')
            .eq('id', institutionId)
            .single()

        if (!institution) {
            return { error: 'Institution not found.' }
        }

        if (!institution.is_active) {
            return { error: 'This institution is not yet active.' }
        }

        // Check for duplicates within institution
        if (registerNumber) {
            const { data: dup } = await supabase
                .from('enrollments')
                .select('id')
                .eq('institution_id', institutionId)
                .eq('register_number', registerNumber)
                .maybeSingle()

            if (dup) {
                return { error: 'This register number is already registered in this institution.' }
            }
        }

        if (admissionNumber) {
            const { data: dup } = await supabase
                .from('enrollments')
                .select('id')
                .eq('institution_id', institutionId)
                .eq('admission_number', admissionNumber)
                .maybeSingle()

            if (dup) {
                return { error: 'This admission number is already registered in this institution.' }
            }
        }

        // Hash password
        const bcrypt = await import('bcryptjs')
        const passwordHash = await bcrypt.hash(password, 10)

        // Create enrollment with is_approved = false (needs admin approval)
        const { error: enrollError } = await supabase
            .from('enrollments')
            .insert({
                institution_id: institutionId,
                full_name: fullName,
                email,
                phone,
                register_number: registerNumber,
                admission_number: admissionNumber,
                username: email || registerNumber || admissionNumber,
                password_hash: passwordHash,
                role,
                department,
                is_claimed: false,
                is_approved: false,
            })

        if (enrollError) {
            console.error('Signup enrollment error:', enrollError)
            if (enrollError.message?.includes('duplicate')) {
                return { error: 'An account with these credentials already exists.' }
            }
            return { error: 'Failed to create account. Please try again.' }
        }

        return { success: true }
    } catch (err: unknown) {
        console.error('Campus signup error:', err)
        return { error: 'An unexpected error occurred.' }
    }
}

// ─── ERP Logout ───
export async function erpLogout() {
    const { deleteSession } = await import('@/lib/auth')
    await deleteSession()
    revalidatePath('/campus', 'layout')
    redirect('/campus')
}
