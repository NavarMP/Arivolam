'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updatePersonalProfile(data: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await supabase
        .from('arivolam_profiles')
        .update({
            display_name: data.display_name,
            username: data.username,
            headline: data.headline,
            bio: data.bio,
            location: data.location,
            website: data.website,
            avatar_url: data.avatar_url,
            cover_url: data.cover_url,
            skills: data.skills || [],
            social_links: data.social_links || {},
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/settings/profile')
    revalidatePath('/[username]', 'page')
    revalidatePath('/profile/[userId]', 'page')

    return { success: true }
}

export async function updateInstitutionProfile(data: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // 1. Update basic profile info
    const { error: profileError } = await supabase
        .from('arivolam_profiles')
        .update({
            display_name: data.display_name,
            username: data.username,
            headline: data.headline,
            bio: data.bio,
            location: data.location,
            website: data.website,
            avatar_url: data.avatar_url,
            cover_url: data.cover_url,
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

    if (profileError) {
        return { error: profileError.message }
    }

    // 2. Update institution specific details
    const institutionDetails = {
        id: user.id, // Primary key
        institution_type: data.institution_type,
        established_year: data.established_year ? parseInt(data.established_year) : null,
        affiliation: data.affiliation,
        accreditations: data.accreditations || [],
        rankings: data.rankings || [],
        admission_info: data.admission_info,
        admission_url: data.admission_url,
        admission_open: !!data.admission_open,
        minimum_qualification: data.minimum_qualification,
        entrance_exams: data.entrance_exams || [],
        courses_offered: data.courses_offered || [],
        departments: data.departments || [],
        achievements: data.achievements || [],
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        gallery_images: data.gallery_images || [],
        updated_at: new Date().toISOString()
    }

    const { error: detailsError } = await supabase
        .from('institution_profile_details')
        .upsert(institutionDetails)

    if (detailsError) {
        return { error: detailsError.message }
    }

    revalidatePath('/settings/profile')
    revalidatePath('/[username]', 'page')
    revalidatePath('/profile/[userId]', 'page')

    return { success: true }
}
