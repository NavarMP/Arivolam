"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    X, Save, Trash2, DoorOpen, GraduationCap, FlaskConical,
    Library, Briefcase, Users, Mic, ShowerHead, Utensils,
    Moon, Package, MonitorPlay, Hash, Accessibility, Clock,
    AlertTriangle,
} from "lucide-react";

// ─── Types ───

export interface RoomData {
    id?: string;
    building_id: string;
    name: string;
    room_number?: string;
    room_type: string;
    capacity?: number;
    description?: string;
    floor_number?: number;
    operating_hours?: string;
    amenities?: string[];
    is_accessible?: boolean;
    latitude?: number;
    longitude?: number;
}

// ─── Room Type Configuration ───

export const ROOM_TYPES = [
    { value: "classroom", label: "Classroom", icon: GraduationCap, color: "#3b82f6" },
    { value: "lab", label: "Lab", icon: FlaskConical, color: "#8b5cf6" },
    { value: "office", label: "Office", icon: Briefcase, color: "#f59e0b" },
    { value: "library", label: "Library", icon: Library, color: "#22c55e" },
    { value: "auditorium", label: "Auditorium", icon: Mic, color: "#f97316" },
    { value: "seminar_hall", label: "Seminar Hall", icon: Users, color: "#ec4899" },
    { value: "restroom", label: "Restroom", icon: ShowerHead, color: "#06b6d4" },
    { value: "canteen", label: "Canteen", icon: Utensils, color: "#d97706" },
    { value: "prayer_room", label: "Prayer Room", icon: Moon, color: "#059669" },
    { value: "storeroom", label: "Storeroom", icon: Package, color: "#64748b" },
    { value: "conference", label: "Conference", icon: MonitorPlay, color: "#6366f1" },
    { value: "common_area", label: "Common Area", icon: Users, color: "#14b8a6" },
    { value: "other", label: "Other", icon: DoorOpen, color: "#94a3b8" },
];

const AMENITY_OPTIONS = [
    "Projector", "Smart Board", "Whiteboard", "AC", "Fan",
    "Wi-Fi", "Power Outlets", "PA System", "CCTV",
    "Computer", "Printer", "Water Dispenser",
];

export function getRoomTypeConfig(type: string) {
    return ROOM_TYPES.find(t => t.value === type) || ROOM_TYPES[ROOM_TYPES.length - 1];
}

// ─── Room Dialog Component ───

interface RoomDialogProps {
    open: boolean;
    room?: RoomData | null;
    buildingId: string;
    buildingName: string;
    floorNumber: number;
    totalFloors: number;
    onSave: (room: RoomData) => void;
    onDelete?: (roomId: string) => void;
    onClose: () => void;
    saving?: boolean;
}

export function RoomDialog({
    open,
    room,
    buildingId,
    buildingName,
    floorNumber,
    totalFloors,
    onSave,
    onDelete,
    onClose,
    saving = false,
}: RoomDialogProps) {
    const isEditing = !!room?.id;

    const [form, setForm] = useState<RoomData>({
        building_id: buildingId,
        name: "",
        room_number: "",
        room_type: "classroom",
        capacity: undefined,
        description: "",
        floor_number: floorNumber,
        operating_hours: "",
        amenities: [],
        is_accessible: false,
    });

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset form when dialog opens or room changes
    useEffect(() => {
        if (open) {
            if (room) {
                setForm({
                    ...room,
                    amenities: room.amenities || [],
                    is_accessible: room.is_accessible ?? false,
                });
            } else {
                setForm({
                    building_id: buildingId,
                    name: "",
                    room_number: "",
                    room_type: "classroom",
                    capacity: undefined,
                    description: "",
                    floor_number: floorNumber,
                    operating_hours: "",
                    amenities: [],
                    is_accessible: false,
                });
            }
            setErrors({});
            setShowDeleteConfirm(false);
        }
    }, [open, room, buildingId, floorNumber]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!form.name.trim()) newErrors.name = "Room name is required";
        if (form.capacity !== undefined && form.capacity < 0) newErrors.capacity = "Capacity must be 0 or more";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        onSave(isEditing ? { ...form, id: room!.id } : form);
    };

    const toggleAmenity = (amenity: string) => {
        setForm(prev => ({
            ...prev,
            amenities: prev.amenities?.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...(prev.amenities || []), amenity],
        }));
    };

    const typeConfig = getRoomTypeConfig(form.room_type);
    const TypeIcon = typeConfig.icon;

    if (!open) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative bg-background rounded-2xl shadow-2xl border w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-9 w-9 items-center justify-center rounded-xl"
                                style={{ backgroundColor: typeConfig.color + "20", color: typeConfig.color }}
                            >
                                <TypeIcon className="h-4.5 w-4.5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base">
                                    {isEditing ? "Edit Room" : "Add New Room"}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {buildingName} · Floor {form.floor_number}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Form */}
                    <ScrollArea className="flex-1 min-h-0">
                        <div className="p-5 space-y-4">
                            {/* Name & Number */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                    <Label className="text-xs font-medium">Room Name *</Label>
                                    <Input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g. BCA Hall, Physics Lab"
                                        className="h-9 mt-1"
                                    />
                                    {errors.name && <p className="text-[11px] text-destructive mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <Label className="text-xs font-medium">Room No.</Label>
                                    <Input
                                        value={form.room_number || ""}
                                        onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                                        placeholder="e.g. 101"
                                        className="h-9 mt-1"
                                    />
                                </div>
                            </div>

                            {/* Type, Floor, Capacity */}
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <Label className="text-xs font-medium">Room Type *</Label>
                                    <Select
                                        value={form.room_type}
                                        onValueChange={(v) => setForm({ ...form, room_type: v })}
                                    >
                                        <SelectTrigger className="h-9 mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROOM_TYPES.map((t) => {
                                                const Icon = t.icon;
                                                return (
                                                    <SelectItem key={t.value} value={t.value}>
                                                        <span className="flex items-center gap-2">
                                                            <span
                                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                                style={{ backgroundColor: t.color }}
                                                            />
                                                            {t.label}
                                                        </span>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs font-medium">Floor *</Label>
                                    <Select
                                        value={String(form.floor_number ?? 0)}
                                        onValueChange={(v) => setForm({ ...form, floor_number: parseInt(v) })}
                                    >
                                        <SelectTrigger className="h-9 mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: totalFloors || 1 }, (_, i) => (
                                                <SelectItem key={i} value={String(i)}>
                                                    {i === 0 ? "Ground Floor" : `Floor ${i}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs font-medium">Capacity</Label>
                                    <Input
                                        type="number"
                                        value={form.capacity ?? ""}
                                        onChange={(e) => setForm({ ...form, capacity: e.target.value ? parseInt(e.target.value) : undefined })}
                                        placeholder="0"
                                        className="h-9 mt-1"
                                        min={0}
                                    />
                                    {errors.capacity && <p className="text-[11px] text-destructive mt-1">{errors.capacity}</p>}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <Label className="text-xs font-medium">Description</Label>
                                <textarea
                                    value={form.description || ""}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full min-h-[70px] rounded-lg border bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring mt-1"
                                    placeholder="Room description, special notes..."
                                />
                            </div>

                            {/* Operating Hours */}
                            <div>
                                <Label className="text-xs font-medium flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                    Operating Hours
                                </Label>
                                <Input
                                    value={form.operating_hours || ""}
                                    onChange={(e) => setForm({ ...form, operating_hours: e.target.value })}
                                    placeholder="e.g. 8:30 AM - 5:00 PM (Mon-Fri)"
                                    className="h-9 mt-1"
                                />
                            </div>

                            {/* Amenities */}
                            <div>
                                <Label className="text-xs font-medium">Amenities</Label>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {AMENITY_OPTIONS.map((amenity) => {
                                        const isSelected = form.amenities?.includes(amenity);
                                        return (
                                            <button
                                                key={amenity}
                                                type="button"
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${isSelected
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:border-muted-foreground/20"
                                                    }`}
                                                onClick={() => toggleAmenity(amenity)}
                                            >
                                                {amenity}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Accessibility */}
                            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
                                <div className="flex items-center gap-2">
                                    <Accessibility className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <Label className="text-xs font-medium">Wheelchair Accessible</Label>
                                        <p className="text-[10px] text-muted-foreground">Room is accessible for wheelchair users</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={form.is_accessible ?? false}
                                    onCheckedChange={(v) => setForm({ ...form, is_accessible: v })}
                                />
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/20">
                        <div>
                            {isEditing && onDelete && (
                                showDeleteConfirm ? (
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-destructive" />
                                        <span className="text-xs text-destructive">Sure?</span>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => onDelete(room!.id!)}
                                            disabled={saving}
                                        >
                                            Delete
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => setShowDeleteConfirm(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                                        onClick={() => setShowDeleteConfirm(true)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete Room
                                    </Button>
                                )
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-8" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button size="sm" className="h-8 gap-1.5" onClick={handleSave} disabled={saving}>
                                <Save className="h-3.5 w-3.5" />
                                {saving ? "Saving..." : isEditing ? "Update Room" : "Add Room"}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
