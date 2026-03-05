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
// COURSES
// =====================================================

export async function getCourses(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();
    const { data, error } = await sc
        .from("courses")
        .select("*, department:departments(id, name, code)")
        .eq("department.institution_id", auth.institutionId!)
        .order("name");
    if (error) throw new Error(error.message);
    return (data || []).filter((c: any) => c.department !== null);
}

export async function createCourse(slug: string, formData: {
    department_id: string; name: string; code: string; short_name?: string;
    duration_years?: number; degree_type?: string; description?: string;
}) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("courses").insert({
        department_id: formData.department_id,
        name: formData.name,
        code: formData.code.toUpperCase(),
        short_name: formData.short_name || null,
        duration_years: formData.duration_years || 4,
        degree_type: formData.degree_type || "undergraduate",
        description: formData.description || null,
    });
    if (error) {
        if (error.message.includes("duplicate")) return { error: "A course with this code already exists in this department." };
        return { error: error.message };
    }
    revalidatePath(`/campus/${slug}/admin/courses`);
    return { success: true };
}

export async function updateCourse(slug: string, id: string, formData: {
    department_id: string; name: string; code: string; short_name?: string;
    duration_years?: number; degree_type?: string; description?: string; is_active?: boolean;
}) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("courses").update({
        department_id: formData.department_id,
        name: formData.name,
        code: formData.code.toUpperCase(),
        short_name: formData.short_name || null,
        duration_years: formData.duration_years || 4,
        degree_type: formData.degree_type || "undergraduate",
        description: formData.description || null,
        is_active: formData.is_active ?? true,
    }).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin/courses`);
    return { success: true };
}

export async function deleteCourse(slug: string, id: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("courses").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin/courses`);
    return { success: true };
}

// =====================================================
// COURSE YEARS
// =====================================================

export async function getCourseYears(slug: string, courseId: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();
    const { data, error } = await sc
        .from("course_years")
        .select("*")
        .eq("course_id", courseId)
        .order("year_number");
    if (error) throw new Error(error.message);
    return data || [];
}

export async function createCourseYear(slug: string, formData: { course_id: string; year_number: number; name: string }) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("course_years").insert({
        course_id: formData.course_id,
        year_number: formData.year_number,
        name: formData.name,
    });
    if (error) {
        if (error.message.includes("duplicate")) return { error: "This year already exists for this course." };
        return { error: error.message };
    }
    revalidatePath(`/campus/${slug}/admin/courses`);
    return { success: true };
}

export async function deleteCourseYear(slug: string, id: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("course_years").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin/courses`);
    return { success: true };
}

// =====================================================
// SYLLABUS ENTRIES
// =====================================================

export async function getSyllabusEntries(slug: string, courseYearId: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();
    const { data, error } = await sc
        .from("syllabus_entries")
        .select("*, subject:subjects(id, name, code, credits, subject_type), semester:semesters(id, name)")
        .eq("course_year_id", courseYearId)
        .order("sort_order");
    if (error) throw new Error(error.message);
    return data || [];
}

export async function addSyllabusEntry(slug: string, formData: {
    course_year_id: string; subject_id: string; semester_id?: string;
    is_elective?: boolean; is_mandatory?: boolean; sort_order?: number; notes?: string;
}) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("syllabus_entries").insert({
        course_year_id: formData.course_year_id,
        subject_id: formData.subject_id,
        semester_id: formData.semester_id || null,
        is_elective: formData.is_elective || false,
        is_mandatory: formData.is_mandatory ?? true,
        sort_order: formData.sort_order || 0,
        notes: formData.notes || null,
    });
    if (error) {
        if (error.message.includes("duplicate")) return { error: "This subject is already in this course year." };
        return { error: error.message };
    }
    revalidatePath(`/campus/${slug}/admin/courses`);
    return { success: true };
}

export async function removeSyllabusEntry(slug: string, id: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("syllabus_entries").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin/courses`);
    return { success: true };
}
