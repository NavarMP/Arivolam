"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    X, Save, Trash2, MapPin, Building2, GraduationCap,
    FlaskConical, Library, BedDouble, Moon, Utensils,
    Trophy, LogIn, Car, Landmark, Droplets, Wifi, Heart,
    Coffee, Bus, Dumbbell, Star, Flag, Compass, Layers,
    Plus, ChevronDown, ChevronUp, DoorOpen, Pencil,
} from "lucide-react";

// ─── Types ───

export interface BuildingData {
    id?: string;
    name: string;
    short_name: string;
    description: string;
    category: string;
    floors: number;
    latitude: number;
    longitude: number;
    geo_polygon?: any;
    icon: string;
    color: string;
    operating_hours: string;
    sort_order: number;
    label_visible_zoom: number;
    show_polygon: boolean;
    // Canvas positioning
    cx?: number;
    cy?: number;
    cw?: number;
    ch?: number;
}

export interface POIData {
    id?: string;
    name: string;
    category: string;
    description: string;
    icon: string;
    latitude: number;
    longitude: number;
    building_id: string;
    cx?: number;
    cy?: number;
}

export interface NavNodeData {
    id?: string;
    latitude: number;
    longitude: number;
    node_type: string;
    label: string;
    building_id: string;
    cx?: number;
    cy?: number;
}

export type SelectedItem =
    | { type: "building"; data: BuildingData }
    | { type: "poi"; data: POIData }
    | { type: "navnode"; data: NavNodeData }
    | null;

interface MapPropertyPanelProps {
    selectedItem: SelectedItem;
    onUpdate: (item: SelectedItem) => void;
    onSave: () => void;
    onDelete: () => void;
    onClose: () => void;
    onManageFloors?: () => void;
    saving: boolean;
    // Room management
    rooms?: RoomData[];
    onSaveRoom?: (room: RoomData) => void;
    onDeleteRoom?: (roomId: string) => void;
}

const BUILDING_CATEGORIES = [
    { value: "academic", label: "Academic" },
    { value: "administrative", label: "Administrative" },
    { value: "facility", label: "Facility" },
    { value: "hostel", label: "Hostel" },
    { value: "recreation", label: "Recreation" },
    { value: "religious", label: "Religious" },
    { value: "food", label: "Food & Dining" },
    { value: "transport", label: "Transport" },
    { value: "medical", label: "Medical" },
    { value: "residential", label: "Residential" },
];

const POI_CATEGORIES = [
    { value: "entrance", label: "Entrance/Gate" },
    { value: "parking", label: "Parking" },
    { value: "atm", label: "ATM" },
    { value: "amenity", label: "Amenity" },
    { value: "health", label: "Health" },
    { value: "food", label: "Food" },
    { value: "transport", label: "Transport" },
    { value: "sports", label: "Sports" },
    { value: "emergency", label: "Emergency" },
    { value: "other", label: "Other" },
];

const NAV_NODE_TYPES = [
    { value: "waypoint", label: "Waypoint" },
    { value: "entrance", label: "Entrance" },
    { value: "junction", label: "Junction" },
    { value: "staircase", label: "Staircase" },
    { value: "elevator", label: "Elevator" },
    { value: "door", label: "Door" },
    { value: "poi", label: "POI Node" },
];

interface RoomData {
    id?: string;
    building_id: string;
    name: string;
    room_number?: string;
    room_type: string;
    capacity?: number;
    description?: string;
    floor_number?: number;
}

const ROOM_TYPES = [
    { value: "classroom", label: "Classroom" },
    { value: "lab", label: "Lab" },
    { value: "office", label: "Office" },
    { value: "library", label: "Library" },
    { value: "auditorium", label: "Auditorium" },
    { value: "seminar_hall", label: "Seminar Hall" },
    { value: "restroom", label: "Restroom" },
    { value: "canteen", label: "Canteen" },
    { value: "prayer_room", label: "Prayer Room" },
    { value: "storeroom", label: "Storeroom" },
    { value: "conference", label: "Conference" },
    { value: "common_area", label: "Common Area" },
    { value: "other", label: "Other" },
];

const COLOR_PRESETS = [
    "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
    "#ec4899", "#06b6d4", "#d97706", "#059669", "#dc2626",
    "#6366f1", "#14b8a6", "#f97316", "#a855f7", "#0ea5e9",
    "#84cc16",
];

const ICON_OPTIONS: { value: string; label: string; icon: typeof Building2 }[] = [
    { value: "school", label: "School", icon: GraduationCap },
    { value: "flask-conical", label: "Science", icon: FlaskConical },
    { value: "library", label: "Library", icon: Library },
    { value: "building-2", label: "Building", icon: Building2 },
    { value: "bed-double", label: "Hostel", icon: BedDouble },
    { value: "moon", label: "Religious", icon: Moon },
    { value: "utensils", label: "Dining", icon: Utensils },
    { value: "trophy", label: "Sports", icon: Trophy },
    { value: "log-in", label: "Entrance", icon: LogIn },
    { value: "car", label: "Parking", icon: Car },
    { value: "landmark", label: "Landmark", icon: Landmark },
    { value: "droplets", label: "Water", icon: Droplets },
    { value: "wifi", label: "Wi-Fi", icon: Wifi },
    { value: "heart-pulse", label: "Health", icon: Heart },
    { value: "coffee", label: "Cafe", icon: Coffee },
    { value: "bus", label: "Transport", icon: Bus },
    { value: "map-pin", label: "Pin", icon: MapPin },
    { value: "dumbbell", label: "Gym", icon: Dumbbell },
    { value: "star", label: "Star", icon: Star },
    { value: "flag", label: "Flag", icon: Flag },
];

// ─── Component ───

export function MapPropertyPanel({
    selectedItem,
    onUpdate,
    onSave,
    onDelete,
    onClose,
    onManageFloors,
    saving,
    rooms,
    onSaveRoom,
    onDeleteRoom,
}: MapPropertyPanelProps) {
    const [showRoomForm, setShowRoomForm] = useState(false);
    const [editingRoom, setEditingRoom] = useState<RoomData | null>(null);
    const [roomForm, setRoomForm] = useState<RoomData>({
        building_id: "",
        name: "",
        room_number: "",
        room_type: "classroom",
        capacity: undefined,
        description: "",
        floor_number: 0,
    });
    const [expandedFloor, setExpandedFloor] = useState<number | null>(null);
    if (!selectedItem) return null;

    const updateField = (field: string, value: any) => {
        onUpdate({
            ...selectedItem,
            data: { ...selectedItem.data, [field]: value },
        } as SelectedItem);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute right-0 top-0 bottom-0 z-[1002] w-72 border-l bg-background/95 backdrop-blur-sm shadow-2xl flex flex-col"
            >
                <ScrollArea className="flex-1 min-h-0">
                    <div className="p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="capitalize text-xs">
                                    {selectedItem.type === "navnode" ? "Nav Node" : selectedItem.type}
                                </Badge>
                                {selectedItem.data.id && (
                                    <Badge variant="secondary" className="text-[10px] font-mono">
                                        {selectedItem.data.id.slice(0, 8)}
                                    </Badge>
                                )}
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* ── Building Properties ── */}
                        {selectedItem.type === "building" && (
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-xs">Building Name *</Label>
                                    <Input
                                        value={selectedItem.data.name}
                                        onChange={(e) => updateField("name", e.target.value)}
                                        placeholder="e.g. Main Academic Block"
                                        className="h-8 text-sm"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs">Short Name</Label>
                                    <Input
                                        value={selectedItem.data.short_name}
                                        onChange={(e) => updateField("short_name", e.target.value)}
                                        placeholder="e.g. Main Block"
                                        className="h-8 text-sm"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs">Category</Label>
                                    <Select
                                        value={selectedItem.data.category}
                                        onValueChange={(v) => updateField("category", v)}
                                    >
                                        <SelectTrigger className="h-8 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {BUILDING_CATEGORIES.map((c) => (
                                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-xs">Floors</Label>
                                        <Input
                                            type="number"
                                            value={selectedItem.data.floors}
                                            onChange={(e) => updateField("floors", parseInt(e.target.value) || 1)}
                                            className="h-8 text-sm"
                                            min={1}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Sort Order</Label>
                                        <Input
                                            type="number"
                                            value={selectedItem.data.sort_order}
                                            onChange={(e) => updateField("sort_order", parseInt(e.target.value) || 0)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Color picker */}
                                <div>
                                    <Label className="text-xs">Color</Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {COLOR_PRESETS.map((c) => (
                                            <button
                                                key={c}
                                                className={`w-6 h-6 rounded-md border-2 transition-all ${selectedItem.data.color === c
                                                    ? "border-foreground scale-110"
                                                    : "border-transparent hover:border-muted-foreground/30"
                                                    }`}
                                                style={{ backgroundColor: c }}
                                                onClick={() => updateField("color", c)}
                                            />
                                        ))}
                                    </div>
                                    <Input
                                        value={selectedItem.data.color}
                                        onChange={(e) => updateField("color", e.target.value)}
                                        className="h-7 text-xs font-mono mt-1"
                                        placeholder="#hex"
                                    />
                                </div>

                                {/* Icon picker */}
                                <div>
                                    <Label className="text-xs">Icon</Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {ICON_OPTIONS.map((opt) => {
                                            const Icon = opt.icon;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    className={`w-7 h-7 rounded-md flex items-center justify-center ${selectedItem.data.icon === opt.value
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted/50 hover:bg-muted text-muted-foreground"
                                                        }`}
                                                    title={opt.label}
                                                    onClick={() => updateField("icon", opt.value)}
                                                >
                                                    <Icon className="h-3.5 w-3.5" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs">Description</Label>
                                    <textarea
                                        value={selectedItem.data.description}
                                        onChange={(e) => updateField("description", e.target.value)}
                                        className="w-full min-h-[60px] rounded-md border bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                                        placeholder="Building description..."
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs">Operating Hours</Label>
                                    <Input
                                        value={selectedItem.data.operating_hours}
                                        onChange={(e) => updateField("operating_hours", e.target.value)}
                                        placeholder="e.g. 8:30 AM - 5:00 PM"
                                        className="h-8 text-sm"
                                    />
                                </div>

                                {/* GPS Coordinates */}
                                <div className="rounded-lg border p-2 bg-muted/20">
                                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">GPS Coordinates (for navigation)</Label>
                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                        <div>
                                            <Label className="text-[10px]">Latitude</Label>
                                            <Input
                                                type="number"
                                                step="0.00001"
                                                value={selectedItem.data.latitude}
                                                onChange={(e) => updateField("latitude", parseFloat(e.target.value) || 0)}
                                                className="h-7 text-xs font-mono"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[10px]">Longitude</Label>
                                            <Input
                                                type="number"
                                                step="0.00001"
                                                value={selectedItem.data.longitude}
                                                onChange={(e) => updateField("longitude", parseFloat(e.target.value) || 0)}
                                                className="h-7 text-xs font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Manage Floors Button */}
                                {onManageFloors && selectedItem.data.id && (
                                    <div className="pt-2">
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            className="flex w-full items-center justify-center gap-2 rounded-md border border-primary/20 hover:border-primary/50 bg-transparent px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                                            onClick={onManageFloors}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    onManageFloors();
                                                }
                                            }}
                                        >
                                            <Layers className="h-4 w-4 text-primary" />
                                            Manage Floor Plans
                                        </div>
                                    </div>
                                )}

                                {/* ── Room Management Section ── */}
                                {selectedItem.data.id && onSaveRoom && (
                                    <div className="pt-3 border-t mt-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-xs font-semibold flex items-center gap-1.5">
                                                <DoorOpen className="h-3.5 w-3.5 text-primary" />
                                                Rooms ({rooms?.filter(r => r.building_id === selectedItem.data.id).length || 0})
                                            </Label>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => {
                                                    setEditingRoom(null);
                                                    setRoomForm({
                                                        building_id: selectedItem.data.id!,
                                                        name: "",
                                                        room_number: "",
                                                        room_type: "classroom",
                                                        capacity: undefined,
                                                        description: "",
                                                        floor_number: 0,
                                                    });
                                                    setShowRoomForm(true);
                                                }}
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>

                                        {/* Room form */}
                                        {showRoomForm && (
                                            <div className="space-y-2 rounded-lg border p-2.5 bg-muted/20 mb-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <Label className="text-[10px]">Room Name *</Label>
                                                        <Input
                                                            value={roomForm.name}
                                                            onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                                                            placeholder="e.g. BCA Hall"
                                                            className="h-7 text-xs"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px]">Room No.</Label>
                                                        <Input
                                                            value={roomForm.room_number || ""}
                                                            onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })}
                                                            placeholder="e.g. 101"
                                                            className="h-7 text-xs"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <Label className="text-[10px]">Type</Label>
                                                        <Select
                                                            value={roomForm.room_type}
                                                            onValueChange={(v) => setRoomForm({ ...roomForm, room_type: v })}
                                                        >
                                                            <SelectTrigger className="h-7 text-[10px]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {ROOM_TYPES.map((t) => (
                                                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px]">Floor</Label>
                                                        <Input
                                                            type="number"
                                                            value={roomForm.floor_number ?? 0}
                                                            onChange={(e) => setRoomForm({ ...roomForm, floor_number: parseInt(e.target.value) || 0 })}
                                                            className="h-7 text-xs"
                                                            min={0}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px]">Capacity</Label>
                                                        <Input
                                                            type="number"
                                                            value={roomForm.capacity || ""}
                                                            onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) || undefined })}
                                                            className="h-7 text-xs"
                                                            min={1}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5 pt-1">
                                                    <Button
                                                        size="sm"
                                                        className="h-7 text-xs flex-1"
                                                        onClick={() => {
                                                            if (!roomForm.name.trim()) return;
                                                            onSaveRoom(editingRoom ? { ...roomForm, id: editingRoom.id } : roomForm);
                                                            setShowRoomForm(false);
                                                            setEditingRoom(null);
                                                        }}
                                                    >
                                                        {editingRoom ? "Update" : "Add Room"}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-xs"
                                                        onClick={() => { setShowRoomForm(false); setEditingRoom(null); }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Room list grouped by floor */}
                                        {(() => {
                                            const buildingRooms = (rooms || []).filter(r => r.building_id === selectedItem.data.id);
                                            const floorGroups = new Map<number, RoomData[]>();
                                            buildingRooms.forEach(r => {
                                                const f = r.floor_number ?? 0;
                                                if (!floorGroups.has(f)) floorGroups.set(f, []);
                                                floorGroups.get(f)!.push(r);
                                            });
                                            const sortedFloors = [...floorGroups.entries()].sort((a, b) => a[0] - b[0]);

                                            if (buildingRooms.length === 0) {
                                                return (
                                                    <p className="text-xs text-muted-foreground text-center py-2">No rooms added yet</p>
                                                );
                                            }

                                            return sortedFloors.map(([floor, floorRooms]) => (
                                                <div key={floor} className="mb-1">
                                                    <button
                                                        className="flex items-center justify-between w-full text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 py-1 hover:text-foreground transition-colors"
                                                        onClick={() => setExpandedFloor(expandedFloor === floor ? null : floor)}
                                                    >
                                                        <span>Floor {floor} ({floorRooms.length})</span>
                                                        {expandedFloor === floor ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                                    </button>
                                                    {expandedFloor === floor && (
                                                        <div className="space-y-1 pl-1">
                                                            {floorRooms.map(room => (
                                                                <div key={room.id} className="flex items-center gap-1.5 rounded-md border px-2 py-1.5 bg-muted/20 group">
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-xs font-medium truncate">
                                                                            {room.room_number && <span className="text-muted-foreground">{room.room_number} · </span>}
                                                                            {room.name}
                                                                        </p>
                                                                        <p className="text-[10px] text-muted-foreground capitalize">{room.room_type.replace("_", " ")}{room.capacity ? ` · ${room.capacity} seats` : ""}</p>
                                                                    </div>
                                                                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-5 w-5"
                                                                            onClick={() => {
                                                                                setEditingRoom(room);
                                                                                setRoomForm({ ...room });
                                                                                setShowRoomForm(true);
                                                                            }}
                                                                        >
                                                                            <Pencil className="h-2.5 w-2.5" />
                                                                        </Button>
                                                                        {onDeleteRoom && room.id && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-5 w-5 text-destructive"
                                                                                onClick={() => onDeleteRoom(room.id!)}
                                                                            >
                                                                                <Trash2 className="h-2.5 w-2.5" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── POI Properties ── */}
                        {selectedItem.type === "poi" && (
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-xs">POI Name *</Label>
                                    <Input
                                        value={selectedItem.data.name}
                                        onChange={(e) => updateField("name", e.target.value)}
                                        placeholder="e.g. Main Entrance"
                                        className="h-8 text-sm"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs">Category</Label>
                                    <Select
                                        value={selectedItem.data.category}
                                        onValueChange={(v) => updateField("category", v)}
                                    >
                                        <SelectTrigger className="h-8 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {POI_CATEGORIES.map((c) => (
                                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Icon picker */}
                                <div>
                                    <Label className="text-xs">Icon</Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {ICON_OPTIONS.map((opt) => {
                                            const Icon = opt.icon;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    className={`w-7 h-7 rounded-md flex items-center justify-center ${selectedItem.data.icon === opt.value
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted/50 hover:bg-muted text-muted-foreground"
                                                        }`}
                                                    title={opt.label}
                                                    onClick={() => updateField("icon", opt.value)}
                                                >
                                                    <Icon className="h-3.5 w-3.5" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs">Description</Label>
                                    <textarea
                                        value={selectedItem.data.description}
                                        onChange={(e) => updateField("description", e.target.value)}
                                        className="w-full min-h-[60px] rounded-md border bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                                        placeholder="POI description..."
                                    />
                                </div>

                                {/* GPS */}
                                <div className="rounded-lg border p-2 bg-muted/20">
                                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">GPS Coordinates</Label>
                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                        <div>
                                            <Label className="text-[10px]">Lat</Label>
                                            <Input
                                                type="number"
                                                step="0.00001"
                                                value={selectedItem.data.latitude}
                                                onChange={(e) => updateField("latitude", parseFloat(e.target.value) || 0)}
                                                className="h-7 text-xs font-mono"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[10px]">Lng</Label>
                                            <Input
                                                type="number"
                                                step="0.00001"
                                                value={selectedItem.data.longitude}
                                                onChange={(e) => updateField("longitude", parseFloat(e.target.value) || 0)}
                                                className="h-7 text-xs font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Nav Node Properties ── */}
                        {selectedItem.type === "navnode" && (
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-xs">Label</Label>
                                    <Input
                                        value={selectedItem.data.label}
                                        onChange={(e) => updateField("label", e.target.value)}
                                        placeholder="e.g. Main Gate"
                                        className="h-8 text-sm"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs">Node Type</Label>
                                    <Select
                                        value={selectedItem.data.node_type}
                                        onValueChange={(v) => updateField("node_type", v)}
                                    >
                                        <SelectTrigger className="h-8 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {NAV_NODE_TYPES.map((t) => (
                                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* GPS */}
                                <div className="rounded-lg border p-2 bg-muted/20">
                                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">GPS Coordinates</Label>
                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                        <div>
                                            <Label className="text-[10px]">Lat</Label>
                                            <Input
                                                type="number"
                                                step="0.00001"
                                                value={selectedItem.data.latitude}
                                                onChange={(e) => updateField("latitude", parseFloat(e.target.value) || 0)}
                                                className="h-7 text-xs font-mono"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[10px]">Lng</Label>
                                            <Input
                                                type="number"
                                                step="0.00001"
                                                value={selectedItem.data.longitude}
                                                onChange={(e) => updateField("longitude", parseFloat(e.target.value) || 0)}
                                                className="h-7 text-xs font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 mt-5 pt-4 border-t">
                            <Button
                                className="flex-1 gap-1.5"
                                onClick={onSave}
                                disabled={saving}
                                size="sm"
                            >
                                <Save className="h-3.5 w-3.5" />
                                {saving ? "Saving..." : "Save"}
                            </Button>
                            {selectedItem.data.id && (
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    onClick={onDelete}
                                    disabled={saving}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </motion.div>
        </AnimatePresence >
    );
}
