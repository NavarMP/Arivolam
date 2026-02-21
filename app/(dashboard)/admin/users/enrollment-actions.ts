"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function createEnrollment(formData: FormData) {
    const supabase = await createClient();

    // 1. Verify Dev Admin or Institution Admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const institutionId = formData.get("institutionId") as string;

    // Check if user is a Dev Admin or an Admin for this specific institution
    const [{ data: profile }, { data: membership }] = await Promise.all([
        supabase.from("arivolam_profiles").select("is_dev_admin").eq("id", user.id).single(),
        supabase.from("institution_members").select("role").eq("user_id", user.id).eq("institution_id", institutionId).single(),
    ]);

    if (!profile?.is_dev_admin && membership?.role !== "admin") {
        return { error: "You do not have permission to create enrollments for this institution." };
    }

    // 2. Extract Data
    const role = formData.get("role") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const registerNumber = formData.get("registerNumber") as string;
    const admissionNumber = formData.get("admissionNumber") as string;
    const employeeId = formData.get("employeeId") as string;
    const username = formData.get("username") as string;
    const department = formData.get("department") as string;
    const rawPassword = formData.get("password") as string;

    if (!email && !phone) return { error: "Email or phone is required for auto-linking." };
    if (!username && !admissionNumber && !registerNumber && !employeeId) {
        return { error: "At least one identifier (Username, Admission No, Register No, Employee ID) is required." };
    }
    if (!rawPassword) return { error: "Password is required." };

    try {
        // 3. Securely hash the password
        const saltPattern = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(rawPassword, saltPattern);

        // 4. Insert Enrollment
        const { error } = await supabase.from("enrollments").insert({
            institution_id: institutionId,
            role,
            email: email || null,
            phone: phone || null,
            register_number: registerNumber || null,
            admission_number: admissionNumber || null,
            employee_id: employeeId || null,
            username: username || null,
            department: department || null,
            password_hash: passwordHash,
            is_claimed: false, // Wait for them to sign up to Arivolam OR login via isolated auth
        });

        if (error) {
            console.error("Enrollment error:", error);
            // Handle unique constraint violations gracefully
            if (error.code === '23505') {
                return { error: "An enrollment with this email, phone, or identifier already exists." };
            }
            return { error: "Failed to create enrollment. Check identifiers." };
        }

        revalidatePath("/admin/users");
        revalidatePath("/dev-admin/users");

        return { success: true };

    } catch (err) {
        console.error("Hash error:", err);
        return { error: "An unexpected error occurred processing the security credentials." };
    }
}

export async function updateEnrollmentRole(enrollmentId: string, newRole: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: profile } = await supabase.from("arivolam_profiles").select("is_dev_admin").eq("id", user.id).single();

    // Simplistic admin check: normally we'd verify they are admin of the *same* institution
    if (!profile?.is_dev_admin) {
        // Find their admin memberships
        const { data: memberships } = await supabase.from("institution_members").select("institution_id").eq("user_id", user.id).eq("role", "admin");
        if (!memberships || memberships.length === 0) {
            return { error: "Forbidden: Only admins can change roles" };
        }

        // Ensure the enrollment belongs to an institution they manage
        const { data: targetEnrollment } = await supabase.from("enrollments").select("institution_id").eq("id", enrollmentId).single();
        if (!targetEnrollment || !memberships.some(m => m.institution_id === targetEnrollment.institution_id)) {
            return { error: "Forbidden: Not an admin for this institution" };
        }
    }

    const { error } = await supabase
        .from("enrollments")
        .update({ role: newRole })
        .eq("id", enrollmentId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/admin/users");
    revalidatePath("/dev-admin/users");
    return { success: true };
}

export async function deleteEnrollment(enrollmentId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: profile } = await supabase.from("arivolam_profiles").select("is_dev_admin").eq("id", user.id).single();

    // Simplistic admin check
    if (!profile?.is_dev_admin) {
        const { data: memberships } = await supabase.from("institution_members").select("institution_id").eq("user_id", user.id).eq("role", "admin");
        if (!memberships || memberships.length === 0) {
            return { error: "Forbidden: Only admins can delete enrollments" };
        }

        const { data: targetEnrollment } = await supabase.from("enrollments").select("institution_id").eq("id", enrollmentId).single();
        if (!targetEnrollment || !memberships.some(m => m.institution_id === targetEnrollment.institution_id)) {
            return { error: "Forbidden: Not an admin for this institution" };
        }
    }

    const { error } = await supabase
        .from("enrollments")
        .delete()
        .eq("id", enrollmentId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/admin/users");
    revalidatePath("/dev-admin/users");
    return { success: true };
}
