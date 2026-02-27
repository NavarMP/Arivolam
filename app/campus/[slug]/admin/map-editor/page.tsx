import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { MapEditor } from "@/components/campus/map-editor";
import { getMapEditorData } from "./actions";

export default async function MapEditorPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    const erpSession = await getSession();
    if (!user && !erpSession) redirect("/campus/login");

    // Get institution
    const { data: institution } = await supabase
        .from("institutions")
        .select("id, name, slug")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

    if (!institution) redirect("/campus");

    // Verify admin role
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

    if (!isAdmin) redirect(`/campus/${slug}`);

    // Fetch all map data
    let mapData;
    try {
        mapData = await getMapEditorData(slug);
    } catch (err: any) {
        return (
            <div className="p-8 text-center text-destructive flex flex-col items-center gap-4">
                <p>Failed to load map data. Please try again.</p>
                <pre className="text-xs bg-muted/50 p-4 rounded-xl text-left text-foreground font-mono max-w-2xl overflow-auto border">
                    {err?.message || String(err)}
                </pre>
            </div>
        );
    }

    // Determine map center from existing buildings or default
    const mapCenter: [number, number] = mapData.buildings.length > 0
        ? [
            mapData.buildings.reduce((s: number, b: any) => s + b.latitude, 0) / mapData.buildings.length,
            mapData.buildings.reduce((s: number, b: any) => s + b.longitude, 0) / mapData.buildings.length,
        ]
        : mapData.mapStyle
            ? [mapData.mapStyle.center_lat, mapData.mapStyle.center_lng]
            : [11.2274, 75.9104]; // Default: SIAS

    return (
        <div className="p-2 md:p-4">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Campus Map Editor</h1>
                    <p className="text-sm text-muted-foreground">
                        Draw buildings, paths, and navigation routes for {institution.name}
                    </p>
                </div>
            </div>
            <MapEditor
                buildings={mapData.buildings}
                pois={mapData.pois}
                navNodes={mapData.navNodes}
                navEdges={mapData.navEdges}
                mapCenter={mapCenter}
                slug={slug}
            />
        </div>
    );
}
