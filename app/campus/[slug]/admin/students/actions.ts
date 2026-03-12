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

// =====================================================
// NUMBER GENERATION
// =====================================================

/**
 * Generate the next admission number.
 * Format: {SLUG_UPPER}{DEPT_CODE}{YEAR_2DIGIT}{PADDED_SEQ}
 * Example: SIASBCA26023
 */
async function generateAdmissionNumber(
    institutionId: string,
    slug: string,
    deptCode: string,
    batchYear: string
): Promise<string> {
    const sc = getServiceClient();
    const yearShort = batchYear.slice(-2); // "2026" → "26"
    const scopeKey = `${deptCode}_${yearShort}`;

    // Upsert and increment the sequence atomically
    const { data: existing } = await sc
        .from("number_sequences")
        .select("id, current_value, padding")
        .eq("institution_id", institutionId)
        .eq("sequence_type", "admission")
        .eq("scope_key", scopeKey)
        .maybeSingle();

    let nextValue: number;
    let padding = 3;

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
            sequence_type: "admission",
            scope_key: scopeKey,
            current_value: 1,
            padding: 3,
        });
    }

    const paddedSeq = String(nextValue).padStart(padding, "0");
    return `${slug.toUpperCase()}${deptCode.toUpperCase()}${yearShort}${paddedSeq}`;
}

/**
 * Generate the next register number.
 * Format: Pure sequential number across the institution.
 * Example: 627041
 */
async function generateRegisterNumber(institutionId: string): Promise<string> {
    const sc = getServiceClient();

    const { data: existing } = await sc
        .from("number_sequences")
        .select("id, current_value, padding")
        .eq("institution_id", institutionId)
        .eq("sequence_type", "register")
        .eq("scope_key", "")
        .maybeSingle();

    let nextValue: number;

    if (existing) {
        nextValue = existing.current_value + 1;
        await sc
            .from("number_sequences")
            .update({ current_value: nextValue })
            .eq("id", existing.id);
    } else {
        nextValue = 1;
        await sc.from("number_sequences").insert({
            institution_id: institutionId,
            sequence_type: "register",
            scope_key: "",
            current_value: 1,
            padding: 6,
        });
    }

    return String(nextValue);
}

/**
 * Generate the next employee ID.
 * Format: EMP-{PADDED_SEQ}
 * Example: EMP-0001
 */
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

// =====================================================
// PREVIEW NEXT NUMBERS (for UI display before creation)
// =====================================================

export async function previewNextAdmissionNumber(
    slug: string,
    deptCode: string,
    batchYear: string
) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };

    const sc = getServiceClient();
    const yearShort = batchYear.slice(-2);
    const scopeKey = `${deptCode}_${yearShort}`;

    const { data: existing } = await sc
        .from("number_sequences")
        .select("current_value, padding")
        .eq("institution_id", auth.institutionId!)
        .eq("sequence_type", "admission")
        .eq("scope_key", scopeKey)
        .maybeSingle();

    const nextValue = (existing?.current_value || 0) + 1;
    const padding = existing?.padding || 3;
    const paddedSeq = String(nextValue).padStart(padding, "0");

    return {
        number: `${slug.toUpperCase()}${deptCode.toUpperCase()}${yearShort}${paddedSeq}`,
    };
}

export async function previewNextRegisterNumber(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };

    const sc = getServiceClient();

    const { data: existing } = await sc
        .from("number_sequences")
        .select("current_value")
        .eq("institution_id", auth.institutionId!)
        .eq("sequence_type", "register")
        .eq("scope_key", "")
        .maybeSingle();

    const nextValue = (existing?.current_value || 0) + 1;
    return { number: String(nextValue) };
}

// =====================================================
// STUDENT CRUD
// =====================================================

export async function getStudents(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);

    const sc = getServiceClient();

    // Get all student enrollments
    const { data: students, error } = await sc
        .from("enrollments")
        .select(
            "id, full_name, email, phone, register_number, admission_number, department, role, is_approved, created_at"
        )
        .eq("institution_id", auth.institutionId!)
        .eq("role", "student")
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    // Get class assignments for these students
    const studentIds = (students || []).map((s) => s.id);
    let classAssignments: any[] = [];
    if (studentIds.length > 0) {
        const { data } = await sc
            .from("student_classes")
            .select(
                "id, enrollment_id, roll_number, class:classes(id, name, department:departments(id, name, code))"
            )
            .in("enrollment_id", studentIds);
        classAssignments = data || [];
    }

    return (students || []).map((s) => ({
        ...s,
        class_assignment: classAssignments.find(
            (ca) => ca.enrollment_id === s.id
        ) || null,
    }));
}

export async function getPendingStudents(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);

    const sc = getServiceClient();

    const { data, error } = await sc
        .from("enrollments")
        .select(
            "id, full_name, email, phone, register_number, admission_number, department, created_at"
        )
        .eq("institution_id", auth.institutionId!)
        .eq("role", "student")
        .eq("is_approved", false)
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
}

export async function createStudent(
    slug: string,
    formData: {
        full_name: string;
        email: string;
        phone?: string;
        department?: string;
        dept_code?: string;
        batch_year?: string;
        admission_number?: string; // manual override
        register_number?: string; // manual override
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

    // Generate or use provided numbers
    let admissionNumber = formData.admission_number?.trim() || null;
    let registerNumber = formData.register_number?.trim() || null;

    if (!admissionNumber && formData.dept_code && formData.batch_year) {
        admissionNumber = await generateAdmissionNumber(
            auth.institutionId!,
            slug,
            formData.dept_code,
            formData.batch_year
        );
    }

    if (!registerNumber) {
        registerNumber = await generateRegisterNumber(auth.institutionId!);
    }

    // Check for duplicates
    if (admissionNumber) {
        const { data: dup } = await sc
            .from("enrollments")
            .select("id")
            .eq("institution_id", auth.institutionId!)
            .eq("admission_number", admissionNumber)
            .maybeSingle();
        if (dup)
            return {
                error: `Admission number "${admissionNumber}" already exists.`,
            };
    }

    if (registerNumber) {
        const { data: dup } = await sc
            .from("enrollments")
            .select("id")
            .eq("institution_id", auth.institutionId!)
            .eq("register_number", registerNumber)
            .maybeSingle();
        if (dup)
            return {
                error: `Register number "${registerNumber}" already exists.`,
            };
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
        register_number: registerNumber,
        admission_number: admissionNumber,
        username: formData.email.trim(),
        password_hash: passwordHash,
        role: "student",
        is_claimed: false,
        is_approved: true, // Admin-created students are auto-approved
    });

    if (error) {
        if (error.message?.includes("duplicate")) {
            return { error: "A student with these credentials already exists." };
        }
        return { error: error.message };
    }

    revalidatePath(`/campus/${slug}/admin/students`);
    return {
        success: true,
        admissionNumber,
        registerNumber,
    };
}

export async function updateStudent(
    slug: string,
    enrollmentId: string,
    formData: {
        full_name?: string;
        email?: string;
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
    if (formData.full_name !== undefined)
        updateData.full_name = formData.full_name.trim();
    if (formData.email !== undefined)
        updateData.email = formData.email.trim() || null;
    if (formData.phone !== undefined)
        updateData.phone = formData.phone.trim() || null;
    if (formData.department !== undefined)
        updateData.department = formData.department.trim() || null;
    if (formData.admission_number !== undefined)
        updateData.admission_number =
            formData.admission_number.trim() || null;
    if (formData.register_number !== undefined)
        updateData.register_number =
            formData.register_number.trim() || null;

    const { error } = await sc
        .from("enrollments")
        .update(updateData)
        .eq("id", enrollmentId)
        .eq("institution_id", auth.institutionId!);

    if (error) {
        if (error.message?.includes("duplicate")) {
            return {
                error: "A record with this admission or register number already exists.",
            };
        }
        return { error: error.message };
    }

    revalidatePath(`/campus/${slug}/admin/students`);
    return { success: true };
}

export async function deleteStudent(slug: string, enrollmentId: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };

    const sc = getServiceClient();

    // Delete student_classes first (cascade should handle this but let's be explicit)
    await sc
        .from("student_classes")
        .delete()
        .eq("enrollment_id", enrollmentId);

    // Delete attendance records
    await sc
        .from("attendance")
        .delete()
        .eq("student_enrollment_id", enrollmentId);

    // Delete exam marks
    await sc
        .from("exam_marks")
        .delete()
        .eq("student_enrollment_id", enrollmentId);

    // Delete enrollment
    const { error } = await sc
        .from("enrollments")
        .delete()
        .eq("id", enrollmentId)
        .eq("institution_id", auth.institutionId!);

    if (error) return { error: error.message };

    revalidatePath(`/campus/${slug}/admin/students`);
    return { success: true };
}

export async function approveStudentEnrollment(
    enrollmentId: string,
    slug: string
) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };

    const sc = getServiceClient();
    const { error } = await sc
        .from("enrollments")
        .update({ is_approved: true })
        .eq("id", enrollmentId)
        .eq("institution_id", auth.institutionId!);

    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin/students`);
    return { success: true };
}

export async function rejectStudentEnrollment(
    enrollmentId: string,
    slug: string
) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };

    const sc = getServiceClient();
    const { error } = await sc
        .from("enrollments")
        .delete()
        .eq("id", enrollmentId)
        .eq("institution_id", auth.institutionId!);

    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin/students`);
    return { success: true };
}
