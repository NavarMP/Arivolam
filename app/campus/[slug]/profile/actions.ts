"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/lib/auth";

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );
}

// ─── Update Own Profile (ERP enrollment) ───
export async function updateOwnProfile(
    slug: string,
    formData: {
        full_name?: string;
        phone?: string;
        department?: string;
    }
) {
    const supabase = await createClient();

    // Get institution
    const { data: institution } = await supabase
        .from("institutions")
        .select("id")
        .eq("slug", slug)
        .single();

    if (!institution) return { error: "Institution not found" };

    // Check ERP session
    const erpSession = await getSession();
    if (erpSession && erpSession.institution_id === institution.id) {
        const sc = getServiceClient();

        const updateData: Record<string, any> = {};
        if (formData.full_name !== undefined) updateData.full_name = formData.full_name;
        if (formData.phone !== undefined) updateData.phone = formData.phone || null;
        if (formData.department !== undefined) updateData.department = formData.department || null;

        const { error } = await sc
            .from("enrollments")
            .update(updateData)
            .eq("id", erpSession.enrollment_id)
            .eq("institution_id", institution.id);

        if (error) return { error: error.message };

        revalidatePath(`/campus/${slug}/profile`);
        return { success: true };
    }

    // Check Supabase auth user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        // Update Supabase user metadata
        if (formData.full_name) {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: formData.full_name }
            });
            if (error) return { error: error.message };
        }

        revalidatePath(`/campus/${slug}/profile`);
        return { success: true };
    }

    return { error: "Not authenticated" };
}
