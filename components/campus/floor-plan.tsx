"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, ZoomIn, ZoomOut, RotateCcw, Save, Plus, Trash2,
    Square, Circle, Type, Move, MousePointer2, DoorOpen,
    Armchair, MonitorSmartphone, BookOpen,
} from "lucide-react";

// Dynamic import react-konva (canvas library, needs browser)
const Stage = dynamic(() => import("react-konva").then((m) => m.Stage), { ssr: false });
const KonvaLayer = dynamic(() => import("react-konva").then((m) => m.Layer), { ssr: false });
const Rect = dynamic(() => import("react-konva").then((m) => m.Rect), { ssr: false });
const KonvaCircle = dynamic(() => import("react-konva").then((m) => m.Circle), { ssr: false });
const Text = dynamic(() => import("react-konva").then((m) => m.Text), { ssr: false });
const Line = dynamic(() => import("react-konva").then((m) => m.Line), { ssr: false });
const Group = dynamic(() => import("react-konva").then((m) => m.Group), { ssr: false });
const KonvaTransformer = dynamic(() => import("react-konva").then((m) => m.Transformer), { ssr: false });

// ─── Types ───

export interface FloorElement {
    id: string;
    type: "room" | "wall" | "door" | "furniture" | "label" | "staircase" | "elevator";
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    rotation?: number;
    fill?: string;
    stroke?: string;
    text?: string;
    fontSize?: number;
    name?: string;
    roomType?: string;
    capacity?: number;
    points?: number[]; // For walls (line segments)
}

export interface FloorPlan {
    id?: string;
    building_id: string;
    floor_number: number;
    name: string;
    width: number;
    height: number;
    elements: FloorElement[];
    background_image?: string;
}

// ─── Constants ───

type ToolType = "select" | "room" | "wall" | "door" | "furniture" | "label";

const TOOLS: { mode: ToolType; icon: typeof Square; label: string }[] = [
    { mode: "select", icon: MousePointer2, label: "Select / Move" },
    { mode: "room", icon: Square, label: "Draw Room" },
    { mode: "wall", icon: Square, label: "Draw Wall" },
    { mode: "door", icon: DoorOpen, label: "Place Door" },
    { mode: "furniture", icon: Armchair, label: "Place Furniture" },
    { mode: "label", icon: Type, label: "Add Label" },
];

const FURNITURE_PRESETS = [
    { name: "Desk", width: 60, height: 30, fill: "#f59e0b40", stroke: "#f59e0b" },
    { name: "Chair", width: 20, height: 20, fill: "#6366f140", stroke: "#6366f1" },
    { name: "Table", width: 80, height: 40, fill: "#0ea5e940", stroke: "#0ea5e9" },
    { name: "Projector", width: 30, height: 15, fill: "#8b5cf640", stroke: "#8b5cf6" },
    { name: "Whiteboard", width: 100, height: 8, fill: "#f1f5f9", stroke: "#64748b" },
    { name: "Computer", width: 25, height: 25, fill: "#1e293b40", stroke: "#1e293b" },
];

const ROOM_COLORS: Record<string, string> = {
    classroom: "#3b82f620",
    lab: "#8b5cf620",
    office: "#f59e0b20",
    library: "#22c55e20",
    seminar_hall: "#ec489920",
    restroom: "#06b6d420",
    storage: "#64748b20",
    corridor: "#f1f5f9",
};

// ─── Floor Plan Viewer (read-only, for users) ───

interface FloorPlanViewerProps {
    floorPlan: FloorPlan;
    onClose: () => void;
}

export function FloorPlanViewer({ floorPlan, onClose }: FloorPlanViewerProps) {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const newScale = Math.max(0.3, Math.min(3, scale - e.deltaY * 0.001));
        setScale(newScale);
    }, [scale]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
            <div className="relative bg-background rounded-2xl shadow-2xl border w-[90vw] h-[80vh] max-w-4xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div>
                        <h3 className="font-semibold">{floorPlan.name || `Floor ${floorPlan.floor_number}`}</h3>
                        <p className="text-xs text-muted-foreground">
                            {floorPlan.elements.filter((e) => e.type === "room").length} rooms
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale((s) => Math.min(3, s + 0.2))}>
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Badge variant="outline" className="text-xs">{Math.round(scale * 100)}%</Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale((s) => Math.max(0.3, s - 0.2))}>
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}>
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Canvas */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-hidden bg-muted/30"
                    style={{ height: "calc(100% - 52px)" }}
                    onWheel={handleWheel}
                >
                    <Stage
                        width={containerRef.current?.clientWidth || 800}
                        height={containerRef.current?.clientHeight || 600}
                        scaleX={scale}
                        scaleY={scale}
                        x={offset.x}
                        y={offset.y}
                        draggable
                        onDragEnd={(e) => {
                            setOffset({ x: e.target.x(), y: e.target.y() });
                        }}
                    >
                        <KonvaLayer>
                            {/* Grid */}
                            {Array.from({ length: Math.ceil(floorPlan.width / 50) + 1 }).map((_, i) => (
                                <Line
                                    key={`gv-${i}`}
                                    points={[i * 50, 0, i * 50, floorPlan.height]}
                                    stroke="#e2e8f0"
                                    strokeWidth={0.5}
                                />
                            ))}
                            {Array.from({ length: Math.ceil(floorPlan.height / 50) + 1 }).map((_, i) => (
                                <Line
                                    key={`gh-${i}`}
                                    points={[0, i * 50, floorPlan.width, i * 50]}
                                    stroke="#e2e8f0"
                                    strokeWidth={0.5}
                                />
                            ))}

                            {/* Elements */}
                            {floorPlan.elements.map((el) => {
                                switch (el.type) {
                                    case "room":
                                        return (
                                            <Group key={el.id}>
                                                <Rect
                                                    x={el.x}
                                                    y={el.y}
                                                    width={el.width || 100}
                                                    height={el.height || 80}
                                                    fill={el.fill || ROOM_COLORS[el.roomType || "classroom"]}
                                                    stroke={el.stroke || "#94a3b8"}
                                                    strokeWidth={1.5}
                                                    cornerRadius={2}
                                                />
                                                {el.name && (
                                                    <Text
                                                        x={el.x + 4}
                                                        y={el.y + 4}
                                                        text={el.name}
                                                        fontSize={11}
                                                        fontStyle="bold"
                                                        fill="#1e293b"
                                                        width={(el.width || 100) - 8}
                                                    />
                                                )}
                                                {el.capacity && (
                                                    <Text
                                                        x={el.x + 4}
                                                        y={el.y + (el.height || 80) - 16}
                                                        text={`${el.capacity} seats`}
                                                        fontSize={9}
                                                        fill="#64748b"
                                                    />
                                                )}
                                            </Group>
                                        );
                                    case "wall":
                                        return (
                                            <Line
                                                key={el.id}
                                                points={el.points || [el.x, el.y, el.x + (el.width || 100), el.y]}
                                                stroke={el.stroke || "#334155"}
                                                strokeWidth={4}
                                                lineCap="round"
                                            />
                                        );
                                    case "door":
                                        return (
                                            <Group key={el.id}>
                                                <Rect
                                                    x={el.x}
                                                    y={el.y}
                                                    width={el.width || 30}
                                                    height={el.height || 6}
                                                    fill="#f1f5f9"
                                                    stroke="#94a3b8"
                                                    strokeWidth={1}
                                                    cornerRadius={1}
                                                />
                                            </Group>
                                        );
                                    case "furniture":
                                        return (
                                            <Rect
                                                key={el.id}
                                                x={el.x}
                                                y={el.y}
                                                width={el.width || 40}
                                                height={el.height || 30}
                                                fill={el.fill || "#f59e0b20"}
                                                stroke={el.stroke || "#f59e0b"}
                                                strokeWidth={1}
                                                cornerRadius={3}
                                                rotation={el.rotation || 0}
                                            />
                                        );
                                    case "label":
                                        return (
                                            <Text
                                                key={el.id}
                                                x={el.x}
                                                y={el.y}
                                                text={el.text || "Label"}
                                                fontSize={el.fontSize || 14}
                                                fontStyle="bold"
                                                fill={el.fill || "#1e293b"}
                                            />
                                        );
                                    default:
                                        return null;
                                }
                            })}
                        </KonvaLayer>
                    </Stage>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Floor Plan Editor (admin) ───

interface FloorPlanEditorProps {
    initialFloorPlan?: FloorPlan;
    buildingId: string;
    floorNumber: number;
    buildingName: string;
    onSave: (plan: FloorPlan) => void;
    onClose: () => void;
}

export function FloorPlanEditor({
    initialFloorPlan,
    buildingId,
    floorNumber,
    buildingName,
    onSave,
    onClose,
}: FloorPlanEditorProps) {
    const [elements, setElements] = useState<FloorElement[]>(initialFloorPlan?.elements || []);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [tool, setTool] = useState<ToolType>("select");
    const [scale, setScale] = useState(1);
    const [planWidth] = useState(initialFloorPlan?.width || 800);
    const [planHeight] = useState(initialFloorPlan?.height || 600);
    const [saving, setSaving] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const transformerRef = useRef<any>(null);
    const selectedRef = useRef<any>(null);

    const selectedElement = elements.find((e) => e.id === selectedId);

    const generateId = () => `el_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Handle stage click for creating elements
    const handleStageClick = useCallback((e: any) => {
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        if (!pos) return;

        // Adjust for scale
        const x = pos.x / scale;
        const y = pos.y / scale;

        if (tool === "select") {
            // Deselect if clicking on empty area
            if (e.target === stage || e.target.attrs.name === "background") {
                setSelectedId(null);
            }
            return;
        }

        const newId = generateId();

        if (tool === "room") {
            setElements((prev) => [
                ...prev,
                {
                    id: newId,
                    type: "room",
                    x, y,
                    width: 120,
                    height: 80,
                    fill: ROOM_COLORS.classroom,
                    stroke: "#94a3b8",
                    name: "New Room",
                    roomType: "classroom",
                    capacity: 30,
                },
            ]);
            setSelectedId(newId);
            setTool("select");
        } else if (tool === "door") {
            setElements((prev) => [
                ...prev,
                { id: newId, type: "door", x, y, width: 30, height: 6 },
            ]);
            setSelectedId(newId);
            setTool("select");
        } else if (tool === "furniture") {
            const preset = FURNITURE_PRESETS[0];
            setElements((prev) => [
                ...prev,
                {
                    id: newId,
                    type: "furniture",
                    x, y,
                    width: preset.width,
                    height: preset.height,
                    fill: preset.fill,
                    stroke: preset.stroke,
                    name: preset.name,
                },
            ]);
            setSelectedId(newId);
            setTool("select");
        } else if (tool === "label") {
            setElements((prev) => [
                ...prev,
                {
                    id: newId,
                    type: "label",
                    x, y,
                    text: "Label",
                    fontSize: 14,
                    fill: "#1e293b",
                },
            ]);
            setSelectedId(newId);
            setTool("select");
        }
    }, [tool, scale]);

    const updateElement = (id: string, updates: Partial<FloorElement>) => {
        setElements((prev) =>
            prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
        );
    };

    const deleteElement = (id: string) => {
        setElements((prev) => prev.filter((el) => el.id !== id));
        setSelectedId(null);
    };

    const handleSave = async () => {
        setSaving(true);
        const plan: FloorPlan = {
            id: initialFloorPlan?.id,
            building_id: buildingId,
            floor_number: floorNumber,
            name: `${buildingName} - Floor ${floorNumber}`,
            width: planWidth,
            height: planHeight,
            elements,
        };
        await onSave(plan);
        setSaving(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm"
        >
            <div className="flex flex-1 m-4 rounded-2xl overflow-hidden shadow-2xl border bg-background">
                {/* Left toolbar */}
                <div className="w-14 flex flex-col items-center gap-1 py-3 border-r bg-muted/30">
                    {TOOLS.map((t) => {
                        const Icon = t.icon;
                        const isActive = tool === t.mode;
                        return (
                            <button
                                key={t.mode}
                                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${isActive ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground"}`}
                                onClick={() => setTool(t.mode)}
                                title={t.label}
                            >
                                <Icon className="h-4 w-4" />
                            </button>
                        );
                    })}

                    <div className="flex-1" />

                    {/* Furniture presets */}
                    {tool === "furniture" && (
                        <div className="flex flex-col gap-0.5">
                            {FURNITURE_PRESETS.map((preset, i) => (
                                <button
                                    key={i}
                                    className="flex h-8 w-10 items-center justify-center rounded text-[8px] font-medium hover:bg-muted"
                                    title={preset.name}
                                    onClick={() => {
                                        const newId = generateId();
                                        setElements((prev) => [
                                            ...prev,
                                            {
                                                id: newId,
                                                type: "furniture",
                                                x: planWidth / 2 - preset.width / 2,
                                                y: planHeight / 2 - preset.height / 2,
                                                width: preset.width,
                                                height: preset.height,
                                                fill: preset.fill,
                                                stroke: preset.stroke,
                                                name: preset.name,
                                            },
                                        ]);
                                        setSelectedId(newId);
                                    }}
                                >
                                    <div
                                        className="w-6 h-4 rounded-sm border"
                                        style={{ backgroundColor: preset.fill, borderColor: preset.stroke }}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Canvas area */}
                <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                        <div>
                            <h3 className="font-semibold text-sm">{buildingName} — Floor {floorNumber}</h3>
                            <p className="text-xs text-muted-foreground">{elements.length} elements</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale((s) => Math.min(3, s + 0.2))}>
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                            <Badge variant="outline" className="text-xs">{Math.round(scale * 100)}%</Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale((s) => Math.max(0.3, s - 0.2))}>
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <Button variant="default" size="sm" className="gap-1.5" onClick={handleSave} disabled={saving}>
                                <Save className="h-3.5 w-3.5" />
                                {saving ? "Saving..." : "Save"}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Stage */}
                    <div ref={containerRef} className="flex-1 bg-white overflow-hidden">
                        <Stage
                            width={containerRef.current?.clientWidth || planWidth}
                            height={containerRef.current?.clientHeight || planHeight}
                            scaleX={scale}
                            scaleY={scale}
                            onClick={handleStageClick}
                            onTap={handleStageClick}
                        >
                            <KonvaLayer>
                                {/* Background */}
                                <Rect
                                    name="background"
                                    x={0}
                                    y={0}
                                    width={planWidth}
                                    height={planHeight}
                                    fill="#fafafa"
                                />

                                {/* Grid */}
                                {Array.from({ length: Math.ceil(planWidth / 50) + 1 }).map((_, i) => (
                                    <Line
                                        key={`gv-${i}`}
                                        points={[i * 50, 0, i * 50, planHeight]}
                                        stroke="#e2e8f0"
                                        strokeWidth={0.5}
                                    />
                                ))}
                                {Array.from({ length: Math.ceil(planHeight / 50) + 1 }).map((_, i) => (
                                    <Line
                                        key={`gh-${i}`}
                                        points={[0, i * 50, planWidth, i * 50]}
                                        stroke="#e2e8f0"
                                        strokeWidth={0.5}
                                    />
                                ))}

                                {/* Elements */}
                                {elements.map((el) => {
                                    const isSelected = el.id === selectedId;

                                    switch (el.type) {
                                        case "room":
                                            return (
                                                <Group
                                                    key={el.id}
                                                    draggable={tool === "select"}
                                                    onClick={() => setSelectedId(el.id)}
                                                    onDragEnd={(e) => {
                                                        updateElement(el.id, {
                                                            x: e.target.x(),
                                                            y: e.target.y(),
                                                        });
                                                    }}
                                                >
                                                    <Rect
                                                        x={el.x}
                                                        y={el.y}
                                                        width={el.width || 100}
                                                        height={el.height || 80}
                                                        fill={el.fill || ROOM_COLORS[el.roomType || "classroom"]}
                                                        stroke={isSelected ? "#3b82f6" : (el.stroke || "#94a3b8")}
                                                        strokeWidth={isSelected ? 2 : 1.5}
                                                        cornerRadius={2}
                                                    />
                                                    {el.name && (
                                                        <Text
                                                            x={el.x + 4}
                                                            y={el.y + 4}
                                                            text={el.name}
                                                            fontSize={11}
                                                            fontStyle="bold"
                                                            fill="#1e293b"
                                                            width={(el.width || 100) - 8}
                                                        />
                                                    )}
                                                    {el.capacity && (
                                                        <Text
                                                            x={el.x + 4}
                                                            y={el.y + (el.height || 80) - 16}
                                                            text={`${el.capacity} seats`}
                                                            fontSize={9}
                                                            fill="#64748b"
                                                        />
                                                    )}
                                                </Group>
                                            );
                                        case "door":
                                            return (
                                                <Rect
                                                    key={el.id}
                                                    x={el.x}
                                                    y={el.y}
                                                    width={el.width || 30}
                                                    height={el.height || 6}
                                                    fill={isSelected ? "#bfdbfe" : "#f1f5f9"}
                                                    stroke={isSelected ? "#3b82f6" : "#94a3b8"}
                                                    strokeWidth={1}
                                                    draggable={tool === "select"}
                                                    onClick={() => setSelectedId(el.id)}
                                                    onDragEnd={(e) => updateElement(el.id, { x: e.target.x(), y: e.target.y() })}
                                                />
                                            );
                                        case "furniture":
                                            return (
                                                <Rect
                                                    key={el.id}
                                                    x={el.x}
                                                    y={el.y}
                                                    width={el.width || 40}
                                                    height={el.height || 30}
                                                    fill={el.fill || "#f59e0b20"}
                                                    stroke={isSelected ? "#3b82f6" : (el.stroke || "#f59e0b")}
                                                    strokeWidth={isSelected ? 2 : 1}
                                                    cornerRadius={3}
                                                    rotation={el.rotation || 0}
                                                    draggable={tool === "select"}
                                                    onClick={() => setSelectedId(el.id)}
                                                    onDragEnd={(e) => updateElement(el.id, { x: e.target.x(), y: e.target.y() })}
                                                />
                                            );
                                        case "label":
                                            return (
                                                <Text
                                                    key={el.id}
                                                    x={el.x}
                                                    y={el.y}
                                                    text={el.text || "Label"}
                                                    fontSize={el.fontSize || 14}
                                                    fontStyle="bold"
                                                    fill={isSelected ? "#3b82f6" : (el.fill || "#1e293b")}
                                                    draggable={tool === "select"}
                                                    onClick={() => setSelectedId(el.id)}
                                                    onDragEnd={(e) => updateElement(el.id, { x: e.target.x(), y: e.target.y() })}
                                                />
                                            );
                                        default:
                                            return null;
                                    }
                                })}
                            </KonvaLayer>
                        </Stage>
                    </div>
                </div>

                {/* Right property panel */}
                <AnimatePresence>
                    {selectedElement && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 260, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="border-l bg-muted/20 overflow-hidden"
                        >
                            <ScrollArea className="h-full">
                                <div className="p-4 w-[260px]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-semibold text-sm capitalize">{selectedElement.type}</h4>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => deleteElement(selectedElement.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Name */}
                                        {(selectedElement.type === "room" || selectedElement.type === "furniture") && (
                                            <div>
                                                <Label className="text-xs">Name</Label>
                                                <Input
                                                    value={selectedElement.name || ""}
                                                    onChange={(e) => updateElement(selectedElement.id, { name: e.target.value })}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                        )}

                                        {/* Label text */}
                                        {selectedElement.type === "label" && (
                                            <div>
                                                <Label className="text-xs">Text</Label>
                                                <Input
                                                    value={selectedElement.text || ""}
                                                    onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                        )}

                                        {/* Room type */}
                                        {selectedElement.type === "room" && (
                                            <div>
                                                <Label className="text-xs">Room Type</Label>
                                                <Select
                                                    value={selectedElement.roomType || "classroom"}
                                                    onValueChange={(v) => updateElement(selectedElement.id, {
                                                        roomType: v,
                                                        fill: ROOM_COLORS[v] || ROOM_COLORS.classroom,
                                                    })}
                                                >
                                                    <SelectTrigger className="h-8 text-sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="classroom">Classroom</SelectItem>
                                                        <SelectItem value="lab">Lab</SelectItem>
                                                        <SelectItem value="office">Office</SelectItem>
                                                        <SelectItem value="library">Library</SelectItem>
                                                        <SelectItem value="seminar_hall">Seminar Hall</SelectItem>
                                                        <SelectItem value="restroom">Restroom</SelectItem>
                                                        <SelectItem value="storage">Storage</SelectItem>
                                                        <SelectItem value="corridor">Corridor</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {/* Capacity */}
                                        {selectedElement.type === "room" && (
                                            <div>
                                                <Label className="text-xs">Capacity</Label>
                                                <Input
                                                    type="number"
                                                    value={selectedElement.capacity || 0}
                                                    onChange={(e) => updateElement(selectedElement.id, { capacity: parseInt(e.target.value) || 0 })}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                        )}

                                        {/* Dimensions */}
                                        {selectedElement.width !== undefined && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label className="text-xs">Width</Label>
                                                    <Input
                                                        type="number"
                                                        value={selectedElement.width || 0}
                                                        onChange={(e) => updateElement(selectedElement.id, { width: parseInt(e.target.value) || 0 })}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Height</Label>
                                                    <Input
                                                        type="number"
                                                        value={selectedElement.height || 0}
                                                        onChange={(e) => updateElement(selectedElement.id, { height: parseInt(e.target.value) || 0 })}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Position */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-xs text-muted-foreground">X</Label>
                                                <Input
                                                    value={Math.round(selectedElement.x)}
                                                    className="h-7 text-xs font-mono"
                                                    readOnly
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Y</Label>
                                                <Input
                                                    value={Math.round(selectedElement.y)}
                                                    className="h-7 text-xs font-mono"
                                                    readOnly
                                                />
                                            </div>
                                        </div>

                                        {/* Font size for labels */}
                                        {selectedElement.type === "label" && (
                                            <div>
                                                <Label className="text-xs">Font Size</Label>
                                                <Input
                                                    type="number"
                                                    value={selectedElement.fontSize || 14}
                                                    onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) || 14 })}
                                                    className="h-8 text-sm"
                                                    min={8}
                                                    max={48}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </ScrollArea>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
