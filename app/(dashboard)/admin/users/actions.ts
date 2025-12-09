"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUserRole(userId: string, newRole: "student" | "teacher" | "parent" | "admin") {
    const supabase = await createClient();

    // 1. Verify the current user is an admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // Check role in public.profiles (or metadata)
    const { data: currentUserProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (currentUserProfile?.role !== "admin") {
        return { error: "Forbidden: Only admins can change roles" };
    }

    // 2. Update the target user's profile
    const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/admin/users");
    return { success: true };
}
