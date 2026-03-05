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

// ─── Get All Faculty Members ───
export async function getFaculties(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);

    const sc = getServiceClient();

    // Get approved faculty enrollments 
    const { data: faculties, error } = await sc
        .from("enrollments")
        .select("id, full_name, email, register_number, admission_number, role, department, phone, created_at, is_approved")
        .eq("institution_id", auth.institutionId!)
        .eq("role", "faculty")
        .order("full_name");

    if (error) throw new Error(error.message);

    // Get faculty subject assignments
    const facultyIds = (faculties || []).map(f => f.id);
    let assignments: any[] = [];
    if (facultyIds.length > 0) {
        const { data } = await sc
            .from("faculty_subjects")
            .select("id, enrollment_id, subject:subjects(id, name, code), class:classes(id, name)")
            .in("enrollment_id", facultyIds);
        assignments = data || [];
    }

    return (faculties || []).map(f => ({
        ...f,
        assignments: assignments.filter(a => a.enrollment_id === f.id),
    }));
}

// ─── Get Pending Faculty Enrollment Requests ───
export async function getPendingFacultyRequests(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);

    const sc = getServiceClient();

    const { data, error } = await sc
        .from("enrollments")
        .select("id, full_name, email, register_number, admission_number, department, phone, created_at")
        .eq("institution_id", auth.institutionId!)
        .eq("role", "faculty")
        .eq("is_approved", false)
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
}

// ─── Approve Faculty Enrollment ───
export async function approveFacultyEnrollment(enrollmentId: string, slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };

    const sc = getServiceClient();
    const { error } = await sc
        .from("enrollments")
        .update({ is_approved: true })
        .eq("id", enrollmentId)
        .eq("institution_id", auth.institutionId!);

    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin/faculties`);
    return { success: true };
}

// ─── Reject Faculty Enrollment ───
export async function rejectFacultyEnrollment(enrollmentId: string, slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };

    const sc = getServiceClient();
    const { error } = await sc
        .from("enrollments")
        .delete()
        .eq("id", enrollmentId)
        .eq("institution_id", auth.institutionId!);

    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin/faculties`);
    return { success: true };
}

// ─── Remove Faculty ───
export async function removeFaculty(enrollmentId: string, slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };

    const sc = getServiceClient();

    // Delete faculty subject assignments first
    await sc.from("faculty_subjects").delete().eq("enrollment_id", enrollmentId);

    // Delete enrollment
    const { error } = await sc
        .from("enrollments")
        .delete()
        .eq("id", enrollmentId)
        .eq("institution_id", auth.institutionId!);

    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin/faculties`);
    return { success: true };
}
