"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUserRole(
    userId: string,
    newRole: "student" | "teacher" | "parent" | "admin",
    institutionSlug: string
) {
    const supabase = await createClient();

    // 1. Verify the current user is an admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // Get institution
    const { data: institution } = await supabase
        .from("institutions")
        .select("id")
        .eq("slug", institutionSlug)
        .single();

    if (!institution) return { error: "Institution not found" };

    // Check current user is admin in this institution
    const { data: membership } = await supabase
        .from("institution_members")
        .select("role")
        .eq("user_id", user.id)
        .eq("institution_id", institution.id)
        .single();

    if (membership?.role !== "admin") {
        return { error: "Forbidden: Only admins can change roles" };
    }

    // 2. Update the target user's role in this institution
    const { error } = await supabase
        .from("institution_members")
        .update({ role: newRole })
        .eq("user_id", userId)
        .eq("institution_id", institution.id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath(`/campus/${institutionSlug}/admin/users`);
    return { success: true };
}
