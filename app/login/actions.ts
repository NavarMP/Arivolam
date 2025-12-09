'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'


export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { data: { user }, error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        redirect('/error')
    }

    const role = user?.user_metadata?.role

    revalidatePath('/', 'layout')

    if (role === 'admin') {
        redirect('/admin')
    } else if (role === 'teacher') {
        redirect('/teacher')
    } else if (role === 'parent') {
        redirect('/parent')
    } else {
        redirect('/student') // Default to student
    }
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    // Assuming we might pass role in formData, or default to student
    // In a real app, you might validate this or not allow public signup of admins
    const role = 'student' // Default for public signup, can be changed if we add role selector to signup form

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        options: {
            data: {
                role: role,
            },
        },
    }

    const { error } = await supabase.auth.signUp(data)

    if (error) {
        redirect('/error')
    }

    revalidatePath('/', 'layout')
    redirect('/student')
}
