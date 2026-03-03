"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Public data fetching for the campus map viewer.
 * No authentication required — all map data is publicly readable via RLS policies.
 */
export async function getPublicMapData(slug: string) {
    const supabase = await createClient();

    // Get institution by slug
    const { data: institution } = await supabase
        .from("institutions")
        .select("id, name, slug, short_name, logo_url")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

    if (!institution) throw new Error("Institution not found");

    const [
        { data: buildings },
        { data: pois },
        { data: navNodes },
        { data: navEdges },
        { data: mapStyle },
    ] = await Promise.all([
        supabase
            .from("campus_buildings")
            .select(`
                id, name, short_name, description, category, floors,
                latitude, longitude, geo_polygon, icon, color,
                operating_hours, sort_order, label_visible_zoom, show_polygon,
                canvas_x, canvas_y, canvas_w, canvas_h,
                campus_rooms (
                    id, building_id, name, room_number, room_type, capacity,
                    description, latitude, longitude, floor_number
                )
            `)
            .eq("institution_id", institution.id)
            .eq("is_active", true)
            .order("sort_order"),
        supabase
            .from("campus_pois")
            .select("id, name, category, description, icon, latitude, longitude, building_id, canvas_x, canvas_y")
            .eq("institution_id", institution.id)
            .eq("is_active", true),
        supabase
            .from("campus_nav_nodes")
            .select("id, latitude, longitude, node_type, label, building_id, canvas_x, canvas_y")
            .eq("institution_id", institution.id),
        supabase
            .from("campus_nav_edges")
            .select("id, from_node_id, to_node_id, weight"),
        supabase
            .from("campus_map_styles")
            .select("*")
            .eq("institution_id", institution.id)
            .eq("is_active", true)
            .limit(1)
            .maybeSingle(),
    ]);

    // Transform buildings to include rooms
    const buildingsWithRooms = buildings?.map((b: any) => ({
        ...b,
        rooms: b.campus_rooms || [],
    }));

    return {
        institution,
        buildings: buildingsWithRooms || [],
        pois: pois || [],
        navNodes: navNodes || [],
        navEdges: navEdges || [],
        mapStyle: mapStyle || null,
    };
}
