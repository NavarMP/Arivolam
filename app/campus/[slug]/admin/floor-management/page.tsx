import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getFloorManagementData, saveRoomAction, deleteRoomAction, getFloorPlansAction, saveFloorPlanAction } from "./actions";
import { FloorManager } from "@/components/campus/floor-manager";

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ building?: string }>;
}

export default async function FloorManagementPage({ params, searchParams }: PageProps) {
    const { slug } = await params;
    const { building: buildingId } = await searchParams;

    try {
        const { buildings, rooms, floorPlans } = await getFloorManagementData(slug);

        return (
            <div className="h-[calc(100vh-4rem)] flex flex-col">
                <FloorManager
                    buildings={buildings}
                    rooms={rooms}
                    floorPlans={floorPlans}
                    slug={slug}
                    initialBuildingId={buildingId}
                    onSaveRoom={async (room) => {
                        "use server";
                        return saveRoomAction(slug, room);
                    }}
                    onDeleteRoom={async (roomId) => {
                        "use server";
                        return deleteRoomAction(slug, roomId);
                    }}
                    onLoadFloorPlans={getFloorPlansAction}
                    onSaveFloorPlan={async (plan) => {
                        "use server";
                        return saveFloorPlanAction(plan);
                    }}
                />
            </div>
        );
    } catch (error) {
        console.error("Failed to load floor management data:", error);
        notFound();
    }
}
