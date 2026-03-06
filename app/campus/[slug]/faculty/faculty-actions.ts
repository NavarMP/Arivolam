"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );
}

/** Resolve faculty enrollment ID from session */
async function resolveFacultyEnrollment(slug: string) {
    const sc = getServiceClient();
    const supabase = await createClient();

    // Get institution
    const { data: institution } = await supabase
        .from("institutions")
        .select("id")
        .eq("slug", slug)
        .single();
    if (!institution) return { error: "Institution not found" };

    // Method 1: ERP session
    const erpSession = await getSession();
    if (erpSession && erpSession.institution_id === institution.id) {
        if (erpSession.role === "faculty" || erpSession.role === "admin") {
            return { enrollmentId: erpSession.enrollment_id, institutionId: institution.id };
        }
    }

    // Method 2: Supabase Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: member } = await supabase
            .from("institution_members")
            .select("role")
            .eq("user_id", user.id)
            .eq("institution_id", institution.id)
            .single();
        if (member && (member.role === "faculty" || member.role === "admin")) {
            // Find enrollment
            const { data: enrollment } = await sc
                .from("enrollments")
                .select("id")
                .eq("institution_id", institution.id)
                .or(`email.eq.${user.email}`)
                .eq("is_approved", true)
                .single();
            if (enrollment) {
                return { enrollmentId: enrollment.id, institutionId: institution.id };
            }
        }
    }

    return { error: "Not authorized as faculty" };
}

// ─── Get My Assigned Classes ───
export async function getMyClasses(slug: string) {
    const auth = await resolveFacultyEnrollment(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();

    const { data, error } = await sc
        .from("faculty_subjects")
        .select(`
            id,
            subject:subjects(id, name, code, subject_type, credits),
            class:classes(id, name, section, department:departments(id, name, code), semester:semesters(id, name))
        `)
        .eq("enrollment_id", auth.enrollmentId!)
        .eq("is_active", true);

    if (error) throw new Error(error.message);
    return data || [];
}

// ─── Get Students for a Class ───
export async function getClassStudents(slug: string, classId: string) {
    const auth = await resolveFacultyEnrollment(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();

    const { data, error } = await sc
        .from("student_classes")
        .select(`
            id, roll_number,
            student:enrollments!student_classes_enrollment_id_fkey(id, full_name, register_number, admission_number)
        `)
        .eq("class_id", classId)
        .eq("is_active", true)
        .order("roll_number");

    if (error) throw new Error(error.message);
    return data || [];
}

// ─── Get Timetable Entries for Faculty ───
export async function getMyTimetableEntries(slug: string) {
    const auth = await resolveFacultyEnrollment(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();

    const { data: fsData, error: fsError } = await sc
        .from("faculty_subjects")
        .select("id")
        .eq("enrollment_id", auth.enrollmentId!)
        .eq("is_active", true);

    if (fsError || !fsData || fsData.length === 0) return [];

    const fsIds = fsData.map(fs => fs.id);

    const { data, error } = await sc
        .from("timetable_entries")
        .select(`
            id, day_of_week, room,
            class:classes(id, name),
            subject:subjects(id, name, code),
            period:periods(id, name, start_time, end_time, sort_order)
        `)
        .in("faculty_subject_id", fsIds)
        .eq("is_active", true);

    if (error) throw new Error(error.message);
    return data || [];
}

// ─── Mark Attendance (Bulk) ───
export async function markAttendance(slug: string, data: {
    timetable_entry_id: string;
    date: string;
    records: { student_enrollment_id: string; status: string; remarks?: string }[];
}) {
    const auth = await resolveFacultyEnrollment(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();

    // If no records are sent, the faculty is clearing all attendance for this period
    if (data.records.length === 0) {
        const { error } = await sc
            .from("attendance")
            .delete()
            .eq("timetable_entry_id", data.timetable_entry_id)
            .eq("date", data.date);

        if (error) return { error: error.message };
        revalidatePath(`/campus/${slug}/faculty`);
        return { success: true };
    }

    const rows = data.records.map(r => ({
        student_enrollment_id: r.student_enrollment_id,
        timetable_entry_id: data.timetable_entry_id,
        date: data.date,
        status: r.status,
        marked_by: auth.enrollmentId!,
        remarks: r.remarks || null,
    }));

    // Upsert to handle re-marking
    const { error } = await sc
        .from("attendance")
        .upsert(rows, { onConflict: "student_enrollment_id,timetable_entry_id,date" });

    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/faculty`);
    return { success: true };
}

// ─── Get Attendance for a Class+Entry+Date ───
export async function getAttendanceForEntry(slug: string, timetableEntryId: string, date: string) {
    const auth = await resolveFacultyEnrollment(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();

    const { data, error } = await sc
        .from("attendance")
        .select(`
            id, status, remarks,
            student:enrollments!attendance_student_enrollment_id_fkey(id, full_name, register_number)
        `)
        .eq("timetable_entry_id", timetableEntryId)
        .eq("date", date);

    if (error) throw new Error(error.message);
    return data || [];
}

// ─── Get Exams for Faculty's Subjects ───
export async function getMyExams(slug: string) {
    const auth = await resolveFacultyEnrollment(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();

    // Get faculty's subject IDs
    const { data: assignments } = await sc
        .from("faculty_subjects")
        .select("subject_id, class_id")
        .eq("enrollment_id", auth.enrollmentId!)
        .eq("is_active", true);

    if (!assignments || assignments.length === 0) return [];

    const subjectIds = [...new Set(assignments.map(a => a.subject_id))];
    const classIds = [...new Set(assignments.map(a => a.class_id))];

    const { data, error } = await sc
        .from("exams")
        .select(`
            id, name, exam_type, max_marks, exam_date, is_published, weightage,
            subject:subjects(id, name, code),
            class:classes(id, name)
        `)
        .eq("institution_id", auth.institutionId!)
        .in("subject_id", subjectIds)
        .in("class_id", classIds)
        .order("exam_date", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
}

// ─── Create Exam ───
export async function createExam(slug: string, formData: {
    subject_id: string; class_id: string; semester_id?: string; exam_type: string;
    name: string; max_marks: number; weightage?: number; exam_date?: string; description?: string;
}) {
    const auth = await resolveFacultyEnrollment(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();

    const { error } = await sc.from("exams").insert({
        institution_id: auth.institutionId!,
        subject_id: formData.subject_id,
        class_id: formData.class_id,
        semester_id: formData.semester_id || null,
        exam_type: formData.exam_type,
        name: formData.name,
        max_marks: formData.max_marks,
        weightage: formData.weightage || null,
        exam_date: formData.exam_date || null,
        description: formData.description || null,
    });

    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/faculty`);
    return { success: true };
}

// ─── Enter Marks (Bulk) ───
export async function enterMarks(slug: string, examId: string, marks: { student_enrollment_id: string; marks_obtained: number | null; is_absent: boolean; remarks?: string }[]) {
    const auth = await resolveFacultyEnrollment(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();

    const rows = marks.map(m => ({
        exam_id: examId,
        student_enrollment_id: m.student_enrollment_id,
        marks_obtained: m.marks_obtained,
        is_absent: m.is_absent,
        remarks: m.remarks || null,
        entered_by: auth.enrollmentId!,
    }));

    const { error } = await sc
        .from("exam_marks")
        .upsert(rows, { onConflict: "exam_id,student_enrollment_id" });

    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/faculty`);
    return { success: true };
}

// ─── Get Marks for an Exam ───
export async function getExamMarks(slug: string, examId: string) {
    const auth = await resolveFacultyEnrollment(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();

    const { data, error } = await sc
        .from("exam_marks")
        .select(`
            id, marks_obtained, is_absent, remarks,
            student:enrollments!exam_marks_student_enrollment_id_fkey(id, full_name, register_number, admission_number)
        `)
        .eq("exam_id", examId);

    if (error) throw new Error(error.message);
    return data || [];
}

// ─── Publish/Unpublish Exam ───
export async function toggleExamPublish(slug: string, examId: string, isPublished: boolean) {
    const auth = await resolveFacultyEnrollment(slug);
    if (auth.error) return { error: auth.error };
    const sc = getServiceClient();

    const { error } = await sc.from("exams").update({ is_published: isPublished }).eq("id", examId);
    if (error) return { error: error.message };
    revalidatePath(`/campus/${slug}/faculty`);
    return { success: true };
}
