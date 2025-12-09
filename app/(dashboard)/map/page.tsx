import { CampusMap } from "@/components/features/campus-map";

export default function MapPage() {
    return (
        <div className="flex h-full flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campus Map</h1>
                    <p className="text-muted-foreground">Explore the campus and find your way.</p>
                </div>
            </div>
            <CampusMap />
        </div>
    );
}
