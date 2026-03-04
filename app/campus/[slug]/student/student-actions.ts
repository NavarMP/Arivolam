"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/lib/auth";

function getServiceClient() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );
}

/** Resolve student enrollment ID from session */
async function resolveStudentEnrollment(slug: string) {
    const sc = getServiceClient();
    const supabase = await createClient();

    const { data: institution } = await supabase
        .from("institutions")
        .select("id")
        .eq("slug", slug)
        .single();
    if (!institution) return { error: "Institution not found" };

    const erpSession = await getSession();
    if (erpSession && erpSession.institution_id === institution.id) {
        if (erpSession.role === "student") {
            return { enrollmentId: erpSession.enrollment_id, institutionId: institution.id };
        }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: member } = await supabase
            .from("institution_members")
            .select("role")
            .eq("user_id", user.id)
            .eq("institution_id", institution.id)
            .single();
        if (member && member.role === "student") {
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

    return { error: "Not authorized as student" };
}

// ─── Get My Class Info ───
export async function getMyClassInfo(slug: string) {
    const auth = await resolveStudentEnrollment(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();

    const { data, error } = await sc
        .from("student_classes")
        .select(`
            id, roll_number,
            class:classes(
                id, name, section, max_students,
                department:departments(id, name, code),
                semester:semesters(id, name, academic_year)
            )
        `)
        .eq("enrollment_id", auth.enrollmentId!)
        .eq("is_active", true)
        .single();

    if (error) return null;
    return data;
}

// ─── Get My Subjects ───
export async function getMySubjects(slug: string) {
    const auth = await resolveStudentEnrollment(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();

    // Get student's class first
    const classInfo = await getMyClassInfo(slug);
    if (!classInfo || !classInfo.class) return [];

    const { data, error } = await sc
        .from("faculty_subjects")
        .select(`
            id,
            subject:subjects(id, name, code, credits, subject_type),
            faculty:enrollments!faculty_subjects_enrollment_id_fkey(id, full_name, email)
        `)
        .eq("class_id", (classInfo.class as any).id)
        .eq("is_active", true);

    if (error) throw new Error(error.message);
    return data || [];
}

// ─── Get My Attendance ───
export async function getMyAttendance(slug: string) {
    const auth = await resolveStudentEnrollment(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();

    const { data, error } = await sc
        .from("attendance")
        .select(`
            id, date, status, remarks,
            timetable_entry:timetable_entries(
                id,
                subject:subjects(id, name, code),
                period:periods(id, name, start_time, end_time)
            )
        `)
        .eq("student_enrollment_id", auth.enrollmentId!)
        .order("date", { ascending: false })
        .limit(200);

    if (error) throw new Error(error.message);
    return data || [];
}

// ─── Get My Published Marks ───
export async function getMyMarks(slug: string) {
    const auth = await resolveStudentEnrollment(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();

    const { data, error } = await sc
        .from("exam_marks")
        .select(`
            id, marks_obtained, is_absent, remarks,
            exam:exams(
                id, name, exam_type, max_marks, exam_date, is_published, weightage,
                subject:subjects(id, name, code),
                class:classes(id, name)
            )
        `)
        .eq("student_enrollment_id", auth.enrollmentId!);

    if (error) throw new Error(error.message);
    // Only return published exam marks
    return (data || []).filter((m: any) => m.exam?.is_published);
}

// ─── Get My Timetable ───
export async function getMyTimetable(slug: string) {
    const auth = await resolveStudentEnrollment(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();

    // Get student's class first
    const classInfo = await getMyClassInfo(slug);
    if (!classInfo || !classInfo.class) return [];

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
        .eq("class_id", (classInfo.class as any).id);

    if (error) throw new Error(error.message);
    return data || [];
}

// ─── Assignments ───
export async function getMyAssignmentsWithSubmissions(slug: string) {
    const auth = await resolveStudentEnrollment(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();

    const classInfo = await getMyClassInfo(slug);
    if (!classInfo || !classInfo.class) return [];

    // Fetch assignments
    const { data: assignments, error: aError } = await sc
        .from("assignments")
        .select(`
            id, title, description, max_marks, due_date, created_at, is_published,
            subject:subjects(name, code),
            creator:enrollments!assignments_created_by_fkey(full_name)
        `)
        .eq("class_id", (classInfo.class as any).id)
        .eq("is_published", true)
        .order("due_date", { ascending: true });

    if (aError) return [];

    // Fetch ONLY this student's submissions
    const { data: submissions, error: sError } = await sc
        .from("assignment_submissions")
        .select("*")
        .eq("student_enrollment_id", auth.enrollmentId!)
        .in("assignment_id", (assignments || [{ id: "" }]).map((a: any) => a.id));

    if (sError) return [];

    // Map them together
    return (assignments || []).map((assignment: any) => ({
        ...assignment,
        my_submission: submissions?.find((s: any) => s.assignment_id === assignment.id) || null
    }));
}

export async function submitAssignment(slug: string, assignmentId: string, content: string, fileUrl?: string) {
    const auth = await resolveStudentEnrollment(slug);
    if (auth.error) throw new Error(auth.error);
    const sc = getServiceClient();

    const { error } = await sc.from("assignment_submissions").upsert({
        assignment_id: assignmentId,
        student_enrollment_id: auth.enrollmentId!,
        content: content,
        file_url: fileUrl || null,
        status: "submitted",
        submission_date: new Date().toISOString()
    }, { onConflict: "assignment_id, student_enrollment_id" });

    if (error) throw new Error(error.message);
    return { success: true };
}
