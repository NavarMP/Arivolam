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

// ─── Get Institution Details ───
export async function getInstitutionDetails(slug: string) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) throw new Error(auth.error);

    const sc = getServiceClient();
    const { data, error } = await sc
        .from("institutions")
        .select("*")
        .eq("id", auth.institutionId!)
        .single();

    if (error) throw new Error(error.message);
    return data;
}

// ─── Update Institution Details ───
export async function updateInstitutionDetails(
    slug: string,
    formData: {
        name?: string;
        short_name?: string;
        description?: string;
        website?: string;
        address?: string;
        city?: string;
        state?: string;
        country?: string;
        primary_color?: string;
        logo_url?: string;
        cover_url?: string;
        map_access?: string;
    }
) {
    const auth = await verifyInstitutionAdmin(slug);
    if (auth.error) return { error: auth.error };

    const sc = getServiceClient();

    const updateData: Record<string, any> = {};
    if (formData.name !== undefined) updateData.name = formData.name;
    if (formData.short_name !== undefined) updateData.short_name = formData.short_name || null;
    if (formData.description !== undefined) updateData.description = formData.description || null;
    if (formData.website !== undefined) updateData.website = formData.website || null;
    if (formData.address !== undefined) updateData.address = formData.address || null;
    if (formData.city !== undefined) updateData.city = formData.city || null;
    if (formData.state !== undefined) updateData.state = formData.state || null;
    if (formData.country !== undefined) updateData.country = formData.country || null;
    if (formData.primary_color !== undefined) updateData.primary_color = formData.primary_color || null;
    if (formData.logo_url !== undefined) updateData.logo_url = formData.logo_url || null;
    if (formData.cover_url !== undefined) updateData.cover_url = formData.cover_url || null;
    if (formData.map_access !== undefined) updateData.map_access = formData.map_access || "public";

    updateData.updated_at = new Date().toISOString();

    const { error } = await sc
        .from("institutions")
        .update(updateData)
        .eq("id", auth.institutionId!);

    if (error) return { error: error.message };

    revalidatePath(`/campus/${slug}/admin/settings`);
    revalidatePath(`/campus/${slug}`);
    return { success: true };
}
