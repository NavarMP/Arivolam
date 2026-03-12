"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Building2, Layers, Plus, Search, DoorOpen, Users, Pencil,
    Trash2, ChevronRight, LayoutGrid, Accessibility, Clock,
    Sparkles, X, Eye,
} from "lucide-react";
import { RoomDialog, ROOM_TYPES, getRoomTypeConfig, type RoomData } from "./room-dialog";
import type { FloorPlan } from "./floor-plan";

const FloorPlanViewer = dynamic(
    () => import("./floor-plan").then((m) => ({ default: m.FloorPlanViewer })),
    { ssr: false, loading: () => <div className="py-8 text-center text-xs text-muted-foreground">Loading viewer...</div> }
);

const FloorPlanEditor = dynamic(
    () => import("./floor-plan").then((m) => ({ default: m.FloorPlanEditor })),
    { ssr: false, loading: () => <div className="fixed inset-0 z-[200] bg-background/80 flex items-center justify-center">Loading editor...</div> }
);

// ─── Types ───

interface BuildingInfo {
    id: string;
    name: string;
    short_name?: string;
    category: string;
    floors: number;
    color: string;
}

interface FloorManagerProps {
    buildings: BuildingInfo[];
    rooms: RoomData[];
    floorPlans: FloorPlan[];
    slug: string;
    initialBuildingId?: string;
    onSaveRoom: (room: RoomData) => Promise<RoomData>;
    onDeleteRoom: (roomId: string) => Promise<void>;
    onLoadFloorPlans: (buildingId: string) => Promise<FloorPlan[]>;
    onSaveFloorPlan: (plan: FloorPlan) => Promise<FloorPlan>;
}

// ─── Floor Manager Component ───

export function FloorManager({
    buildings,
    rooms: initialRooms,
    floorPlans: initialFloorPlans,
    slug,
    initialBuildingId,
    onSaveRoom,
    onDeleteRoom,
    onLoadFloorPlans,
    onSaveFloorPlan,
}: FloorManagerProps) {
    const [selectedBuildingId, setSelectedBuildingId] = useState<string>(
        initialBuildingId || buildings[0]?.id || ""
    );
    const [selectedFloor, setSelectedFloor] = useState<number>(0);
    const [rooms, setRooms] = useState<RoomData[]>(initialRooms);
    const [floorPlans, setFloorPlans] = useState<FloorPlan[]>(initialFloorPlans);
    const [searchQuery, setSearchQuery] = useState("");
    const [saving, setSaving] = useState(false);

    // Room dialog state
    const [roomDialogOpen, setRoomDialogOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<RoomData | null>(null);

    // Floor plan viewer & editor
    const [viewingFloorPlan, setViewingFloorPlan] = useState<FloorPlan | null>(null);
    const [editingFloorPlan, setEditingFloorPlan] = useState<{
        open: boolean;
        buildingId: string;
        floorNumber: number;
        existingPlan?: FloorPlan;
    }>({ open: false, buildingId: "", floorNumber: 0 });

    // Room dialog opened from within editor (on double-click a drawn room)
    const [editorRoomEdit, setEditorRoomEdit] = useState<{
        open: boolean;
        roomData: RoomData | null;
        elementId: string;
    }>({ open: false, roomData: null, elementId: "" });

    const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);
    const totalFloors = selectedBuilding?.floors || 1;

    // ─── Computed data ───

    const buildingRooms = useMemo(() =>
        rooms.filter(r => r.building_id === selectedBuildingId),
        [rooms, selectedBuildingId]
    );

    const floorRooms = useMemo(() =>
        buildingRooms.filter(r => (r.floor_number ?? 0) === selectedFloor),
        [buildingRooms, selectedFloor]
    );

    const floorRoomCounts = useMemo(() => {
        const counts: Record<number, number> = {};
        for (let i = 0; i < totalFloors; i++) {
            counts[i] = buildingRooms.filter(r => (r.floor_number ?? 0) === i).length;
        }
        return counts;
    }, [buildingRooms, totalFloors]);

    const currentFloorPlan = useMemo(() =>
        floorPlans.find(p => p.building_id === selectedBuildingId && p.floor_number === (selectedFloor + 1)),
        [floorPlans, selectedBuildingId, selectedFloor]
    );

    // ─── Search (across all buildings, all floors) ───

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return null;
        const q = searchQuery.toLowerCase().trim();
        return rooms.filter(r => {
            const building = buildings.find(b => b.id === r.building_id);
            const searchableText = [
                r.name,
                r.room_number,
                r.room_type?.replace("_", " "),
                r.description,
                building?.name,
                building?.short_name,
                `floor ${r.floor_number}`,
                ...(r.amenities || []),
            ].filter(Boolean).join(" ").toLowerCase();
            return searchableText.includes(q);
        });
    }, [rooms, buildings, searchQuery]);

    // ─── Handlers ───

    const handleSelectBuilding = useCallback(async (buildingId: string) => {
        setSelectedBuildingId(buildingId);
        setSelectedFloor(0);
        setSearchQuery("");
        try {
            const plans = await onLoadFloorPlans(buildingId);
            setFloorPlans(prev => {
                const other = prev.filter(p => p.building_id !== buildingId);
                return [...other, ...plans];
            });
        } catch (e) {
            console.error("Failed to load floor plans", e);
        }
    }, [onLoadFloorPlans]);

    const handleSaveRoom = useCallback(async (room: RoomData) => {
        setSaving(true);
        try {
            const saved = await onSaveRoom(room);
            setRooms(prev => {
                if (room.id) return prev.map(r => r.id === room.id ? saved : r);
                return [...prev, saved];
            });
            toast.success(room.id ? "Room updated" : "Room added");
            setRoomDialogOpen(false);
            setEditingRoom(null);
        } catch (err: any) {
            toast.error("Failed to save room: " + err.message);
        } finally {
            setSaving(false);
        }
    }, [onSaveRoom]);

    const handleSaveFloorPlan = useCallback(async (plan: FloorPlan) => {
        try {
            const saved = await onSaveFloorPlan(plan);
            setFloorPlans(prev => {
                const existingIndex = prev.findIndex(p => p.id === saved.id || (p.building_id === saved.building_id && p.floor_number === saved.floor_number));
                if (existingIndex >= 0) {
                    const next = [...prev];
                    next[existingIndex] = saved;
                    return next;
                }
                return [...prev, saved];
            });
            toast.success("Floor plan saved successfully");
        } catch (err: any) {
            toast.error("Failed to save floor plan: " + err.message);
            throw err;
        }
    }, [onSaveFloorPlan]);

    const handleDeleteRoom = useCallback(async (roomId: string) => {
        setSaving(true);
        try {
            await onDeleteRoom(roomId);
            setRooms(prev => prev.filter(r => r.id !== roomId));
            toast.success("Room deleted");
            setRoomDialogOpen(false);
            setEditingRoom(null);
        } catch (err: any) {
            toast.error("Failed to delete room: " + err.message);
        } finally {
            setSaving(false);
        }
    }, [onDeleteRoom]);

    // Sync drawn room elements to the DB as RoomData entries
    const handleRoomSync = useCallback(async (drawnRooms: { elementId: string; name: string; roomType: string; capacity: number; floorNumber: number }[]) => {
        for (const dr of drawnRooms) {
            // Check if this room already exists in the local state (match by name + floor + building)
            const existingRoom = rooms.find(
                r => r.building_id === selectedBuildingId
                    && (r.floor_number ?? 0) === dr.floorNumber
                    && r.name === dr.name
            );
            if (existingRoom) continue; // Already synced, skip

            const newRoom: RoomData = {
                building_id: selectedBuildingId,
                name: dr.name,
                room_type: dr.roomType,
                capacity: dr.capacity || undefined,
                floor_number: dr.floorNumber,
            };
            try {
                const saved = await onSaveRoom(newRoom);
                setRooms(prev => [...prev, saved]);
            } catch (err) {
                console.error("Failed to sync room:", dr.name, err);
            }
        }
    }, [selectedBuildingId, rooms, onSaveRoom]);

    // Open full RoomDialog from within the editor (on double-click)
    const handleEditorRoomEdit = useCallback((roomElement: import("./floor-plan").FloorElement) => {
        // Try to find matching DB room
        const matchingRoom = rooms.find(
            r => r.building_id === editingFloorPlan.buildingId
                && (r.floor_number ?? 0) === editingFloorPlan.floorNumber
                && r.name === roomElement.name
        );
        const roomData: RoomData = matchingRoom || {
            building_id: editingFloorPlan.buildingId,
            name: roomElement.name || "New Room",
            room_type: roomElement.roomType || "classroom",
            capacity: roomElement.capacity || undefined,
            floor_number: editingFloorPlan.floorNumber,
        };
        setEditorRoomEdit({ open: true, roomData, elementId: roomElement.id });
    }, [rooms, editingFloorPlan]);

    // Save from the editor's room dialog
    const handleEditorRoomSave = useCallback(async (room: RoomData) => {
        setSaving(true);
        try {
            const saved = await onSaveRoom(room);
            setRooms(prev => {
                if (room.id) return prev.map(r => r.id === room.id ? saved : r);
                return [...prev, saved];
            });
            toast.success(room.id ? "Room updated" : "Room added");
            setEditorRoomEdit({ open: false, roomData: null, elementId: "" });
        } catch (err: any) {
            toast.error("Failed to save room: " + err.message);
        } finally {
            setSaving(false);
        }
    }, [onSaveRoom]);

    const openAddRoom = () => {
        setEditingRoom(null);
        setRoomDialogOpen(true);
    };

    const openEditRoom = (room: RoomData) => {
        setEditingRoom(room);
        setRoomDialogOpen(true);
    };

    // Navigate to a search result
    const navigateToRoom = (room: RoomData) => {
        setSelectedBuildingId(room.building_id);
        setSelectedFloor(room.floor_number ?? 0);
        setSearchQuery("");
        // After a tick, open the edit dialog
        setTimeout(() => openEditRoom(room), 100);
    };

    // ─── Render ───

    return (
        <div className="flex flex-col h-full">
            {/* Top bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Floor Management</h2>
                </div>

                {/* Building Selector */}
                <Select
                    value={selectedBuildingId}
                    onValueChange={handleSelectBuilding}
                >
                    <SelectTrigger className="w-64 h-9">
                        <SelectValue placeholder="Select building..." />
                    </SelectTrigger>
                    <SelectContent>
                        {buildings.map(b => (
                            <SelectItem key={b.id} value={b.id}>
                                <span className="flex items-center gap-2">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: b.color }}
                                    />
                                    {b.name}
                                    <span className="text-muted-foreground text-xs">({b.floors}F)</span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex-1" />

                {/* Global Search */}
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search rooms, classes, labs..."
                        className="pl-9 h-9"
                    />
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                            onClick={() => setSearchQuery("")}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Search Results Overlay */}
            {searchResults && (
                <div className="border-b bg-muted/30 px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">
                            <Sparkles className="h-3.5 w-3.5 inline mr-1.5" />
                            {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"
                        </p>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSearchQuery("")}>
                            Clear Search
                        </Button>
                    </div>
                    <ScrollArea className="max-h-64">
                        <div className="space-y-1">
                            {searchResults.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4 text-center">No rooms found matching your search.</p>
                            ) : (
                                searchResults.map(room => {
                                    const building = buildings.find(b => b.id === room.building_id);
                                    const typeConfig = getRoomTypeConfig(room.room_type);
                                    return (
                                        <button
                                            key={room.id}
                                            className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                                            onClick={() => navigateToRoom(room)}
                                        >
                                            <span
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ backgroundColor: typeConfig.color }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {room.room_number && <span className="text-muted-foreground">{room.room_number} · </span>}
                                                    {room.name}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground truncate">
                                                    {building?.name} · Floor {room.floor_number ?? 0} · {typeConfig.label}
                                                    {room.capacity ? ` · ${room.capacity} seats` : ""}
                                                </p>
                                            </div>
                                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </ScrollArea>
                </div>
            )}

            {/* Main content */}
            <div className="flex flex-1 min-h-0">
                {/* Floor sidebar */}
                <div className="w-48 border-r bg-muted/10 flex flex-col">
                    <div className="px-3 py-2 border-b">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Floors
                        </p>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            {Array.from({ length: totalFloors }, (_, i) => {
                                const isActive = selectedFloor === i;
                                const roomCount = floorRoomCounts[i] || 0;
                                const hasPlan = floorPlans.some(p =>
                                    p.building_id === selectedBuildingId && p.floor_number === (i + 1)
                                );
                                return (
                                    <button
                                        key={i}
                                        className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-all ${isActive
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "hover:bg-muted text-foreground"
                                            }`}
                                        onClick={() => setSelectedFloor(i)}
                                    >
                                        <span className="font-medium">
                                            {i === 0 ? "Ground" : `Floor ${i}`}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            {hasPlan && (
                                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-primary-foreground/50" : "bg-green-500"}`} />
                                            )}
                                            <Badge
                                                variant={isActive ? "secondary" : "outline"}
                                                className="text-[10px] px-1.5 py-0 h-5"
                                            >
                                                {roomCount}
                                            </Badge>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>

                {/* Main content area */}
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Floor header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b">
                        <div>
                            <h3 className="font-semibold">
                                {selectedFloor === 0 ? "Ground Floor" : `Floor ${selectedFloor}`}
                                <span className="text-muted-foreground font-normal ml-2">
                                    — {selectedBuilding?.name}
                                </span>
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {floorRooms.length} room{floorRooms.length !== 1 ? "s" : ""}
                                {currentFloorPlan ? " · Floor plan available" : ""}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {currentFloorPlan && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 h-8"
                                    onClick={() => setViewingFloorPlan(currentFloorPlan)}
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                    View Plan
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 h-8"
                                onClick={() => setEditingFloorPlan({
                                    open: true,
                                    buildingId: selectedBuildingId,
                                    floorNumber: selectedFloor + 1,
                                    existingPlan: currentFloorPlan,
                                })}
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                                {currentFloorPlan ? "Edit Floor Plan" : "Create Floor Plan"}
                            </Button>
                            <Button
                                size="sm"
                                className="gap-1.5 h-8"
                                onClick={openAddRoom}
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Add Room
                            </Button>
                        </div>
                    </div>

                    {/* Room grid */}
                    <ScrollArea className="flex-1 min-h-0">
                        <div className="p-5">
                            {floorRooms.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                                        <DoorOpen className="h-7 w-7 text-muted-foreground" />
                                    </div>
                                    <h4 className="font-medium text-sm mb-1">No rooms on this floor</h4>
                                    <p className="text-xs text-muted-foreground mb-4">
                                        Add rooms to organize classrooms, labs, offices, and more.
                                    </p>
                                    <Button size="sm" className="gap-1.5" onClick={openAddRoom}>
                                        <Plus className="h-3.5 w-3.5" />
                                        Add First Room
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                    <AnimatePresence mode="popLayout">
                                        {floorRooms.map((room) => {
                                            const typeConfig = getRoomTypeConfig(room.room_type);
                                            const TypeIcon = typeConfig.icon;
                                            return (
                                                <motion.div
                                                    key={room.id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="group rounded-xl border bg-card hover:shadow-md transition-all cursor-pointer overflow-hidden"
                                                    onClick={() => openEditRoom(room)}
                                                >
                                                    {/* Color band */}
                                                    <div
                                                        className="h-1.5"
                                                        style={{ backgroundColor: typeConfig.color }}
                                                    />
                                                    <div className="p-3.5">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div
                                                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                                                    style={{
                                                                        backgroundColor: typeConfig.color + "15",
                                                                        color: typeConfig.color,
                                                                    }}
                                                                >
                                                                    <TypeIcon className="h-4 w-4" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-semibold truncate">
                                                                        {room.name}
                                                                    </p>
                                                                    <p className="text-[11px] text-muted-foreground">
                                                                        {room.room_number && `${room.room_number} · `}
                                                                        {typeConfig.label}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openEditRoom(room);
                                                                }}
                                                            >
                                                                <Pencil className="h-3 w-3" />
                                                            </Button>
                                                        </div>

                                                        {/* Meta info */}
                                                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                                            {room.capacity && (
                                                                <span className="flex items-center gap-1">
                                                                    <Users className="h-3 w-3" />
                                                                    {room.capacity}
                                                                </span>
                                                            )}
                                                            {room.is_accessible && (
                                                                <span className="flex items-center gap-1">
                                                                    <Accessibility className="h-3 w-3" />
                                                                    Accessible
                                                                </span>
                                                            )}
                                                            {room.operating_hours && (
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {room.operating_hours.length > 15
                                                                        ? room.operating_hours.slice(0, 15) + "…"
                                                                        : room.operating_hours
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Amenity badges */}
                                                        {room.amenities && room.amenities.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {room.amenities.slice(0, 3).map(a => (
                                                                    <Badge
                                                                        key={a}
                                                                        variant="secondary"
                                                                        className="text-[9px] px-1.5 py-0 h-4"
                                                                    >
                                                                        {a}
                                                                    </Badge>
                                                                ))}
                                                                {room.amenities.length > 3 && (
                                                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                                                                        +{room.amenities.length - 3}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* Room Dialog */}
            <RoomDialog
                open={roomDialogOpen}
                room={editingRoom}
                buildingId={selectedBuildingId}
                buildingName={selectedBuilding?.name || "Building"}
                floorNumber={selectedFloor}
                totalFloors={totalFloors}
                onSave={handleSaveRoom}
                onDelete={handleDeleteRoom}
                onClose={() => { setRoomDialogOpen(false); setEditingRoom(null); }}
                saving={saving}
            />

            {/* Floor Plan Viewer */}
            {viewingFloorPlan && (
                <FloorPlanViewer
                    floorPlan={viewingFloorPlan}
                    onClose={() => setViewingFloorPlan(null)}
                />
            )}

            {/* Floor Plan Editor Overlay */}
            {editingFloorPlan.open && (
                <div className="fixed inset-0 z-[200] bg-background">
                    <FloorPlanEditor
                        buildingId={editingFloorPlan.buildingId}
                        floorNumber={editingFloorPlan.floorNumber}
                        existingPlan={editingFloorPlan.existingPlan}
                        onSave={handleSaveFloorPlan}
                        onClose={() => setEditingFloorPlan({ open: false, buildingId: "", floorNumber: 0 })}
                        onRoomSync={handleRoomSync}
                        onRoomEdit={handleEditorRoomEdit}
                    />
                </div>
            )}

            {/* Room Dialog opened from within Floor Plan Editor (double-click a room) */}
            <RoomDialog
                open={editorRoomEdit.open}
                room={editorRoomEdit.roomData}
                buildingId={editingFloorPlan.buildingId || selectedBuildingId}
                buildingName={selectedBuilding?.name || "Building"}
                floorNumber={editingFloorPlan.floorNumber || selectedFloor}
                totalFloors={totalFloors}
                onSave={handleEditorRoomSave}
                onDelete={handleDeleteRoom}
                onClose={() => setEditorRoomEdit({ open: false, roomData: null, elementId: "" })}
                saving={saving}
            />
        </div>
    );
}
