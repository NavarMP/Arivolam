import { getPublicMapData } from "./actions";
import { CampusMap } from "@/components/features/campus-map";
import { Metadata } from "next";
import Link from "next/link";
import { MapPin, BookOpen, LogIn } from "lucide-react";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    try {
        const data = await getPublicMapData(slug);
        return {
            title: `Campus Map — ${data.institution.name}`,
            description: `Interactive campus map for ${data.institution.name}. Search buildings, rooms, and get walking directions.`,
        };
    } catch {
        return { title: "Campus Map" };
    }
}

export default async function PublicMapPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ dest?: string }>;
}) {
    const { slug } = await params;
    const { dest } = await searchParams;

    let mapData;
    try {
        mapData = await getPublicMapData(slug);
    } catch {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="text-center space-y-3">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto opacity-30" />
                    <h1 className="text-xl font-bold">Campus Not Found</h1>
                    <p className="text-sm text-muted-foreground">
                        The campus you're looking for doesn't exist or is inactive.
                    </p>
                    <Link
                        href="/campus"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                        Browse campuses →
                    </Link>
                </div>
            </div>
        );
    }

    const { institution, buildings, pois, navNodes, navEdges, mapStyle } = mapData;

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Compact branded header */}
            <header className="flex items-center justify-between px-4 py-2.5 border-b bg-background/95 backdrop-blur-sm z-10 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-sm font-semibold truncate">{institution.name}</h1>
                        <p className="text-[11px] text-muted-foreground">Campus Map</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        href="/campus/guide"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border bg-background hover:bg-muted transition-colors"
                    >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">How to Use</span>
                    </Link>
                    <Link
                        href={`/campus/login`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <LogIn className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Login</span>
                    </Link>
                </div>
            </header>

            {/* Map viewer */}
            <main className="flex-1 min-h-0">
                <div className="h-full p-2 md:p-3">
                    <CampusMap
                        buildings={buildings}
                        pois={pois}
                        navNodes={navNodes}
                        navEdges={navEdges}
                        slug={slug}
                        mapStyle={mapStyle}
                        initialDestination={dest}
                    />
                </div>
            </main>
        </div>
    );
}
