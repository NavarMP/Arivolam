"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
// next/dynamic removed — SSR protection handled by parent
import { useTheme } from "next-themes";
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, ZoomIn, ZoomOut, RotateCcw, Save, Plus, Trash2,
    Type, MousePointer2, DoorOpen, Grid3X3,
    Minus, Footprints, ArrowUpDown,
    Square, ChevronDown, ChevronUp, Pencil,
} from "lucide-react";

// Import react-konva directly — SSR protection is handled by parent dynamic import
import { Stage, Layer as KonvaLayer, Rect, Circle as KonvaCircle, Text, Line, Group } from "react-konva";

// ─── Types ───

export interface FloorElement {
    id: string;
    type: "room" | "wall" | "door" | "staircase" | "elevator" | "corridor" | "label";
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

type ToolType = "select" | "room" | "wall" | "door" | "staircase" | "elevator" | "corridor" | "label";

const TOOLS: { mode: ToolType; icon: typeof Square; label: string; shortcut?: string }[] = [
    { mode: "select", icon: MousePointer2, label: "Select / Move", shortcut: "V" },
    { mode: "room", icon: Square, label: "Draw Room", shortcut: "R" },
    { mode: "wall", icon: Minus, label: "Draw Wall", shortcut: "W" },
    { mode: "door", icon: DoorOpen, label: "Place Door", shortcut: "D" },
    { mode: "staircase", icon: Footprints, label: "Place Staircase", shortcut: "S" },
    { mode: "elevator", icon: ArrowUpDown, label: "Place Elevator", shortcut: "E" },
    { mode: "corridor", icon: Grid3X3, label: "Draw Corridor", shortcut: "C" },
    { mode: "label", icon: Type, label: "Add Label", shortcut: "T" },
];

const ROOM_COLORS: Record<string, string> = {
    classroom: "#3b82f620",
    lab: "#8b5cf620",
    office: "#f59e0b20",
    library: "#22c55e20",
    seminar_hall: "#ec489920",
    auditorium: "#f9731620",
    restroom: "#06b6d420",
    canteen: "#d9770620",
    prayer_room: "#05966920",
    storeroom: "#64748b20",
    conference: "#6366f120",
    common_area: "#14b8a620",
    other: "#94a3b820",
    corridor: "#f1f5f940",
};

const ROOM_BORDERS: Record<string, string> = {
    classroom: "#3b82f6",
    lab: "#8b5cf6",
    office: "#f59e0b",
    library: "#22c55e",
    seminar_hall: "#ec4899",
    auditorium: "#f97316",
    restroom: "#06b6d4",
    canteen: "#d97706",
    prayer_room: "#059669",
    storeroom: "#64748b",
    conference: "#6366f1",
    common_area: "#14b8a6",
    other: "#94a3b8",
    corridor: "#cbd5e1",
};

// ─── Theme Palettes ───
const THEME = {
    dark: {
        canvasBg: "#0f172a",
        gridMinor: "#1e293b80",
        gridMajor: "#475569",
        text: "#e2e8f0",
        textSec: "#94a3b8",
        panelBg: "rgba(15,23,42,0.95)",
        selStroke: "#60a5fa",
        wallStroke: "#94a3b8",
        roomLabel: "#e2e8f0",
        doorFill: "#334155",
        stairFill: "#f59e0b30",
        stairStroke: "#f59e0b",
        elevFill: "#8b5cf630",
        elevStroke: "#8b5cf6",
        corridorFill: "#1e293b60",
        corridorStroke: "#475569",
    },
    light: {
        canvasBg: "#f8fafc",
        gridMinor: "#e2e8f0",
        gridMajor: "#cbd5e1",
        text: "#1e293b",
        textSec: "#64748b",
        panelBg: "rgba(255,255,255,0.95)",
        selStroke: "#3b82f6",
        wallStroke: "#334155",
        roomLabel: "#1e293b",
        doorFill: "#f1f5f9",
        stairFill: "#f59e0b20",
        stairStroke: "#f59e0b",
        elevFill: "#8b5cf620",
        elevStroke: "#8b5cf6",
        corridorFill: "#f1f5f980",
        corridorStroke: "#94a3b8",
    },
};

const GRID_SIZE = 25;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 5;

// ─── Floor Plan Viewer (read-only, for users) ───

interface FloorPlanViewerProps {
    floorPlan: FloorPlan;
    onClose: () => void;
}

export function FloorPlanViewer({ floorPlan, onClose }: FloorPlanViewerProps) {
    const { resolvedTheme } = useTheme();
    const tc = THEME[resolvedTheme === "light" ? "light" : "dark"];
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [dims, setDims] = useState({ w: 800, h: 600 });

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const obs = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setDims({ w: entry.contentRect.width, h: entry.contentRect.height });
            }
        });
        obs.observe(el);
        setDims({ w: el.clientWidth, h: el.clientHeight });
        return () => obs.disconnect();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
            <div className="relative bg-background rounded-2xl shadow-2xl border w-[90vw] h-[80vh] max-w-4xl overflow-hidden flex flex-col">
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
                    className="flex-1 overflow-hidden"
                    style={{ backgroundColor: tc.canvasBg }}
                    onWheel={(e) => {
                        e.preventDefault();
                        const factor = e.deltaY < 0 ? 1.1 : 0.9;
                        setScale((s) => Math.max(0.2, Math.min(5, s * factor)));
                    }}
                >
                    <Stage
                        width={dims.w}
                        height={dims.h}
                        scaleX={scale}
                        scaleY={scale}
                        x={offset.x}
                        y={offset.y}
                        draggable
                        onDragEnd={(e) => setOffset({ x: e.target.x(), y: e.target.y() })}
                    >
                        <KonvaLayer>
                            {/* Grid */}
                            {Array.from({ length: Math.ceil(floorPlan.width / GRID_SIZE) + 1 }).map((_, i) => (
                                <Line key={`gv-${i}`} points={[i * GRID_SIZE, 0, i * GRID_SIZE, floorPlan.height]} stroke={tc.gridMinor} strokeWidth={0.5} />
                            ))}
                            {Array.from({ length: Math.ceil(floorPlan.height / GRID_SIZE) + 1 }).map((_, i) => (
                                <Line key={`gh-${i}`} points={[0, i * GRID_SIZE, floorPlan.width, i * GRID_SIZE]} stroke={tc.gridMinor} strokeWidth={0.5} />
                            ))}

                            {/* Elements */}
                            {floorPlan.elements.map((el) => renderElement(el, false, tc))}
                        </KonvaLayer>
                    </Stage>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Shared element renderer ───
function renderElement(el: FloorElement, isSelected: boolean, tc: typeof THEME.dark, extraProps?: any) {
    const selStroke = tc.selStroke;
    switch (el.type) {
        case "room":
            return (
                <Group key={el.id} {...extraProps}>
                    <Rect
                        x={el.x} y={el.y}
                        width={el.width || 100} height={el.height || 80}
                        fill={el.fill || ROOM_COLORS[el.roomType || "classroom"]}
                        stroke={isSelected ? selStroke : (el.stroke || ROOM_BORDERS[el.roomType || "classroom"] || "#94a3b8")}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        cornerRadius={3}
                    />
                    {el.name && (
                        <Text x={el.x + 6} y={el.y + 6} text={el.name} fontSize={11}
                            fontStyle="600" fill={tc.roomLabel} width={(el.width || 100) - 12} />
                    )}
                    {el.roomType && (
                        <Text x={el.x + 6} y={el.y + 20} text={el.roomType.replace("_", " ")} fontSize={8}
                            fill={tc.textSec} width={(el.width || 100) - 12} />
                    )}
                    {el.capacity && (
                        <Text x={el.x + 6} y={el.y + (el.height || 80) - 16}
                            text={`${el.capacity} seats`} fontSize={9} fill={tc.textSec} />
                    )}
                </Group>
            );
        case "wall":
            return (
                <Line
                    key={el.id}
                    points={el.points || [el.x, el.y, el.x + (el.width || 100), el.y]}
                    stroke={isSelected ? selStroke : (el.stroke || tc.wallStroke)}
                    strokeWidth={isSelected ? 5 : 4}
                    lineCap="round"
                    hitStrokeWidth={12}
                    {...extraProps}
                />
            );
        case "door":
            return (
                <Group key={el.id} {...extraProps}>
                    <Rect
                        x={el.x} y={el.y}
                        width={el.width || 30} height={el.height || 8}
                        fill={isSelected ? "#bfdbfe" : tc.doorFill}
                        stroke={isSelected ? selStroke : "#94a3b8"}
                        strokeWidth={1}
                        cornerRadius={2}
                    />
                    {/* Door arc indicator */}
                    <Line
                        points={[el.x + 2, el.y + (el.height || 8), el.x + (el.width || 30) - 2, el.y + (el.height || 8)]}
                        stroke={isSelected ? selStroke : "#94a3b8"}
                        strokeWidth={0.5}
                        dash={[3, 2]}
                    />
                </Group>
            );
        case "staircase":
            return (
                <Group key={el.id} {...extraProps}>
                    <Rect
                        x={el.x} y={el.y}
                        width={el.width || 40} height={el.height || 50}
                        fill={isSelected ? "#fef3c7" : tc.stairFill}
                        stroke={isSelected ? selStroke : tc.stairStroke}
                        strokeWidth={isSelected ? 2 : 1.5}
                        cornerRadius={3}
                    />
                    {/* Stair lines */}
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Line
                            key={`stair-${el.id}-${i}`}
                            points={[el.x + 4, el.y + 8 + i * 10, el.x + (el.width || 40) - 4, el.y + 8 + i * 10]}
                            stroke={tc.stairStroke}
                            strokeWidth={1}
                        />
                    ))}
                    <Text x={el.x + 4} y={el.y + (el.height || 50) - 14}
                        text={el.name || "Stairs"} fontSize={8} fill={tc.stairStroke}
                        width={(el.width || 40) - 8} />
                </Group>
            );
        case "elevator":
            return (
                <Group key={el.id} {...extraProps}>
                    <Rect
                        x={el.x} y={el.y}
                        width={el.width || 35} height={el.height || 35}
                        fill={isSelected ? "#ede9fe" : tc.elevFill}
                        stroke={isSelected ? selStroke : tc.elevStroke}
                        strokeWidth={isSelected ? 2 : 1.5}
                        cornerRadius={3}
                    />
                    {/* Elevator arrows */}
                    <Line
                        points={[
                            el.x + (el.width || 35) / 2, el.y + 6,
                            el.x + (el.width || 35) / 2, el.y + (el.height || 35) - 6,
                        ]}
                        stroke={tc.elevStroke} strokeWidth={1.5}
                    />
                    <Line
                        points={[
                            el.x + (el.width || 35) / 2 - 4, el.y + 12,
                            el.x + (el.width || 35) / 2, el.y + 6,
                            el.x + (el.width || 35) / 2 + 4, el.y + 12,
                        ]}
                        stroke={tc.elevStroke} strokeWidth={1.5}
                    />
                    <Line
                        points={[
                            el.x + (el.width || 35) / 2 - 4, el.y + (el.height || 35) - 12,
                            el.x + (el.width || 35) / 2, el.y + (el.height || 35) - 6,
                            el.x + (el.width || 35) / 2 + 4, el.y + (el.height || 35) - 12,
                        ]}
                        stroke={tc.elevStroke} strokeWidth={1.5}
                    />
                </Group>
            );
        case "corridor":
            return (
                <Group key={el.id} {...extraProps}>
                    <Rect
                        x={el.x} y={el.y}
                        width={el.width || 150} height={el.height || 30}
                        fill={isSelected ? "#f1f5f9" : tc.corridorFill}
                        stroke={isSelected ? selStroke : tc.corridorStroke}
                        strokeWidth={isSelected ? 2 : 1}
                        dash={[6, 3]}
                        cornerRadius={2}
                    />
                    {el.name && (
                        <Text x={el.x + 4} y={el.y + ((el.height || 30) - 10) / 2}
                            text={el.name} fontSize={9} fill={tc.textSec}
                            width={(el.width || 150) - 8} align="center" />
                    )}
                </Group>
            );
        case "label":
            return (
                <Text
                    key={el.id}
                    x={el.x} y={el.y}
                    text={el.text || "Label"}
                    fontSize={el.fontSize || 14}
                    fontStyle="bold"
                    fill={isSelected ? selStroke : (el.fill || tc.text)}
                    {...extraProps}
                />
            );
        default:
            return null;
    }
}

// ─── Floor Plan Editor (admin) ───

interface FloorPlanEditorProps {
    existingPlan?: FloorPlan;
    buildingId: string;
    floorNumber: number;
    onSave: (plan: FloorPlan) => void;
    onClose: () => void;
    /** Called after save with room elements, so the parent can sync them to the DB */
    onRoomSync?: (rooms: { elementId: string; name: string; roomType: string; capacity: number; floorNumber: number }[]) => void;
    /** Called on double-click of a room element, so the parent can open the full RoomDialog */
    onRoomEdit?: (roomElement: FloorElement) => void;
}

export function FloorPlanEditor({
    existingPlan,
    buildingId,
    floorNumber,
    onSave,
    onClose,
    onRoomSync,
    onRoomEdit,
}: FloorPlanEditorProps) {
    const { resolvedTheme } = useTheme();
    const tc = THEME[resolvedTheme === "light" ? "light" : "dark"];

    // Use building dimensions if provided, otherwise default to reasonable sizes
    const planWidth = useMemo(() => {
        if (existingPlan?.width && existingPlan.width !== 800) return existingPlan.width;
        return 800;
    }, [existingPlan]);

    const planHeight = useMemo(() => {
        if (existingPlan?.height && existingPlan.height !== 600) return existingPlan.height;
        return 600;
    }, [existingPlan]);

    const [elements, setElements] = useState<FloorElement[]>(existingPlan?.elements || []);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [tool, setTool] = useState<ToolType>("select");
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [saving, setSaving] = useState(false);
    const [showGrid, setShowGrid] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dims, setDims] = useState({ w: 800, h: 600 });

    // Panning state — track separately to avoid drag/pan conflict
    const isPanning = useRef(false);
    const panStart = useRef({ x: 0, y: 0 });
    const offsetStart = useRef({ x: 0, y: 0 });
    const isDraggingElement = useRef(false);

    // Wall drawing state
    const [wallStart, setWallStart] = useState<{ x: number; y: number } | null>(null);

    const selectedElement = elements.find((e) => e.id === selectedId);

    const generateId = () => `el_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Auto-fit on first render
    const didFitRef = useRef(false);

    // Responsive canvas sizing
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const obs = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setDims({ w: entry.contentRect.width, h: entry.contentRect.height });
                // Auto-fit once on first resize
                if (!didFitRef.current) {
                    didFitRef.current = true;
                    const cw = entry.contentRect.width;
                    const ch = entry.contentRect.height;
                    const sx = cw / (planWidth + 60);
                    const sy = ch / (planHeight + 60);
                    const s = Math.min(sx, sy, 2);
                    setScale(s);
                    setOffset({ x: (cw - planWidth * s) / 2, y: (ch - planHeight * s) / 2 });
                }
            }
        });
        obs.observe(el);
        setDims({ w: el.clientWidth, h: el.clientHeight });
        return () => obs.disconnect();
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

            switch (e.key.toLowerCase()) {
                case "v": setTool("select"); break;
                case "r": setTool("room"); break;
                case "w": setTool("wall"); break;
                case "d": setTool("door"); break;
                case "s": setTool("staircase"); break;
                case "e": setTool("elevator"); break;
                case "c": setTool("corridor"); break;
                case "t": setTool("label"); break;
                case "g": setShowGrid((v) => !v); break;
                case "escape":
                    setTool("select");
                    setSelectedId(null);
                    setWallStart(null);
                    break;
                case "delete":
                case "backspace":
                    if (selectedId) {
                        setElements((prev) => prev.filter((el) => el.id !== selectedId));
                        setSelectedId(null);
                    }
                    break;
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [selectedId]);

    // Snap to grid helper
    const snap = useCallback((val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE, []);

    // Handle stage click for creating elements
    const handleStageClick = useCallback((e: any) => {
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        if (!pos) return;

        const x = snap((pos.x - offset.x) / scale);
        const y = snap((pos.y - offset.y) / scale);

        if (tool === "select") {
            if (e.target === stage || e.target.attrs.name === "background") {
                setSelectedId(null);
            }
            return;
        }

        const newId = generateId();

        switch (tool) {
            case "room":
                setElements((prev) => [
                    ...prev,
                    {
                        id: newId, type: "room", x, y,
                        width: 120, height: 80,
                        fill: ROOM_COLORS.classroom,
                        stroke: ROOM_BORDERS.classroom,
                        name: "New Room", roomType: "classroom", capacity: 30,
                    },
                ]);
                setSelectedId(newId);
                setTool("select");
                break;
            case "wall":
                if (!wallStart) {
                    setWallStart({ x, y });
                } else {
                    setElements((prev) => [
                        ...prev,
                        {
                            id: newId, type: "wall", x: wallStart.x, y: wallStart.y,
                            points: [wallStart.x, wallStart.y, x, y],
                            stroke: tc.wallStroke,
                        },
                    ]);
                    setWallStart(null);
                    setSelectedId(newId);
                }
                break;
            case "door":
                setElements((prev) => [
                    ...prev,
                    { id: newId, type: "door", x, y, width: 30, height: 8 },
                ]);
                setSelectedId(newId);
                setTool("select");
                break;
            case "staircase":
                setElements((prev) => [
                    ...prev,
                    { id: newId, type: "staircase", x, y, width: 40, height: 50, name: "Stairs" },
                ]);
                setSelectedId(newId);
                setTool("select");
                break;
            case "elevator":
                setElements((prev) => [
                    ...prev,
                    { id: newId, type: "elevator", x, y, width: 35, height: 35, name: "Elevator" },
                ]);
                setSelectedId(newId);
                setTool("select");
                break;
            case "corridor":
                setElements((prev) => [
                    ...prev,
                    {
                        id: newId, type: "corridor", x, y,
                        width: 150, height: 30, name: "Corridor",
                    },
                ]);
                setSelectedId(newId);
                setTool("select");
                break;
            case "label":
                setElements((prev) => [
                    ...prev,
                    { id: newId, type: "label", x, y, text: "Label", fontSize: 14, fill: tc.text },
                ]);
                setSelectedId(newId);
                setTool("select");
                break;
        }
    }, [tool, scale, offset, wallStart, snap, tc]);

    const updateElement = (id: string, updates: Partial<FloorElement>) => {
        setElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...updates } : el)));
    };

    const deleteElement = (id: string) => {
        setElements((prev) => prev.filter((el) => el.id !== id));
        setSelectedId(null);
    };

    // Mouse wheel zoom
    const handleWheel = useCallback((e: any) => {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const oldScale = scale;
        const factor = e.evt.deltaY < 0 ? 1.08 : 0.92;
        const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldScale * factor));

        const mx = pointer.x;
        const my = pointer.y;
        const newX = mx - ((mx - offset.x) / oldScale) * newScale;
        const newY = my - ((my - offset.y) / oldScale) * newScale;

        setScale(newScale);
        setOffset({ x: newX, y: newY });
    }, [scale, offset]);

    const handleSave = async () => {
        setSaving(true);
        const plan: FloorPlan = {
            id: existingPlan?.id,
            building_id: buildingId,
            floor_number: floorNumber,
            name: floorNumber === 1 ? "Ground Floor" : `Floor ${floorNumber}`,
            width: planWidth,
            height: planHeight,
            elements,
        };
        await onSave(plan);

        // Sync room elements to the database
        if (onRoomSync) {
            const roomElements = elements.filter(el => el.type === "room");
            const roomsToSync = roomElements.map(el => ({
                elementId: el.id,
                name: el.name || "Unnamed Room",
                roomType: el.roomType || "classroom",
                capacity: el.capacity || 0,
                floorNumber,
            }));
            onRoomSync(roomsToSync);
        }

        setSaving(false);
    };

    const fitAll = useCallback(() => {
        if (!containerRef.current) return;
        const cw = containerRef.current.clientWidth;
        const ch = containerRef.current.clientHeight;
        const sx = cw / (planWidth + 40);
        const sy = ch / (planHeight + 40);
        const s = Math.min(sx, sy, 2);
        setScale(s);
        setOffset({ x: (cw - planWidth * s) / 2, y: (ch - planHeight * s) / 2 });
    }, [planWidth, planHeight]);

    // Element counts for status
    const counts = useMemo(() => {
        const c = { room: 0, wall: 0, door: 0, staircase: 0, elevator: 0, corridor: 0, label: 0 };
        elements.forEach((el) => { if (el.type in c) c[el.type as keyof typeof c]++; });
        return c;
    }, [elements]);

    return (
        <TooltipProvider delayDuration={200}>
            <div className="fixed inset-0 z-50 flex" style={{ backgroundColor: tc.canvasBg }}>
                {/* Left toolbar */}
                <div className="w-12 flex flex-col items-center gap-1 py-3 border-r bg-background/80 backdrop-blur-sm">
                    {TOOLS.map((t) => {
                        const Icon = t.icon;
                        const isActive = tool === t.mode;
                        return (
                            <Tooltip key={t.mode}>
                                <TooltipTrigger asChild>
                                    <button
                                        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${isActive
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "hover:bg-muted text-muted-foreground"
                                            }`}
                                        onClick={() => { setTool(t.mode); setWallStart(null); }}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="text-xs">
                                    {t.label} {t.shortcut && <kbd className="ml-1.5 px-1 py-0.5 bg-muted rounded text-[10px]">{t.shortcut}</kbd>}
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}

                    <div className="flex-1" />

                    {/* Grid toggle */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${showGrid
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:bg-muted"
                                    }`}
                                onClick={() => setShowGrid(!showGrid)}
                            >
                                <Grid3X3 className="h-4 w-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">
                            Toggle Grid <kbd className="ml-1.5 px-1 py-0.5 bg-muted rounded text-[10px]">G</kbd>
                        </TooltipContent>
                    </Tooltip>
                </div>

                {/* Main area */}
                <div className="flex-1 flex flex-col relative">
                    {/* Header bar */}
                    <div className="flex items-center justify-between px-4 py-2 border-b bg-background/80 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div>
                                <h3 className="font-semibold text-sm">Floor {floorNumber} Editor</h3>
                                <p className="text-xs text-muted-foreground">
                                    {counts.room} rooms · {counts.wall} walls · {planWidth}×{planHeight}px
                                </p>
                            </div>
                            {/* Mode badge */}
                            <Badge variant="outline" className="text-xs gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${tool === "select" ? "bg-green-500" : "bg-amber-500 animate-pulse"}`} />
                                {tool === "select" ? "Select" : tool === "wall" && wallStart ? "Click end point..." : `Place: ${tool}`}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale((s) => Math.min(MAX_ZOOM, s * 1.3))}>
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                            <Badge variant="outline" className="text-xs min-w-[3.5rem] justify-center">{Math.round(scale * 100)}%</Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale((s) => Math.max(MIN_ZOOM, s / 1.3))}>
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fitAll} title="Fit All">
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                            <div className="w-px h-6 bg-border mx-1" />
                            <Button variant="default" size="sm" className="gap-1.5" onClick={handleSave} disabled={saving}>
                                <Save className="h-3.5 w-3.5" />
                                {saving ? "Saving..." : "Save"}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Keyboard shortcut bar */}
                    <div className="hidden md:flex items-center justify-center py-1 border-b bg-background/60 backdrop-blur-sm">
                        <span className="text-[10px] text-muted-foreground font-mono">
                            V select · R room · W wall · D door · S stairs · E elevator · C corridor · T label · G grid · Esc cancel · Del delete
                        </span>
                    </div>

                    {/* Stage */}
                    <div
                        ref={containerRef}
                        className="flex-1 overflow-hidden"
                        style={{
                            backgroundColor: tc.canvasBg,
                            cursor: tool === "select" ? "default" : tool === "wall" && wallStart ? "crosshair" : "crosshair",
                        }}
                    >
                        <Stage
                            width={dims.w}
                            height={dims.h}
                            scaleX={scale}
                            scaleY={scale}
                            x={offset.x}
                            y={offset.y}
                            onClick={handleStageClick}
                            onTap={handleStageClick}
                            onWheel={handleWheel}
                            draggable={false}
                            onMouseDown={(e: any) => {
                                // Pan only on background/empty clicks, not on elements
                                const target = e.target;
                                const stage = target.getStage();
                                if (target === stage || target.attrs.name === "background") {
                                    if (tool === "select") {
                                        isPanning.current = true;
                                        panStart.current = stage.getPointerPosition() || { x: 0, y: 0 };
                                        offsetStart.current = { ...offset };
                                    }
                                }
                            }}
                            onMouseMove={(e: any) => {
                                if (isPanning.current && !isDraggingElement.current) {
                                    const stage = e.target.getStage();
                                    const pos = stage.getPointerPosition();
                                    if (pos) {
                                        setOffset({
                                            x: offsetStart.current.x + (pos.x - panStart.current.x),
                                            y: offsetStart.current.y + (pos.y - panStart.current.y),
                                        });
                                    }
                                }
                            }}
                            onMouseUp={() => {
                                isPanning.current = false;
                            }}
                            onMouseLeave={() => {
                                isPanning.current = false;
                            }}
                        >
                            <KonvaLayer>
                                {/* Background */}
                                <Rect
                                    name="background"
                                    x={0} y={0}
                                    width={planWidth}
                                    height={planHeight}
                                    fill={tc.canvasBg}
                                    stroke={tc.gridMajor}
                                    strokeWidth={2}
                                />

                                {/* Grid */}
                                {showGrid && (
                                    <>
                                        {Array.from({ length: Math.ceil(planWidth / GRID_SIZE) + 1 }).map((_, i) => (
                                            <Line
                                                key={`gv-${i}`}
                                                points={[i * GRID_SIZE, 0, i * GRID_SIZE, planHeight]}
                                                stroke={i % 4 === 0 ? tc.gridMajor : tc.gridMinor}
                                                strokeWidth={i % 4 === 0 ? 1 : 0.5}
                                            />
                                        ))}
                                        {Array.from({ length: Math.ceil(planHeight / GRID_SIZE) + 1 }).map((_, i) => (
                                            <Line
                                                key={`gh-${i}`}
                                                points={[0, i * GRID_SIZE, planWidth, i * GRID_SIZE]}
                                                stroke={i % 4 === 0 ? tc.gridMajor : tc.gridMinor}
                                                strokeWidth={i % 4 === 0 ? 1 : 0.5}
                                            />
                                        ))}
                                    </>
                                )}

                                {/* Wall preview line (while drawing) */}
                                {wallStart && (
                                    <Line
                                        points={[wallStart.x, wallStart.y, wallStart.x, wallStart.y]}
                                        stroke={tc.selStroke}
                                        strokeWidth={3}
                                        dash={[6, 4]}
                                        opacity={0.6}
                                    />
                                )}

                                {/* Elements */}
                                {elements.map((el) => {
                                    const isSelected = el.id === selectedId;
                                    const interactiveProps = {
                                        draggable: tool === "select",
                                        onClick: (evt: any) => { evt.cancelBubble = true; setSelectedId(el.id); },
                                        onDblClick: (evt: any) => {
                                            evt.cancelBubble = true;
                                            if (el.type === "room" && onRoomEdit) {
                                                onRoomEdit(el);
                                            }
                                        },
                                        onDragStart: () => {
                                            isDraggingElement.current = true;
                                            isPanning.current = false;
                                        },
                                        onDragEnd: (evt: any) => {
                                            isDraggingElement.current = false;
                                            if (el.type === "wall" && el.points) {
                                                const dx = evt.target.x();
                                                const dy = evt.target.y();
                                                const newPoints = el.points.map((p, i) => i % 2 === 0 ? p + dx : p + dy);
                                                updateElement(el.id, {
                                                    x: snap(newPoints[0]),
                                                    y: snap(newPoints[1]),
                                                    points: newPoints.map((p) => snap(p)),
                                                });
                                                evt.target.position({ x: 0, y: 0 });
                                            } else {
                                                updateElement(el.id, {
                                                    x: snap(evt.target.x()),
                                                    y: snap(evt.target.y()),
                                                });
                                            }
                                        },
                                    };
                                    return renderElement(el, isSelected, tc, interactiveProps);
                                })}
                            </KonvaLayer>
                        </Stage>
                    </div>
                </div>

                {/* Right property panel - absolutely positioned */}
                {selectedElement && (
                    <div
                        className="absolute top-0 right-0 bottom-0 w-[260px] border-l bg-background/95 backdrop-blur-sm flex flex-col z-10 overflow-hidden"
                    >
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="p-4 w-[260px]">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="font-semibold text-sm capitalize">{selectedElement.type}</h4>
                                        <p className="text-[10px] text-muted-foreground font-mono">{selectedElement.id.slice(0, 12)}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => setSelectedId(null)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
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
                                    {/* Name (for rooms, staircases, elevators, corridors) */}
                                    {(selectedElement.type === "room" || selectedElement.type === "staircase" ||
                                        selectedElement.type === "elevator" || selectedElement.type === "corridor") && (
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
                                                    stroke: ROOM_BORDERS[v] || ROOM_BORDERS.classroom,
                                                })}
                                            >
                                                <SelectTrigger className="h-8 text-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.keys(ROOM_COLORS).filter(k => k !== "corridor").map((key) => (
                                                        <SelectItem key={key} value={key}>
                                                            {key.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                                        </SelectItem>
                                                    ))}
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
                                                min={0}
                                            />
                                        </div>
                                    )}

                                    {/* Dimensions */}
                                    {selectedElement.width !== undefined && selectedElement.type !== "wall" && (
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
                                            <Input value={Math.round(selectedElement.x)} className="h-7 text-xs font-mono" readOnly />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Y</Label>
                                            <Input value={Math.round(selectedElement.y)} className="h-7 text-xs font-mono" readOnly />
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
                                                min={8} max={48}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}
