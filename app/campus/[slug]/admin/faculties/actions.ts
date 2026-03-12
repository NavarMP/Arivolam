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

// ─── Generate Employee ID ───
async function generateEmployeeId(institutionId: string): Promise<string> {
    const sc = getServiceClient();

    const { data: existing } = await sc
        .from("number_sequences")
        .select("id, current_value, padding")
        .eq("institution_id", institutionId)
        .eq("sequence_type", "employee")
        .eq("scope_key", "")
        .maybeSingle();

    let nextValue: number;
    let padding = 4;

    if (existing) {
        nextValue = existing.current_value + 1;
        padding = existing.padding;
        await sc
            .from("number_sequences")
            .update({ current_value: nextValue })
            .eq("id", existing.id);
    } else {
        nextValue = 1;
        await sc.from("number_sequences").insert({
            institution_id: institutionId,
            sequence_type: "employee",
            scope_key: "",
            current_value: 1,
            padding: 4,
        });
    }

    const paddedSeq = String(nextValue).padStart(padding, "0");
    return `EMP-${paddedSeq}`;
}

// ─── Preview Next Employee ID ───
export async function previewNextEmployeeId(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };

    const sc = getServiceClient();

    const { data: existing } = await sc
        .from("number_sequences")
        .select("current_value, padding")
        .eq("institution_id", auth.institutionId!)
        .eq("sequence_type", "employee")
        .eq("scope_key", "")
        .maybeSingle();

    const nextValue = (existing?.current_value || 0) + 1;
    const padding = existing?.padding || 4;
    const paddedSeq = String(nextValue).padStart(padding, "0");
    return { number: `EMP-${paddedSeq}` };
}

// ─── Create Faculty ───
export async function createFaculty(
    slug: string,
    formData: {
        full_name: string;
        email: string;
        phone?: string;
        department?: string;
        employee_id?: string; // manual override
        designation?: string;
        password: string;
    }
) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };

    if (!formData.full_name || !formData.email || !formData.password) {
        return { error: "Full name, email, and password are required." };
    }
    if (formData.password.length < 6) {
        return { error: "Password must be at least 6 characters." };
    }

    const sc = getServiceClient();

    // Generate or use provided employee ID
    let employeeId = formData.employee_id?.trim() || null;
    if (!employeeId) {
        employeeId = await generateEmployeeId(auth.institutionId!);
    }

    // Hash password
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(formData.password, 10);

    // Create enrollment
    const { error } = await sc.from("enrollments").insert({
        institution_id: auth.institutionId!,
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        department: formData.department?.trim() || null,
        employee_id: employeeId,
        register_number: employeeId, // Use employee_id as register_number for login
        username: formData.email.trim(),
        password_hash: passwordHash,
        role: "faculty",
        is_claimed: false,
        is_approved: true, // Admin-created faculty are auto-approved
    });

    if (error) {
        if (error.message?.includes("duplicate")) {
            return { error: "A faculty member with these credentials already exists." };
        }
        return { error: error.message };
    }

    revalidatePath(`/campus/${slug}/admin/faculties`);
    return { success: true, employeeId };
}

// ─── Update Faculty ───
export async function updateFaculty(
    slug: string,
    enrollmentId: string,
    formData: {
        full_name?: string;
        email?: string;
        phone?: string;
        department?: string;
        employee_id?: string;
    }
) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };

    const sc = getServiceClient();

    const updateData: Record<string, any> = {};
    if (formData.full_name !== undefined) updateData.full_name = formData.full_name.trim();
    if (formData.email !== undefined) updateData.email = formData.email.trim() || null;
    if (formData.phone !== undefined) updateData.phone = formData.phone.trim() || null;
    if (formData.department !== undefined) updateData.department = formData.department.trim() || null;
    if (formData.employee_id !== undefined) {
        updateData.employee_id = formData.employee_id.trim() || null;
        updateData.register_number = formData.employee_id.trim() || null;
    }

    const { error } = await sc
        .from("enrollments")
        .update(updateData)
        .eq("id", enrollmentId)
        .eq("institution_id", auth.institutionId!);

    if (error) {
        if (error.message?.includes("duplicate")) {
            return { error: "A record with this employee ID already exists." };
        }
        return { error: error.message };
    }

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
