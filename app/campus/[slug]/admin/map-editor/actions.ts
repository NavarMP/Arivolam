"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getSession } from "@/lib/auth";

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

    if (!isAdmin) {
        throw new Error("Admin access required");
    }

    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    return { supabase: supabaseAdmin, institutionId: institution.id };
}

// ─── Buildings ───

export async function saveBuilding(slug: string, building: {
    id?: string;
    name: string;
    short_name?: string;
    description?: string;
    category: string;
    floors: number;
    latitude: number;
    longitude: number;
    geo_polygon?: any;
    icon?: string;
    color?: string;
    operating_hours?: string;
    sort_order?: number;
    label_visible_zoom?: number;
    show_polygon?: boolean;
    canvas_x?: number;
    canvas_y?: number;
    canvas_w?: number;
    canvas_h?: number;
}) {
    const { supabase, institutionId } = await verifyAdmin(slug);

    const payload = {
        institution_id: institutionId,
        name: building.name,
        short_name: building.short_name || null,
        description: building.description || null,
        category: building.category,
        floors: building.floors,
        latitude: building.latitude,
        longitude: building.longitude,
        geo_polygon: building.geo_polygon || null,
        icon: building.icon || "building",
        color: building.color || "#3b82f6",
        operating_hours: building.operating_hours || null,
        sort_order: building.sort_order || 0,
        label_visible_zoom: building.label_visible_zoom || 17,
        show_polygon: building.show_polygon ?? true,
        canvas_x: building.canvas_x ?? null,
        canvas_y: building.canvas_y ?? null,
        canvas_w: building.canvas_w ?? null,
        canvas_h: building.canvas_h ?? null,
        is_active: true,
    };

    if (building.id) {
        const { data, error } = await supabase
            .from("campus_buildings")
            .update(payload)
            .eq("id", building.id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    } else {
        const { data, error } = await supabase
            .from("campus_buildings")
            .insert(payload)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
}

export async function deleteBuilding(slug: string, buildingId: string) {
    const { supabase } = await verifyAdmin(slug);
    const { error } = await supabase
        .from("campus_buildings")
        .delete()
        .eq("id", buildingId);
    if (error) throw new Error(error.message);
}

// ─── POIs ───

export async function savePOI(slug: string, poi: {
    id?: string;
    name: string;
    category: string;
    description?: string;
    icon?: string;
    latitude: number;
    longitude: number;
    building_id?: string;
    canvas_x?: number;
    canvas_y?: number;
}) {
    const { supabase, institutionId } = await verifyAdmin(slug);

    const payload = {
        institution_id: institutionId,
        name: poi.name,
        category: poi.category,
        description: poi.description || null,
        icon: poi.icon || "map-pin",
        latitude: poi.latitude,
        longitude: poi.longitude,
        building_id: poi.building_id || null,
        canvas_x: poi.canvas_x ?? null,
        canvas_y: poi.canvas_y ?? null,
        is_active: true,
    };

    if (poi.id) {
        const { data, error } = await supabase
            .from("campus_pois")
            .update(payload)
            .eq("id", poi.id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    } else {
        const { data, error } = await supabase
            .from("campus_pois")
            .insert(payload)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
}

export async function deletePOI(slug: string, poiId: string) {
    const { supabase } = await verifyAdmin(slug);
    const { error } = await supabase
        .from("campus_pois")
        .delete()
        .eq("id", poiId);
    if (error) throw new Error(error.message);
}

// ─── Rooms ───

export async function saveRoom(slug: string, room: {
    id?: string;
    building_id: string;
    name: string;
    room_number?: string;
    room_type: string;
    capacity?: number;
    description?: string;
    latitude?: number;
    longitude?: number;
}) {
    const { supabase } = await verifyAdmin(slug);

    const payload = {
        building_id: room.building_id,
        name: room.name,
        room_number: room.room_number || null,
        room_type: room.room_type,
        capacity: room.capacity || null,
        description: room.description || null,
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

export async function deleteRoom(slug: string, roomId: string) {
    const { supabase } = await verifyAdmin(slug);
    const { error } = await supabase
        .from("campus_rooms")
        .delete()
        .eq("id", roomId);
    if (error) throw new Error(error.message);
}

// ─── Nav Nodes ───

export async function saveNavNode(slug: string, node: {
    id?: string;
    latitude: number;
    longitude: number;
    node_type: string;
    label?: string;
    building_id?: string;
    floor_number?: number;
    canvas_x?: number;
    canvas_y?: number;
}) {
    const { supabase, institutionId } = await verifyAdmin(slug);

    const payload = {
        institution_id: institutionId,
        latitude: node.latitude,
        longitude: node.longitude,
        node_type: node.node_type,
        label: node.label || null,
        building_id: node.building_id || null,
        floor_number: node.floor_number || 0,
        canvas_x: node.canvas_x ?? null,
        canvas_y: node.canvas_y ?? null,
    };

    if (node.id) {
        const { data, error } = await supabase
            .from("campus_nav_nodes")
            .update(payload)
            .eq("id", node.id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    } else {
        const { data, error } = await supabase
            .from("campus_nav_nodes")
            .insert(payload)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
}

export async function deleteNavNode(slug: string, nodeId: string) {
    const { supabase } = await verifyAdmin(slug);
    // Delete edges connected to this node first
    await supabase
        .from("campus_nav_edges")
        .delete()
        .or(`from_node_id.eq.${nodeId},to_node_id.eq.${nodeId}`);
    const { error } = await supabase
        .from("campus_nav_nodes")
        .delete()
        .eq("id", nodeId);
    if (error) throw new Error(error.message);
}

// ─── Nav Edges ───

export async function saveNavEdge(slug: string, edge: {
    id?: string;
    from_node_id: string;
    to_node_id: string;
    weight: number;
    edge_type?: string;
    is_accessible?: boolean;
    is_covered?: boolean;
    surface_type?: string;
}) {
    const { supabase } = await verifyAdmin(slug);

    const payload = {
        from_node_id: edge.from_node_id,
        to_node_id: edge.to_node_id,
        weight: edge.weight,
        edge_type: edge.edge_type || "walkway",
        is_accessible: edge.is_accessible ?? true,
        is_covered: edge.is_covered ?? false,
        surface_type: edge.surface_type || "paved",
    };

    if (edge.id) {
        const { data, error } = await supabase
            .from("campus_nav_edges")
            .update(payload)
            .eq("id", edge.id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    } else {
        const { data, error } = await supabase
            .from("campus_nav_edges")
            .insert(payload)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
}

export async function deleteNavEdge(slug: string, edgeId: string) {
    const { supabase } = await verifyAdmin(slug);
    const { error } = await supabase
        .from("campus_nav_edges")
        .delete()
        .eq("id", edgeId);
    if (error) throw new Error(error.message);
}

// ─── Map Styles ───

export async function saveMapStyle(slug: string, style: {
    id?: string;
    name?: string;
    center_lat: number;
    center_lng: number;
    default_zoom?: number;
    max_zoom?: number;
    min_zoom?: number;
    boundary_polygon?: any;
}) {
    const { supabase, institutionId } = await verifyAdmin(slug);

    const payload = {
        institution_id: institutionId,
        name: style.name || "Default",
        center_lat: style.center_lat,
        center_lng: style.center_lng,
        default_zoom: style.default_zoom || 17,
        max_zoom: style.max_zoom || 22,
        min_zoom: style.min_zoom || 14,
        boundary_polygon: style.boundary_polygon || null,
        is_active: true,
    };

    if (style.id) {
        const { data, error } = await supabase
            .from("campus_map_styles")
            .update(payload)
            .eq("id", style.id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    } else {
        const { data, error } = await supabase
            .from("campus_map_styles")
            .insert(payload)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
}

// ─── Bulk fetch all map data for editor ───

export async function getMapEditorData(slug: string) {
    const { supabase, institutionId } = await verifyAdmin(slug);

    const [
        { data: buildings },
        { data: pois },
        { data: navNodes },
        { data: navEdges },
        { data: rooms },
        { data: mapStyle },
    ] = await Promise.all([
        supabase
            .from("campus_buildings")
            .select("*")
            .eq("institution_id", institutionId)
            .order("sort_order"),
        supabase
            .from("campus_pois")
            .select("*")
            .eq("institution_id", institutionId),
        supabase
            .from("campus_nav_nodes")
            .select("*")
            .eq("institution_id", institutionId),
        supabase
            .from("campus_nav_edges")
            .select("*"),
        supabase
            .from("campus_rooms")
            .select("*"),
        supabase
            .from("campus_map_styles")
            .select("*")
            .eq("institution_id", institutionId)
            .eq("is_active", true)
            .limit(1)
            .maybeSingle(),
    ]);

    return {
        buildings: buildings || [],
        pois: pois || [],
        navNodes: navNodes || [],
        navEdges: navEdges || [],
        rooms: rooms || [],
        mapStyle: mapStyle || null,
    };
}
