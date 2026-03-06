"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function deletePost(postId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("author_id", user.id); // Ensure they can only delete their own posts

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/[username]", "page");
    revalidatePath("/profile/[userId]", "page");
    revalidatePath("/");

    return { success: true };
}
