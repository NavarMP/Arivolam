import { createClient } from "@/utils/supabase/server";
import { CampusMap } from "@/components/features/campus-map";

export default async function MapPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const supabase = await createClient();

    // Get institution
    const { data: institution } = await supabase
        .from("institutions")
        .select("id")
        .eq("slug", slug)
        .single();

    if (!institution) {
        return (
            <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
                <p className="text-muted-foreground">Institution not found</p>
            </div>
        );
    }

    // Fetch buildings with rooms
    const { data: buildings } = await supabase
        .from("campus_buildings")
        .select(`
            id, name, short_name, description, category, floors,
            latitude, longitude, geo_polygon, icon, color,
            operating_hours, sort_order, label_visible_zoom, show_polygon,
            canvas_x, canvas_y, canvas_w, canvas_h,
            campus_rooms (
                id, building_id, name, room_number, room_type, capacity,
                description, latitude, longitude
            )
        `)
        .eq("institution_id", institution.id)
        .eq("is_active", true)
        .order("sort_order");

    // Fetch POIs
    const { data: pois } = await supabase
        .from("campus_pois")
        .select("id, name, category, description, icon, latitude, longitude, building_id, canvas_x, canvas_y")
        .eq("institution_id", institution.id)
        .eq("is_active", true);

    // Fetch navigation graph
    const { data: navNodes } = await supabase
        .from("campus_nav_nodes")
        .select("id, latitude, longitude, node_type, label, building_id, canvas_x, canvas_y")
        .eq("institution_id", institution.id);

    const { data: navEdges } = await supabase
        .from("campus_nav_edges")
        .select("id, from_node_id, to_node_id, weight");

    const { data: mapStyle } = await supabase
        .from("campus_map_styles")
        .select("*")
        .eq("institution_id", institution.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

    // Transform buildings to include rooms as nested property
    const buildingsWithRooms = buildings?.map((b: any) => ({
        ...b,
        rooms: b.campus_rooms || [],
    }));

    return (
        <div className="p-2 md:p-4">
            <CampusMap
                buildings={buildingsWithRooms || undefined}
                pois={pois || undefined}
                navNodes={navNodes || undefined}
                navEdges={navEdges || undefined}
                slug={slug}
                mapStyle={mapStyle || undefined}
            />
        </div>
    );
}
