"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updatePassword(formData: FormData) {
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!newPassword || newPassword.length < 6) {
        return { error: "Password must be at least 6 characters long." };
    }

    if (newPassword !== confirmPassword) {
        return { error: "Passwords do not match." };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
        return { error: error.message };
    }

    return { success: "Password updated successfully." };
}

export async function updateEmail(formData: FormData) {
    const newEmail = formData.get("newEmail") as string;

    if (!newEmail || !newEmail.includes("@")) {
        return { error: "Please provide a valid email address." };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ email: newEmail });

    if (error) {
        return { error: error.message };
    }

    return { success: "Confirmation email sent to both old and new addresses. Please confirm to finalize." };
}

export async function deleteAccount() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    // Call the RPC function we created in 22_institution_profiles.sql
    // Note: this RPC calls DELETE FROM auth.users, which triggers CASCADE
    const { error } = await supabase.rpc('delete_user_account', { user_id: user.id });

    if (error) {
        return { error: error.message };
    }

    // Sign out natively
    await supabase.auth.signOut();

    return { success: true };
}
