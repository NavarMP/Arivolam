"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Institution CRUD ───

export async function createInstitution(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: profile } = await supabase
        .from("arivolam_profiles")
        .select("is_dev_admin")
        .eq("id", user.id)
        .single();
    if (!profile?.is_dev_admin) return { error: "Not authorized" };

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const short_name = (formData.get("short_name") as string) || null;
    const description = (formData.get("description") as string) || null;
    const city = (formData.get("city") as string) || null;
    const state = (formData.get("state") as string) || null;
    const country = (formData.get("country") as string) || "India";

    const { data: institution, error: instError } = await supabase.from("institutions").insert({
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ""),
        short_name,
        description,
        city,
        state,
        country,
        is_active: true, // Auto-approve from dev-admin
        is_verified: true,
    }).select("id").single();

    if (instError || !institution) return { error: instError?.message || "Failed to create institution" };

    const adminEmail = formData.get("adminEmail") as string;
    const adminPassword = formData.get("adminPassword") as string;
    // const adminName = formData.get("adminName") as string;

    if (adminEmail && adminPassword) {
        const bcrypt = await import("bcryptjs");
        const passwordHash = await bcrypt.hash(adminPassword, 10);

        await supabase.from("enrollments").insert({
            institution_id: institution.id,
            email: adminEmail,
            register_number: "ADMIN-001",
            admission_number: "ADMIN-001",
            username: adminEmail,
            password_hash: passwordHash,
            role: "admin",
            is_claimed: false,
            is_approved: true,
        });
    }

    revalidatePath("/dev-admin/institutions");
    return { success: true };
}

export async function updateInstitution(id: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: profile } = await supabase
        .from("arivolam_profiles")
        .select("is_dev_admin")
        .eq("id", user.id)
        .single();
    if (!profile?.is_dev_admin) return { error: "Not authorized" };

    const name = formData.get("name") as string;
    const short_name = (formData.get("short_name") as string) || null;
    const description = (formData.get("description") as string) || null;
    const city = (formData.get("city") as string) || null;
    const state = (formData.get("state") as string) || null;
    const country = (formData.get("country") as string) || "India";

    const { error } = await supabase
        .from("institutions")
        .update({ name, short_name, description, city, state, country })
        .eq("id", id);

    if (error) return { error: error.message };
    revalidatePath("/dev-admin/institutions");
    return { success: true };
}

export async function toggleInstitution(id: string, isActive: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: profile } = await supabase
        .from("arivolam_profiles")
        .select("is_dev_admin")
        .eq("id", user.id)
        .single();
    if (!profile?.is_dev_admin) return { error: "Not authorized" };

    const { error } = await supabase
        .from("institutions")
        .update({ is_active: isActive })
        .eq("id", id);

    if (error) return { error: error.message };
    revalidatePath("/dev-admin/institutions");
    return { success: true };
}

export async function deleteInstitution(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: profile } = await supabase
        .from("arivolam_profiles")
        .select("is_dev_admin")
        .eq("id", user.id)
        .single();
    if (!profile?.is_dev_admin) return { error: "Not authorized" };

    const { error } = await supabase.from("institutions").delete().eq("id", id);

    if (error) return { error: error.message };
    revalidatePath("/dev-admin/institutions");
    return { success: true };
}

// ─── User Management ───

export async function toggleDevAdmin(userId: string, isDevAdmin: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: profile } = await supabase
        .from("arivolam_profiles")
        .select("is_dev_admin")
        .eq("id", user.id)
        .single();
    if (!profile?.is_dev_admin) return { error: "Not authorized" };

    const { error } = await supabase
        .from("arivolam_profiles")
        .update({ is_dev_admin: isDevAdmin })
        .eq("id", userId);

    if (error) return { error: error.message };
    revalidatePath("/dev-admin/users");
    return { success: true };
}

export async function updateUserRole(userId: string, institutionId: string, newRole: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: profile } = await supabase
        .from("arivolam_profiles")
        .select("is_dev_admin")
        .eq("id", user.id)
        .single();
    if (!profile?.is_dev_admin) return { error: "Not authorized" };

    const { error } = await supabase
        .from("institution_members")
        .update({ role: newRole })
        .eq("user_id", userId)
        .eq("institution_id", institutionId);

    if (error) return { error: error.message };
    revalidatePath("/dev-admin/users");
    return { success: true };
}

export async function removeUserFromInstitution(userId: string, institutionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: profile } = await supabase
        .from("arivolam_profiles")
        .select("is_dev_admin")
        .eq("id", user.id)
        .single();
    if (!profile?.is_dev_admin) return { error: "Not authorized" };

    const { error } = await supabase
        .from("institution_members")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("institution_id", institutionId);

    if (error) return { error: error.message };
    revalidatePath("/dev-admin/users");
    return { success: true };
}
