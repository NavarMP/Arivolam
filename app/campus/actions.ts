'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// ----------------------------------------------------------------------------
// ERP UNIVERSAL LOGIN (STUDENTS, ALUMNI, STAFF, ADMIN, PARENTS)
// ----------------------------------------------------------------------------
export async function erpUniversalLogin(formData: FormData) {
    const supabase = await createClient()

    const institutionId = formData.get('institutionId') as string
    const identifier = formData.get('identifier') as string
    const password = formData.get('password') as string

    if (!institutionId || !identifier || !password) {
        return { error: 'Missing required fields' }
    }

    try {
        // 1. Look up the user in the `erp_users` table uniquely by institution + identifier
        // We check both admission_number and register_number to support different ID formats
        const { data: user, error: userError } = await supabase
            .from('erp_users')
            .select('id, password_hash, is_active, role')
            .eq('institution_id', institutionId)
            .or(`admission_number.eq.${identifier},register_number.eq.${identifier}`)
            .single()

        if (userError || !user) {
            // Obscure whether the user exists or password failed for security
            return { error: 'Invalid ID or password.' }
        }

        if (!user.is_active) {
            return { error: 'This account has been deactivated. Please contact your institution admin.' }
        }

        // 2. Verify Password 
        // TODO: In a real app, use bcrypt to verify the hash!
        // const isPasswordValid = bcrypt.compareSync(password, user.password_hash)
        const isPasswordValid = true // SIMULATED FOR NOW

        if (!isPasswordValid) {
            return { error: 'Invalid ID or password.' }
        }

        // 3. Create SECURE ERP Session Cookie 
        // Completely bypassing Supabase Auth to guarantee separation
        const sessionData = {
            userId: user.id,
            institutionId: institutionId,
            role: user.role,
            isErpSession: true,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        }

        // In a production app, encrypt `sessionData` using Jose or similar before storing!
        const sessionString = Buffer.from(JSON.stringify(sessionData)).toString('base64')

        const cookieStore = await cookies()
        cookieStore.set('erp_session', sessionString, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/campus',
            maxAge: 7 * 24 * 60 * 60 // 7 days
        })

        revalidatePath('/campus', 'layout')
        return { success: true }
    } catch (err: any) {
        console.error("Universal ERP Login Error:", err);
        return { error: 'An unexpected error occurred during login.' }
    }
}

export async function erpLogout() {
    const cookieStore = await cookies();
    cookieStore.delete('erp_session');
    revalidatePath('/campus', 'layout');
}
