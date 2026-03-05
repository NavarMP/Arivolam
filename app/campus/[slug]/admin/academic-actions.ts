"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { verifyInstitutionAdmin } from "./users/actions";

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );
}

// =====================================================
// SEMESTERS
// =====================================================

export async function getSemesters(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();
    const { data, error } = await sc
        .from("semesters")
        .select("*")
        .eq("institution_id", auth.institutionId!)
        .order("number", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
}

export async function createSemester(slug: string, formData: { name: string; number?: number; academic_year?: string; start_date?: string; end_date?: string }) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("semesters").insert({
        institution_id: auth.institutionId!,
        name: formData.name,
        number: formData.number || null,
        academic_year: formData.academic_year || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
    });
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin`);
    return { success: true };
}

export async function updateSemester(slug: string, id: string, formData: { name: string; number?: number; academic_year?: string; start_date?: string; end_date?: string; is_active?: boolean }) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("semesters").update({
        name: formData.name,
        number: formData.number || null,
        academic_year: formData.academic_year || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        is_active: formData.is_active ?? true,
    }).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin`);
    return { success: true };
}

export async function deleteSemester(slug: string, id: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("semesters").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin`);
    return { success: true };
}

// =====================================================
// DEPARTMENTS
// =====================================================

export async function getDepartments(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();
    const { data, error } = await sc
        .from("departments")
        .select("*, hod:enrollments!departments_hod_enrollment_id_fkey(id, full_name, email)")
        .eq("institution_id", auth.institutionId!)
        .order("name");
    if (error) throw new Error(error.message);
    return data || [];
}

export async function getDepartmentStats(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();

    // Get departments
    const { data: depts } = await sc
        .from("departments")
        .select("id")
        .eq("institution_id", auth.institutionId!);

    if (!depts || depts.length === 0) return {};

    const deptIds = depts.map(d => d.id);

    // Get classes per department
    const { data: classes } = await sc
        .from("classes")
        .select("id, department_id")
        .in("department_id", deptIds);

    // Get subjects per department
    const { data: subjects } = await sc
        .from("subjects")
        .select("id, department_id")
        .in("department_id", deptIds);

    // Get student enrollments with department field
    const { data: students } = await sc
        .from("enrollments")
        .select("id, department")
        .eq("institution_id", auth.institutionId!)
        .eq("role", "student")
        .eq("is_approved", true);

    // Get faculty enrollments with department field
    const { data: faculty } = await sc
        .from("enrollments")
        .select("id, department")
        .eq("institution_id", auth.institutionId!)
        .eq("role", "faculty")
        .eq("is_approved", true);

    // Build stats per department
    const stats: Record<string, { classes: number; subjects: number; students: number; faculty: number }> = {};

    for (const dept of depts) {
        // Get dept name for matching enrollments by department field
        const { data: deptData } = await sc
            .from("departments")
            .select("name")
            .eq("id", dept.id)
            .single();

        const deptName = deptData?.name || "";

        stats[dept.id] = {
            classes: (classes || []).filter(c => c.department_id === dept.id).length,
            subjects: (subjects || []).filter(s => s.department_id === dept.id).length,
            students: (students || []).filter(s => s.department && s.department.toLowerCase() === deptName.toLowerCase()).length,
            faculty: (faculty || []).filter(f => f.department && f.department.toLowerCase() === deptName.toLowerCase()).length,
        };
    }

    return stats;
}

export async function createDepartment(slug: string, formData: { name: string; code: string; description?: string; hod_enrollment_id?: string }) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("departments").insert({
        institution_id: auth.institutionId!,
        name: formData.name,
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        hod_enrollment_id: formData.hod_enrollment_id || null,
    });
    if (error) {
        if (error.message.includes("duplicate")) return { error: "A department with this code already exists." };
        return { error: error.message };
    }
    revalidatePath(`/campus/${slug}/admin`);
    return { success: true };
}

export async function updateDepartment(slug: string, id: string, formData: { name: string; code: string; description?: string; hod_enrollment_id?: string; is_active?: boolean }) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("departments").update({
        name: formData.name,
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        hod_enrollment_id: formData.hod_enrollment_id || null,
        is_active: formData.is_active ?? true,
    }).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin`);
    return { success: true };
}

export async function deleteDepartment(slug: string, id: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("departments").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin`);
    return { success: true };
}

// =====================================================
// CLASSES
// =====================================================

export async function getClasses(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();
    const { data, error } = await sc
        .from("classes")
        .select("*, department:departments(id, name, code), semester:semesters(id, name)")
        .eq("department.institution_id", auth.institutionId!)
        .order("name");
    if (error) throw new Error(error.message);
    // Filter out classes whose department doesn't belong to this institution
    return (data || []).filter((c: any) => c.department !== null);
}

export async function createClass(slug: string, formData: { department_id: string; semester_id: string; name: string; section?: string; max_students?: number }) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("classes").insert({
        department_id: formData.department_id,
        semester_id: formData.semester_id,
        name: formData.name,
        section: formData.section || null,
        max_students: formData.max_students || 60,
    });
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin`);
    return { success: true };
}

export async function updateClass(slug: string, id: string, formData: { department_id: string; semester_id: string; name: string; section?: string; max_students?: number; is_active?: boolean }) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("classes").update({
        department_id: formData.department_id,
        semester_id: formData.semester_id,
        name: formData.name,
        section: formData.section || null,
        max_students: formData.max_students || 60,
        is_active: formData.is_active ?? true,
    }).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin`);
    return { success: true };
}

export async function deleteClass(slug: string, id: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("classes").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin`);
    return { success: true };
}

// =====================================================
// PERIODS / HOURS
// =====================================================

export async function getPeriods(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();
    const { data, error } = await sc
        .from("periods")
        .select("*")
        .eq("institution_id", auth.institutionId!)
        .order("sort_order");
    if (error) throw new Error(error.message);
    return data || [];
}

export async function createPeriod(slug: string, formData: { name: string; start_time: string; end_time: string; sort_order: number; is_break?: boolean }) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("periods").insert({
        institution_id: auth.institutionId!,
        name: formData.name,
        start_time: formData.start_time,
        end_time: formData.end_time,
        sort_order: formData.sort_order,
        is_break: formData.is_break || false,
    });
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin`);
    return { success: true };
}

export async function updatePeriod(slug: string, id: string, formData: { name: string; start_time: string; end_time: string; sort_order: number; is_break?: boolean; is_active?: boolean }) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("periods").update({
        name: formData.name,
        start_time: formData.start_time,
        end_time: formData.end_time,
        sort_order: formData.sort_order,
        is_break: formData.is_break || false,
        is_active: formData.is_active ?? true,
    }).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin`);
    return { success: true };
}

export async function deletePeriod(slug: string, id: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("periods").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin`);
    return { success: true };
}

// =====================================================
// SUBJECTS / PAPERS
// =====================================================

export async function getSubjects(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();
    const { data, error } = await sc
        .from("subjects")
        .select("*, department:departments(id, name, code), semester:semesters(id, name)")
        .eq("department.institution_id", auth.institutionId!)
        .order("code");
    if (error) throw new Error(error.message);
    return (data || []).filter((s: any) => s.department !== null);
}

export async function createSubject(slug: string, formData: { department_id: string; semester_id?: string; name: string; code: string; credits?: number; subject_type?: string; description?: string }) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("subjects").insert({
        department_id: formData.department_id,
        semester_id: formData.semester_id || null,
        name: formData.name,
        code: formData.code.toUpperCase(),
        credits: formData.credits || 3,
        subject_type: formData.subject_type || "theory",
        description: formData.description || null,
    });
    if (error) {
        if (error.message.includes("duplicate")) return { error: "A subject with this code already exists in this department." };
        return { error: error.message };
    }
    revalidatePath(`/campus/${slug}/admin`);
    return { success: true };
}

export async function updateSubject(slug: string, id: string, formData: { department_id: string; semester_id?: string; name: string; code: string; credits?: number; subject_type?: string; description?: string; is_active?: boolean }) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("subjects").update({
        department_id: formData.department_id,
        semester_id: formData.semester_id || null,
        name: formData.name,
        code: formData.code.toUpperCase(),
        credits: formData.credits || 3,
        subject_type: formData.subject_type || "theory",
        description: formData.description || null,
        is_active: formData.is_active ?? true,
    }).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin`);
    return { success: true };
}

export async function deleteSubject(slug: string, id: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("subjects").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin`);
    return { success: true };
}

// =====================================================
// FACULTY ↔ SUBJECT ASSIGNMENT
// =====================================================

export async function getFacultySubjects(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();
    const { data, error } = await sc
        .from("faculty_subjects")
        .select("*, faculty:enrollments!faculty_subjects_enrollment_id_fkey(id, full_name, email, department), subject:subjects(id, name, code), class:classes(id, name)")
        .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
}

export async function assignFacultySubject(slug: string, formData: { enrollment_id: string; subject_id: string; class_id: string }) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("faculty_subjects").insert({
        enrollment_id: formData.enrollment_id,
        subject_id: formData.subject_id,
        class_id: formData.class_id,
    });
    if (error) {
        if (error.message.includes("duplicate")) return { error: "This faculty is already assigned to this subject for this class." };
        return { error: error.message };
    }
    revalidatePath(`/campus/${slug}/admin`);
    return { success: true };
}

export async function removeFacultySubject(slug: string, id: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("faculty_subjects").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin`);
    return { success: true };
}

// =====================================================
// STUDENT ↔ CLASS ASSIGNMENT
// =====================================================

export async function getStudentClasses(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();
    const { data, error } = await sc
        .from("student_classes")
        .select("*, student:enrollments!student_classes_enrollment_id_fkey(id, full_name, email, register_number, admission_number, department), class:classes(id, name, department:departments(id, name, code))")
        .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
}

export async function assignStudentClass(slug: string, formData: { enrollment_id: string; class_id: string; roll_number?: string }) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("student_classes").upsert({
        enrollment_id: formData.enrollment_id,
        class_id: formData.class_id,
        roll_number: formData.roll_number || null,
    }, { onConflict: "enrollment_id" });
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin`);
    return { success: true };
}

export async function removeStudentClass(slug: string, id: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("student_classes").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin`);
    return { success: true };
}

// =====================================================
// CALENDAR EVENTS
// =====================================================

export async function getCalendarEvents(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();
    const { data, error } = await sc
        .from("calendar_events")
        .select("*, department:departments(id, name, code)")
        .eq("institution_id", auth.institutionId!)
        .order("start_date", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
}

export async function createCalendarEvent(slug: string, formData: { title: string; description?: string; event_type?: string; start_date: string; end_date?: string; all_day?: boolean; location?: string; color?: string; department_id?: string }) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("calendar_events").insert({
        institution_id: auth.institutionId!,
        department_id: formData.department_id || null,
        title: formData.title,
        description: formData.description || null,
        event_type: formData.event_type || "general",
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        all_day: formData.all_day || false,
        location: formData.location || null,
        color: formData.color || null,
    });
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}`);
    return { success: true };
}

export async function updateCalendarEvent(slug: string, id: string, formData: { title: string; description?: string; event_type?: string; start_date: string; end_date?: string; all_day?: boolean; location?: string; color?: string; department_id?: string }) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("calendar_events").update({
        department_id: formData.department_id || null,
        title: formData.title,
        description: formData.description || null,
        event_type: formData.event_type || "general",
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        all_day: formData.all_day || false,
        location: formData.location || null,
        color: formData.color || null,
    }).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}`);
    return { success: true };
}

export async function deleteCalendarEvent(slug: string, id: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();
    const { error } = await sc.from("calendar_events").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}`);
    return { success: true };
}

// =====================================================
// HELPERS
// =====================================================

// Get all faculty enrollments for an institution (for assignment dropdowns)
export async function getFacultyEnrollments(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();
    const { data, error } = await sc
        .from("enrollments")
        .select("id, full_name, email, department, role")
        .eq("institution_id", auth.institutionId!)
        .in("role", ["faculty", "admin"])
        .eq("is_approved", true)
        .order("full_name");
    if (error) throw new Error(error.message);
    return data || [];
}

// Get all student enrollments for an institution (for assignment dropdowns)
export async function getStudentEnrollments(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();
    const { data, error } = await sc
        .from("enrollments")
        .select("id, full_name, email, register_number, admission_number, department, role")
        .eq("institution_id", auth.institutionId!)
        .eq("role", "student")
        .eq("is_approved", true)
        .order("full_name");
    if (error) throw new Error(error.message);
    return data || [];
}

// =====================================================
// TIMETABLE
// =====================================================

export async function getTimetableEntries(slug: string, classId: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();

    // Check if class belongs to this institution
    const { data: cls } = await sc
        .from("classes")
        .select("department:departments(institution_id)")
        .eq("id", classId)
        .single();

    if (!cls || (cls.department as any)?.institution_id !== auth.institutionId) {
        throw new Error("Invalid class");
    }

    const { data, error } = await sc
        .from("timetable_entries")
        .select(`
            *,
            subject:subjects(id, name, code, subject_type),
            period:periods(id, name, start_time, end_time, is_break),
            faculty_subject:faculty_subjects(
                id, 
                faculty:enrollments!faculty_subjects_enrollment_id_fkey(id, full_name)
            )
        `)
        .eq("class_id", classId);

    if (error) throw new Error(error.message);
    return data || [];
}

export async function saveTimetableEntry(
    slug: string,
    formData: {
        class_id: string;
        subject_id: string;
        period_id: string;
        day_of_week: number;
        faculty_subject_id?: string;
        room?: string;
    }
) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };

    const sc = getServiceClient();

    // Verify class belongs to institution
    const { data: cls } = await sc
        .from("classes")
        .select("department:departments(institution_id)")
        .eq("id", formData.class_id)
        .single();

    if (!cls || (cls.department as any)?.institution_id !== auth.institutionId) {
        return { error: "Invalid class" };
    }

    const { error } = await sc.from("timetable_entries").upsert({
        class_id: formData.class_id,
        subject_id: formData.subject_id,
        period_id: formData.period_id,
        day_of_week: formData.day_of_week,
        faculty_subject_id: formData.faculty_subject_id || null,
        room: formData.room || null,
    }, { onConflict: "class_id, period_id, day_of_week" });

    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin/timetable`);
    return { success: true };
}

export async function deleteTimetableEntry(slug: string, id: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();

    // Add extra safety: verify the entry belongs to a class in this institution
    const { data: entry } = await sc
        .from("timetable_entries")
        .select("class:classes(department:departments(institution_id))")
        .eq("id", id)
        .single();

    if (!entry || (entry.class as any)?.department?.institution_id !== auth.institutionId) {
        return { error: "Unauthorized or not found" };
    }

    const { error } = await sc.from("timetable_entries").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/admin/timetable`);
    return { success: true };
}
