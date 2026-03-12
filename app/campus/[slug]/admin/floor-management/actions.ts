"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/auth";
import type { FloorPlan } from "@/components/campus/floor-plan";
import type { RoomData } from "@/components/campus/room-dialog";

// ─── Helper: verify admin role ───
async function verifyAdmin(slug: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const erpSession = await getSession();

    if (!user && !erpSession) throw new Error("Not authenticated");

    const { data: institution } = await supabase
        .from("institutions")
        .select("id")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

    if (!institution) throw new Error("Institution not found");

    let isAdmin = false;

    if (user) {
        const { data: membership } = await supabase
            .from("institution_members")
            .select("role")
            .eq("user_id", user.id)
            .eq("institution_id", institution.id)
            .eq("is_active", true)
            .single();

        if (membership?.role === "admin") isAdmin = true;
    }

    if (erpSession && erpSession.institution_id === institution.id && erpSession.role === "admin") {
        isAdmin = true;
    }

    if (!isAdmin) throw new Error("Admin access required");

    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    return { supabase: supabaseAdmin, institutionId: institution.id };
}

// ─── Get all data for floor management page ───

export async function getFloorManagementData(slug: string) {
    const { supabase, institutionId } = await verifyAdmin(slug);

    const [
        { data: buildings },
        { data: rooms },
        { data: floorPlans },
    ] = await Promise.all([
        supabase
            .from("campus_buildings")
            .select("id, name, short_name, category, floors, color, icon")
            .eq("institution_id", institutionId)
            .eq("is_active", true)
            .order("sort_order"),
        supabase
            .from("campus_rooms")
            .select("*")
            .in("building_id", (await supabase
                .from("campus_buildings")
                .select("id")
                .eq("institution_id", institutionId)
            ).data?.map((b: any) => b.id) || []),
        supabase
            .from("campus_floor_plans")
            .select("*")
            .in("building_id", (await supabase
                .from("campus_buildings")
                .select("id")
                .eq("institution_id", institutionId)
            ).data?.map((b: any) => b.id) || [])
            .order("floor_number"),
    ]);

    return {
        buildings: (buildings || []).map((b: any) => ({
            id: b.id,
            name: b.name,
            short_name: b.short_name,
            category: b.category,
            floors: b.floors,
            color: b.color || "#3b82f6",
        })),
        rooms: rooms || [],
        floorPlans: floorPlans || [],
    };
}

// ─── Room CRUD ───

export async function saveRoomAction(slug: string, room: RoomData): Promise<RoomData> {
    const { supabase } = await verifyAdmin(slug);

    const payload = {
        building_id: room.building_id,
        name: room.name,
        room_number: room.room_number || null,
        room_type: room.room_type,
        capacity: room.capacity || null,
        description: room.description || null,
        floor_number: room.floor_number ?? 0,
        operating_hours: room.operating_hours || null,
        amenities: room.amenities && room.amenities.length > 0 ? room.amenities : null,
        is_accessible: room.is_accessible ?? false,
        latitude: room.latitude || null,
        longitude: room.longitude || null,
        is_active: true,
    };

    if (room.id) {
        const { data, error } = await supabase
            .from("campus_rooms")
            .update(payload)
            .eq("id", room.id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    } else {
        const { data, error } = await supabase
            .from("campus_rooms")
            .insert(payload)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
}

export async function deleteRoomAction(slug: string, roomId: string): Promise<void> {
    const { supabase } = await verifyAdmin(slug);
    const { error } = await supabase
        .from("campus_rooms")
        .delete()
        .eq("id", roomId);
    if (error) throw new Error(error.message);
}

// ─── Floor Plan CRUD ───

export async function getFloorPlansAction(buildingId: string): Promise<FloorPlan[]> {
    // Use admin client for floor plans
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

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

export async function saveFloorPlanAction(plan: FloorPlan): Promise<FloorPlan> {
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const { id, ...planData } = plan;

    if (id) {
        const { data, error } = await supabaseAdmin
            .from("campus_floor_plans")
            .update(planData)
            .eq("id", id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    } else {
        // Upsert by building_id + floor_number
        const { data: existing } = await supabaseAdmin
            .from("campus_floor_plans")
            .select("id")
            .eq("building_id", plan.building_id)
            .eq("floor_number", plan.floor_number)
            .single();

        if (existing) {
            const { data, error } = await supabaseAdmin
                .from("campus_floor_plans")
                .update(planData)
                .eq("id", existing.id)
                .select()
                .single();
            if (error) throw new Error(error.message);
            return data;
        }

        const { data, error } = await supabaseAdmin
            .from("campus_floor_plans")
            .insert([planData])
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
}

export async function deleteFloorPlanAction(id: string): Promise<void> {
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const { error } = await supabaseAdmin
        .from("campus_floor_plans")
        .delete()
        .eq("id", id);
    if (error) throw new Error(error.message);
}
