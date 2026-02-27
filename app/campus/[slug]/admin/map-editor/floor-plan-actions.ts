"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import type { FloorPlan } from "@/components/campus/floor-plan";

// Initialize admin client with service role key to bypass RLS when editing
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: { persistSession: false },
    }
);

export async function getFloorPlans(buildingId: string): Promise<FloorPlan[]> {
    const { data, error } = await supabaseAdmin
        .from("campus_floor_plans")
        .select("*")
        .eq("building_id", buildingId)
        .order("floor_number", { ascending: true });

    if (error) {
        console.error("Error fetching floor plans:", error);
        return [];
    }
    return data as FloorPlan[];
}

export async function saveFloorPlan(plan: FloorPlan): Promise<FloorPlan> {
    const { id, ...planData } = plan;

    if (id) {
        // Update existing
        const { data, error } = await supabaseAdmin
            .from("campus_floor_plans")
            .update(planData)
            .eq("id", id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    } else {
        // Insert new - check if floor exists for this building first to handle UPSERT conceptually
        const { data: existing, error: existingError } = await supabaseAdmin
            .from("campus_floor_plans")
            .select("id")
            .eq("building_id", plan.building_id)
            .eq("floor_number", plan.floor_number)
            .single();

        if (existing) {
            // Upate
            const { data, error } = await supabaseAdmin
                .from("campus_floor_plans")
                .update(planData)
                .eq("id", existing.id)
                .select()
                .single();

            if (error) throw new Error(error.message);
            return data;
        }

        // Insert
        const { data, error } = await supabaseAdmin
            .from("campus_floor_plans")
            .insert([planData])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }
}

export async function deleteFloorPlan(id: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from("campus_floor_plans")
        .delete()
        .eq("id", id);

    if (error) throw new Error(error.message);
}
