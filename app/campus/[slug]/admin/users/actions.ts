"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );
}

/**
 * Verify the current user is an admin for the given institution.
 * Supports both Supabase Auth and ERP JWT sessions.
 */
export async function verifyInstitutionAdmin(institutionSlug: string) {
    const supabase = await createClient();

    // Get institution
    const { data: institution } = await supabase
        .from("institutions")
        .select("id")
        .eq("slug", institutionSlug)
        .single();

    if (!institution) return { error: "Institution not found" };

    // Method 1: Check Supabase Auth user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: membership } = await supabase
            .from("institution_members")
            .select("role")
            .eq("user_id", user.id)
            .eq("institution_id", institution.id)
            .single();

        if (membership?.role === "admin") {
            return { institutionId: institution.id };
        }
    }

    // Method 2: Check ERP JWT session
    const erpSession = await getSession();
    if (erpSession && erpSession.institution_id === institution.id && erpSession.role === "admin") {
        return { institutionId: institution.id };
    }

    return { error: "Forbidden: Only admins can perform this action" };
}

// ─── Data Fetching for Admin Pages (Bypassing RLS securely) ───

export async function getAdminDashboardData(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);

    const serviceClient = getServiceClient();

    const [
        { count: studentCount },
        { count: facultyCount },
        { data: pendingEnrollments }
    ] = await Promise.all([
        serviceClient
            .from("institution_members")
            .select("*", { count: "exact", head: true })
            .eq("institution_id", auth.institutionId!)
            .eq("role", "student"),
        serviceClient
            .from("institution_members")
            .select("*", { count: "exact", head: true })
            .eq("institution_id", auth.institutionId!)
            .eq("role", "faculty"),
        serviceClient
            .from("enrollments")
            .select("id, full_name, email, register_number, admission_number, role, department, created_at")
            .eq("institution_id", auth.institutionId!)
            .eq("is_approved", false)
            .order("created_at", { ascending: false })
    ]);

    return {
        studentCount: studentCount || 0,
        facultyCount: facultyCount || 0,
        pendingEnrollments: pendingEnrollments || []
    };
}

export async function getCampusUsersData(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);

    const serviceClient = getServiceClient();

    const [
        { data: membersData },
        { data: pendingData }
    ] = await Promise.all([
        serviceClient
            .from("institution_members")
            .select("user_id, role, created_at")
            .eq("institution_id", auth.institutionId!)
            .order("created_at", { ascending: false }),
        serviceClient
            .from("enrollments")
            .select("id, full_name, email, register_number, admission_number, role, department, created_at")
            .eq("institution_id", auth.institutionId!)
            .eq("is_approved", false)
            .order("created_at", { ascending: false })
    ]);

    return {
        members: membersData || [],
        pending: pendingData || []
    };
}

export async function updateUserRole(
    userId: string,
    newRole: "student" | "faculty" | "admin",
    institutionSlug: string
) {
    const auth = await verifyInstitutionAdmin(institutionSlug);
    if (auth.error) return { error: auth.error };

    const serviceClient = getServiceClient();

    const { error } = await serviceClient
        .from("institution_members")
        .update({ role: newRole })
        .eq("user_id", userId)
        .eq("institution_id", auth.institutionId!);

    if (error) return { error: error.message };

    revalidatePath(`/campus/${institutionSlug}/admin/users`);
    return { success: true };
}

// ─── Approve Enrollment ───
export async function approveEnrollment(enrollmentId: string, institutionSlug: string) {
    const auth = await verifyInstitutionAdmin(institutionSlug);
    if (auth.error) return { error: auth.error };

    // Use service client to bypass RLS since ERP-only admins don't have Supabase Auth
    const serviceClient = getServiceClient();

    const { error } = await serviceClient
        .from("enrollments")
        .update({ is_approved: true })
        .eq("id", enrollmentId)
        .eq("institution_id", auth.institutionId!);

    if (error) return { error: error.message };

    revalidatePath(`/campus/${institutionSlug}/admin`);
    revalidatePath(`/campus/${institutionSlug}/admin/users`);
    return { success: true };
}

// ─── Reject Enrollment ───
export async function rejectEnrollment(enrollmentId: string, institutionSlug: string) {
    const auth = await verifyInstitutionAdmin(institutionSlug);
    if (auth.error) return { error: auth.error };

    const serviceClient = getServiceClient();

    const { error } = await serviceClient
        .from("enrollments")
        .delete()
        .eq("id", enrollmentId)
        .eq("institution_id", auth.institutionId!);

    if (error) return { error: error.message };

    revalidatePath(`/campus/${institutionSlug}/admin`);
    revalidatePath(`/campus/${institutionSlug}/admin/users`);
    return { success: true };
}

// ─── Admin Edit Member Profile ───
export async function updateMemberProfile(
    enrollmentId: string,
    slug: string,
    formData: {
        full_name?: string;
        phone?: string;
        department?: string;
        admission_number?: string;
        register_number?: string;
    }
) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };

    const sc = getServiceClient();

    const updateData: Record<string, any> = {};
    if (formData.full_name !== undefined) updateData.full_name = formData.full_name;
    if (formData.phone !== undefined) updateData.phone = formData.phone || null;
    if (formData.department !== undefined) updateData.department = formData.department || null;
    if (formData.admission_number !== undefined) updateData.admission_number = formData.admission_number || null;
    if (formData.register_number !== undefined) updateData.register_number = formData.register_number || null;

    const { error } = await sc
        .from("enrollments")
        .update(updateData)
        .eq("id", enrollmentId)
        .eq("institution_id", auth.institutionId!);

    if (error) return { error: error.message };

    revalidatePath(`/campus/${slug}/admin`);
    return { success: true };
}
