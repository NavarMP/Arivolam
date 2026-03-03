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
