"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { verifyInstitutionAdmin } from "../users/actions";

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );
}

// ─── Get All Admins for an Institution ───
export async function getAdministrators(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);

    const serviceClient = getServiceClient();

    // Get admin members
    const { data: admins, error } = await serviceClient
        .from("institution_members")
        .select("user_id, role, is_active")
        .eq("institution_id", auth.institutionId!)
        .eq("role", "admin");

    if (error) throw new Error(error.message);

    // Get ERP user details for these admins
    const { data: erpUsers } = await serviceClient
        .from("erp_users")
        .select("id, full_name, email, employee_id, institution_id")
        .eq("institution_id", auth.institutionId!)
        .eq("role", "admin");

    // Get Supabase profiles for linked admins
    const userIds = (admins || []).map(a => a.user_id).filter(Boolean);
    let profiles: any[] = [];
    if (userIds.length > 0) {
        const { data } = await serviceClient
            .from("arivolam_profiles")
            .select("id, full_name, avatar_url, email")
            .in("id", userIds);
        profiles = data || [];
    }

    // Merge data
    return (admins || []).map(admin => {
        const profile = profiles.find(p => p.id === admin.user_id);
        const erpUser = (erpUsers || []).find(e => e.id === admin.user_id);
        return {
            user_id: admin.user_id,
            is_active: admin.is_active,
            full_name: profile?.full_name || erpUser?.full_name || "Unknown",
            email: profile?.email || erpUser?.email || "",
            avatar_url: profile?.avatar_url || null,
            employee_id: erpUser?.employee_id || null,
        };
    });
}

// ─── Promote a Member to Admin ───
export async function promoteToAdmin(userId: string, slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };

    const serviceClient = getServiceClient();

    const { error } = await serviceClient
        .from("institution_members")
        .update({ role: "admin" })
        .eq("user_id", userId)
        .eq("institution_id", auth.institutionId!);

    if (error) return { error: error.message };

    revalidatePath(`/campus/${slug}/admin/administrators`);
    return { success: true };
}

// ─── Demote Admin to Faculty ───
export async function demoteAdmin(userId: string, slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };

    const serviceClient = getServiceClient();

    // Don't allow demoting the last admin
    const { count } = await serviceClient
        .from("institution_members")
        .select("*", { count: "exact", head: true })
        .eq("institution_id", auth.institutionId!)
        .eq("role", "admin");

    if ((count || 0) <= 1) {
        return { error: "Cannot demote the last admin. There must be at least one admin." };
    }

    const { error } = await serviceClient
        .from("institution_members")
        .update({ role: "faculty" })
        .eq("user_id", userId)
        .eq("institution_id", auth.institutionId!);

    if (error) return { error: error.message };

    revalidatePath(`/campus/${slug}/admin/administrators`);
    return { success: true };
}

// ─── Get Non-Admin Members (for promoting) ───
export async function getNonAdminMembers(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);

    const serviceClient = getServiceClient();

    const { data: members, error } = await serviceClient
        .from("institution_members")
        .select("user_id, role")
        .eq("institution_id", auth.institutionId!)
        .neq("role", "admin")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const userIds = (members || []).map(m => m.user_id).filter(Boolean);
    let profiles: any[] = [];
    if (userIds.length > 0) {
        const { data } = await serviceClient
            .from("arivolam_profiles")
            .select("id, full_name, email")
            .in("id", userIds);
        profiles = data || [];
    }

    const { data: erpUsers } = await serviceClient
        .from("erp_users")
        .select("id, full_name, email, employee_id")
        .eq("institution_id", auth.institutionId!)
        .neq("role", "admin");

    return (members || []).map(m => {
        const profile = profiles.find(p => p.id === m.user_id);
        const erpUser = (erpUsers || []).find(e => e.id === m.user_id);
        return {
            user_id: m.user_id,
            role: m.role,
            full_name: profile?.full_name || erpUser?.full_name || "Unknown",
            email: profile?.email || erpUser?.email || "",
        };
    });
}
