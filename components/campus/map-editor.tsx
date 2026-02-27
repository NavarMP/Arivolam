"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDebounce } from "react-use";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MapPin as MapPinIcon, X, Trash2 } from "lucide-react";

import { MapEditorToolbar, type DrawMode } from "./map-editor-toolbar";
import { FloorPlanEditor, type FloorPlan } from "./floor-plan";
import {
    MapPropertyPanel,
    type SelectedItem,
    type BuildingData,
    type POIData,
    type NavNodeData,
} from "./map-property-panel";
import {
    saveBuilding,
    deleteBuilding as deleteBuildingAction,
    savePOI,
    deletePOI as deletePOIAction,
    saveNavNode,
    deleteNavNode as deleteNavNodeAction,
    saveNavEdge,
    deleteNavEdge as deleteNavEdgeAction,
} from "@/app/campus/[slug]/admin/map-editor/actions";
import {
    saveFloorPlan,
    getFloorPlans,
    deleteFloorPlan as deleteFloorPlanAction,
} from "@/app/campus/[slug]/admin/map-editor/floor-plan-actions";

// ─── Types ───

interface MapBuilding {
    id: string;
    name: string;
    short_name?: string;
    description?: string;
    category: string;
    floors: number;
    latitude: number;
    longitude: number;
    geo_polygon?: any;
    icon: string;
    color: string;
    operating_hours?: string;
    sort_order: number;
    label_visible_zoom?: number;
    show_polygon?: boolean;
}

interface MapPOI {
    id: string;
    name: string;
    category: string;
    description?: string;
    icon: string;
    latitude: number;
    longitude: number;
    building_id?: string;
}

interface MapNavNode {
    id: string;
    latitude: number;
    longitude: number;
    node_type: string;
    label?: string;
    building_id?: string;
}

interface MapNavEdge {
    id: string;
    from_node_id: string;
    to_node_id: string;
    weight: number;
    edge_type?: string;
}

// Canvas element stored for rendering
interface CanvasElement {
    id: string;
    kind: "building" | "poi" | "navnode";
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    label: string;
    dbId?: string; // linked database record
}

interface MapEditorProps {
    buildings: MapBuilding[];
    pois: MapPOI[];
    navNodes: MapNavNode[];
    navEdges: MapNavEdge[];
    mapCenter?: [number, number];
    slug: string;
}

// ─── Constants ───
const GRID_SIZE = 25;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 50;

// ─── Theme palettes ───
const EDITOR_THEME = {
    dark: {
        canvasBg: "#0f172a", gridMinor: "#1e293b", gridMajor: "#334155",
        textPrimary: "#e2e8f0", textSecondary: "#94a3b8", textTertiary: "#cbd5e1",
        selBorder: "#ffffff", selBorderAlpha: "#ffffff60",
    },
    light: {
        canvasBg: "#f8fafc", gridMinor: "#e2e8f0", gridMajor: "#cbd5e1",
        textPrimary: "#1e293b", textSecondary: "#475569", textTertiary: "#334155",
        selBorder: "#1e293b", selBorderAlpha: "#1e293b60",
    },
};
const CANVAS_W = 4000;
const CANVAS_H = 3000;

// Category colors
const CAT_COLORS: Record<string, string> = {
    academic: "#3b82f6",
    administrative: "#ef4444",
    facility: "#f59e0b",
    hostel: "#06b6d4",
    recreation: "#22c55e",
    religious: "#059669",
    food: "#d97706",
    transport: "#8b5cf6",
    medical: "#dc2626",
    residential: "#14b8a6",
};

const POI_COLORS: Record<string, string> = {
    entrance: "#22c55e",
    parking: "#6366f1",
    atm: "#f59e0b",
    amenity: "#06b6d4",
    health: "#ef4444",
    food: "#d97706",
    transport: "#8b5cf6",
    sports: "#10b981",
    emergency: "#dc2626",
    other: "#64748b",
};

const NAV_COLORS: Record<string, string> = {
    waypoint: "#64748b",
    entrance: "#22c55e",
    junction: "#f59e0b",
    staircase: "#8b5cf6",
    elevator: "#3b82f6",
    door: "#ec4899",
    poi: "#06b6d4",
};

// ─── Main Editor Component ───

export function MapEditor({
    buildings: initialBuildings,
    pois: initialPOIs,
    navNodes: initialNavNodes,
    navEdges: initialNavEdges,
    mapCenter = [11.2274, 75.9104],
    slug,
}: MapEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { resolvedTheme } = useTheme();
    const tc = EDITOR_THEME[resolvedTheme === "light" ? "light" : "dark"];

    // Data state
    const [buildings, setBuildings] = useState(initialBuildings);
    const [pois, setPOIs] = useState(initialPOIs);
    const [navNodes, setNavNodes] = useState(initialNavNodes);
    const [navEdges, setNavEdges] = useState(initialNavEdges);

    // Canvas state
    const [zoom, setZoom] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 200, y: 100 });
    const [drawMode, setDrawMode] = useState<DrawMode>("select");
    const [snapEnabled, setSnapEnabled] = useState(true);
    const [showNavGraph, setShowNavGraph] = useState(true);
    const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Floor plan state
    const [showFloorPlanOverlay, setShowFloorPlanOverlay] = useState(false);
    const [activeBuildingFloorPlans, setActiveBuildingFloorPlans] = useState<FloorPlan[]>([]);
    const [loadingFloorPlans, setLoadingFloorPlans] = useState(false);
    const [editingFloorPlan, setEditingFloorPlan] = useState<{ plan?: FloorPlan, number: number } | null>(null);

    const loadFloorPlans = useCallback(async (bId: string) => {
        setLoadingFloorPlans(true);
        try {
            const plans = await getFloorPlans(bId);
            setActiveBuildingFloorPlans(plans);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load floor plans");
        } finally {
            setLoadingFloorPlans(false);
        }
    }, []);

    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
    const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
    const [polygonPoints, setPolygonPoints] = useState<{ x: number; y: number }[]>([]);
    const [linePoints, setLinePoints] = useState<{ x: number; y: number }[]>([]);

    // Marquee select state
    const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
    const [marqueeCurrent, setMarqueeCurrent] = useState<{ x: number; y: number } | null>(null);

    // Keyboard modifiers
    const [spaceHeld, setSpaceHeld] = useState(false);

    // Drag state
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragTarget, setDragTarget] = useState<{ kind: string; id: string; offsetX: number; offsetY: number } | null>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<string | null>(null);
    const [resizeStart, setResizeStart] = useState<{ x: number; y: number; ow: number; oh: number; ox: number; oy: number } | null>(null);

    // Nav edge builder
    const [edgeStartNode, setEdgeStartNode] = useState<string | null>(null);

    // Mutable element positions (initialized from data, updated by drag/resize)
    const [elPositions, setElPositions] = useState<Record<string, { x: number; y: number; w: number; h: number }>>(() => {
        const pos: Record<string, { x: number; y: number; w: number; h: number }> = {};
        initialBuildings.forEach((b, i) => { pos[b.id] = { x: 100 + (i % 5) * 250, y: 100 + Math.floor(i / 5) * 200, w: 200, h: 120 }; });
        initialPOIs.forEach((p, i) => { pos[p.id] = { x: 1500 + (i % 4) * 80, y: 100 + Math.floor(i / 4) * 80, w: 20, h: 20 }; });
        initialNavNodes.forEach((n, i) => { pos[n.id] = { x: 100 + (i % 8) * 120, y: 800 + Math.floor(i / 8) * 120, w: 12, h: 12 }; });
        return pos;
    });

    const initialElPositionsStr = useRef(JSON.stringify(elPositions));

    // Auto-save logic
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    useDebounce(() => {
        const currentStr = JSON.stringify(elPositions);
        if (currentStr === initialElPositionsStr.current || !hasChanges) return;

        const performAutoSave = async () => {
            setIsAutoSaving(true);
            try {
                // Find what changed and save it
                const promises: Promise<any>[] = [];
                for (const id in elPositions) {
                    const pos = elPositions[id];
                    // Check if it's a building
                    const b = buildings.find(x => x.id === id);
                    if (b) {
                        promises.push(saveBuilding(slug, {
                            ...b,
                            latitude: mapCenter[0], // Simplified keeping original logic
                            longitude: mapCenter[1],
                        }));
                        continue;
                    }
                    // Nav node
                    const n = navNodes.find(x => x.id === id);
                    if (n) {
                        promises.push(saveNavNode(slug, { ...n }));
                        continue;
                    }
                    // POI
                    const p = pois.find(x => x.id === id);
                    if (p) {
                        promises.push(savePOI(slug, { ...p }));
                        continue;
                    }
                }
                await Promise.allSettled(promises);
                toast.success("Auto-saved map changes", { id: "autosave" });
                initialElPositionsStr.current = currentStr;
                setHasChanges(false);
            } catch (err) {
                console.error("Auto-save failed", err);
            } finally {
                setIsAutoSaving(false);
            }
        };

        performAutoSave();
    }, 1500, [elPositions, buildings, pois, navNodes]);

    // Undo/Redo via ref to avoid stale closures in callbacks
    const [history, setHistory] = useState<{
        buildings: BuildingData[]; pois: POIData[]; navNodes: NavNodeData[];
        navEdges: any[]; elPositions: Record<string, { x: number; y: number; w: number; h: number }>;
    }[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const currentStateRef = useRef({
        buildings, pois, navNodes, navEdges, elPositions
    });

    useEffect(() => {
        currentStateRef.current = { buildings, pois, navNodes, navEdges, elPositions };
    }, [buildings, pois, navNodes, navEdges, elPositions]);

    const pushUndo = useCallback(() => {
        const { buildings: b, pois: p, navNodes: nn, navEdges: ne, elPositions: ep } = currentStateRef.current;
        const snapshot = {
            buildings: JSON.parse(JSON.stringify(b)),
            pois: JSON.parse(JSON.stringify(p)),
            navNodes: JSON.parse(JSON.stringify(nn)),
            navEdges: JSON.parse(JSON.stringify(ne)),
            elPositions: JSON.parse(JSON.stringify(ep)),
        };
        setHistory(prev => {
            // We use the functional setter to ensure we always have the freshest index
            setHistoryIndex(currIdx => {
                const nextIdx = Math.min(currIdx + 1, 29);
                return nextIdx;
            });
            return prev.slice(0, historyIndex === -1 ? prev.length : historyIndex + 1).concat([snapshot]).slice(-30);
        });
        setHasChanges(true);
    }, [historyIndex]);

    const handleUndo = useCallback(() => {
        if (historyIndex < 0) return;

        // If we are at the latest state and about to undo down, push current state so we can redo back to it
        if (historyIndex === history.length - 1) {
            const { buildings: b, pois: p, navNodes: nn, navEdges: ne, elPositions: ep } = currentStateRef.current;
            const snapshot = {
                buildings: JSON.parse(JSON.stringify(b)),
                pois: JSON.parse(JSON.stringify(p)),
                navNodes: JSON.parse(JSON.stringify(nn)),
                navEdges: JSON.parse(JSON.stringify(ne)),
                elPositions: JSON.parse(JSON.stringify(ep)),
            };
            setHistory(prev => [...prev, snapshot]);
        }

        const newIndex = historyIndex;
        const state = history[newIndex];

        setBuildings(state.buildings as MapBuilding[]);
        setPOIs(state.pois as MapPOI[]);
        setNavNodes(state.navNodes as MapNavNode[]);
        setNavEdges(state.navEdges);
        setElPositions(state.elPositions);

        setHistoryIndex(newIndex - 1);
        setSelectedItem(null);
    }, [history, historyIndex, buildings, pois, navNodes, navEdges, elPositions]);

    const handleRedo = useCallback(() => {
        // The state at historyIndex + 1 is the one we want to redo TO
        if (historyIndex + 1 >= history.length || historyIndex + 1 < 0) return;
        // Exception: if historyIndex + 1 is the last element but we are at the end, do nothing
        if (historyIndex + 2 > history.length) return;

        const newIndex = historyIndex + 2;
        const state = history[newIndex];

        if (!state) return;

        setBuildings(state.buildings as MapBuilding[]);
        setPOIs(state.pois as MapPOI[]);
        setNavNodes(state.navNodes as MapNavNode[]);
        setNavEdges(state.navEdges);
        setElPositions(state.elPositions);

        setHistoryIndex(newIndex - 1);
        setSelectedItem(null);
    }, [history, historyIndex]);

    useEffect(() => {
        const onUndo = () => handleUndo();
        const onRedo = () => handleRedo();
        window.addEventListener("map-editor-undo", onUndo);
        window.addEventListener("map-editor-redo", onRedo);
        return () => {
            window.removeEventListener("map-editor-undo", onUndo);
            window.removeEventListener("map-editor-redo", onRedo);
        };
    }, [handleUndo, handleRedo]);

    // Canvas elements derived from data + positions
    const buildingElements = useMemo(() =>
        buildings.map((b) => {
            const p = elPositions[b.id] || { x: 100, y: 100, w: 200, h: 120 };
            return { id: b.id, x: p.x, y: p.y, w: p.w, h: p.h, color: b.color || CAT_COLORS[b.category] || "#3b82f6", name: b.name, shortName: b.short_name || b.name, category: b.category, floors: b.floors };
        }), [buildings, elPositions]);

    const poiElements = useMemo(() =>
        pois.map((p) => {
            const pos = elPositions[p.id] || { x: 1500, y: 100, w: 20, h: 20 };
            return { id: p.id, x: pos.x, y: pos.y, color: POI_COLORS[p.category] || "#64748b", name: p.name, category: p.category };
        }), [pois, elPositions]);

    const navNodeElements = useMemo(() =>
        navNodes.map((n) => {
            const pos = elPositions[n.id] || { x: 100, y: 800, w: 12, h: 12 };
            return { id: n.id, x: pos.x, y: pos.y, color: NAV_COLORS[n.node_type] || "#64748b", label: n.label || n.node_type, nodeType: n.node_type };
        }), [navNodes, elPositions]);

    // ─── Canvas to world coordinates ───
    const screenToWorld = useCallback((sx: number, sy: number) => {
        return {
            x: (sx - panOffset.x) / zoom,
            y: (sy - panOffset.y) / zoom,
        };
    }, [zoom, panOffset]);

    const snapToGrid = useCallback((val: number) => {
        if (!snapEnabled) return val;
        return Math.round(val / GRID_SIZE) * GRID_SIZE;
    }, [snapEnabled]);

    // ─── Haversine distance ───
    const haversineDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }, []);

    // ─── Render Canvas ───
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;

        // Clear
        ctx.fillStyle = tc.canvasBg;
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(panOffset.x, panOffset.y);
        ctx.scale(zoom, zoom);

        // ── Grid ──
        const gridStep = GRID_SIZE;
        const startX = Math.floor(-panOffset.x / zoom / gridStep) * gridStep;
        const startY = Math.floor(-panOffset.y / zoom / gridStep) * gridStep;
        const endX = startX + w / zoom + gridStep * 2;
        const endY = startY + h / zoom + gridStep * 2;

        ctx.strokeStyle = tc.gridMinor;
        ctx.lineWidth = 0.5 / zoom;

        for (let x = startX; x <= endX; x += gridStep) {
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
            ctx.stroke();
        }
        for (let y = startY; y <= endY; y += gridStep) {
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
        }

        // Major grid lines every 5 cells
        ctx.strokeStyle = tc.gridMajor;
        ctx.lineWidth = 1 / zoom;
        const majorStep = gridStep * 5;
        const majorStartX = Math.floor(startX / majorStep) * majorStep;
        const majorStartY = Math.floor(startY / majorStep) * majorStep;

        for (let x = majorStartX; x <= endX; x += majorStep) {
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
            ctx.stroke();
        }
        for (let y = majorStartY; y <= endY; y += majorStep) {
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
        }

        // ── Buildings ──
        for (const b of buildingElements) {
            const isSelected = selectedItem?.type === "building" && selectedItem.data.id === b.id;

            // Fill
            ctx.fillStyle = b.color + "30";
            ctx.fillRect(b.x, b.y, b.w, b.h);

            // Border
            ctx.strokeStyle = isSelected ? tc.selBorder : b.color;
            ctx.lineWidth = isSelected ? 3 / zoom : 2 / zoom;
            ctx.strokeRect(b.x, b.y, b.w, b.h);

            // Selection handles
            if (isSelected) {
                const hs = 6 / zoom;
                ctx.fillStyle = tc.selBorder;
                ctx.fillRect(b.x - hs / 2, b.y - hs / 2, hs, hs);
                ctx.fillRect(b.x + b.w - hs / 2, b.y - hs / 2, hs, hs);
                ctx.fillRect(b.x - hs / 2, b.y + b.h - hs / 2, hs, hs);
                ctx.fillRect(b.x + b.w - hs / 2, b.y + b.h - hs / 2, hs, hs);
            }

            // Label
            const fontSize = Math.max(10, Math.min(14, 14 / Math.max(0.5, zoom)));
            ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
            ctx.fillStyle = tc.textPrimary;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const labelText = zoom < 0.6 ? (b.shortName.slice(0, 10)) : b.name;
            ctx.fillText(labelText, b.x + b.w / 2, b.y + b.h / 2 - 8);

            // Category tag
            ctx.font = `${Math.max(8, fontSize - 3)}px Inter, system-ui, sans-serif`;
            ctx.fillStyle = tc.textSecondary;
            ctx.fillText(`${b.category} · ${b.floors}F`, b.x + b.w / 2, b.y + b.h / 2 + 10);
        }

        // ── POIs ──
        for (const p of poiElements) {
            const isSelected = selectedItem?.type === "poi" && selectedItem.data.id === p.id;
            const r = isSelected ? 14 : 10;

            ctx.beginPath();
            ctx.arc(p.x, p.y, r / zoom * zoom, 0, Math.PI * 2);
            ctx.fillStyle = p.color + "40";
            ctx.fill();
            ctx.strokeStyle = isSelected ? tc.selBorder : p.color;
            ctx.lineWidth = isSelected ? 3 / zoom : 2 / zoom;
            ctx.stroke();

            // Inner dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();

            // Label
            if (zoom >= 0.5) {
                ctx.font = `${Math.max(9, 11)}px Inter, system-ui, sans-serif`;
                ctx.fillStyle = tc.textPrimary;
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                ctx.fillText(p.name, p.x, p.y + r + 4);
            }
        }

        // ── Nav Graph ──
        if (showNavGraph) {
            // Edges
            for (const edge of navEdges) {
                const fromNode = navNodeElements.find((n) => n.id === edge.from_node_id);
                const toNode = navNodeElements.find((n) => n.id === edge.to_node_id);
                if (!fromNode || !toNode) continue;

                ctx.beginPath();
                ctx.moveTo(fromNode.x, fromNode.y);
                ctx.lineTo(toNode.x, toNode.y);
                ctx.strokeStyle = "#a855f780";
                ctx.lineWidth = 2 / zoom;
                ctx.setLineDash([6 / zoom, 4 / zoom]);
                ctx.stroke();
                ctx.setLineDash([]);

                // Weight label at midpoint
                if (zoom >= 0.7) {
                    const mx = (fromNode.x + toNode.x) / 2;
                    const my = (fromNode.y + toNode.y) / 2;
                    ctx.font = `${9}px monospace`;
                    ctx.fillStyle = "#a855f7";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(`${Math.round(edge.weight)}m`, mx, my - 6);
                }
            }

            // Nodes
            for (const n of navNodeElements) {
                const isSelected = selectedItem?.type === "navnode" && selectedItem.data.id === n.id;
                const isEdgeStart = edgeStartNode === n.id;
                const r = isSelected || isEdgeStart ? 8 : 6;

                ctx.beginPath();
                ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
                ctx.fillStyle = isEdgeStart ? "#a855f7" : n.color;
                ctx.fill();
                ctx.strokeStyle = isSelected ? tc.selBorder : isEdgeStart ? "#c084fc" : tc.selBorderAlpha;
                ctx.lineWidth = isSelected ? 3 / zoom : 2 / zoom;
                ctx.stroke();

                // Label
                if (zoom >= 0.6) {
                    ctx.font = `${9}px Inter, system-ui, sans-serif`;
                    ctx.fillStyle = tc.textTertiary;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "top";
                    ctx.fillText(n.label, n.x, n.y + r + 3);
                }
            }
        }

        // ── Drawing preview ──
        // Rectangle preview
        if (drawMode === "rect" && isDrawing && drawStart && drawCurrent) {
            const x = Math.min(drawStart.x, drawCurrent.x);
            const y = Math.min(drawStart.y, drawCurrent.y);
            const rw = Math.abs(drawCurrent.x - drawStart.x);
            const rh = Math.abs(drawCurrent.y - drawStart.y);

            ctx.fillStyle = "#3b82f620";
            ctx.fillRect(x, y, rw, rh);
            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 2 / zoom;
            ctx.setLineDash([6 / zoom, 3 / zoom]);
            ctx.strokeRect(x, y, rw, rh);
            ctx.setLineDash([]);

            // Size label
            ctx.font = `${10}px monospace`;
            ctx.fillStyle = "#3b82f6";
            ctx.textAlign = "center";
            ctx.fillText(`${Math.round(rw)} × ${Math.round(rh)}`, x + rw / 2, y - 8);
        }

        // Marquee selection preview
        if (marqueeStart && marqueeCurrent) {
            const x = Math.min(marqueeStart.x, marqueeCurrent.x);
            const y = Math.min(marqueeStart.y, marqueeCurrent.y);
            const rw = Math.abs(marqueeCurrent.x - marqueeStart.x);
            const rh = Math.abs(marqueeCurrent.y - marqueeStart.y);

            ctx.fillStyle = "#3b82f615";
            ctx.fillRect(x, y, rw, rh);
            ctx.strokeStyle = "#3b82f6";
            ctx.lineWidth = 1 / zoom;
            ctx.strokeRect(x, y, rw, rh);
        }

        // Polygon drawing preview
        if (drawMode === "polygon" && polygonPoints.length > 0) {
            ctx.beginPath();
            ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
            for (let i = 1; i < polygonPoints.length; i++) {
                ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
            }
            if (drawCurrent) {
                ctx.lineTo(drawCurrent.x, drawCurrent.y);
            }
            ctx.strokeStyle = "#22c55e";
            ctx.lineWidth = 2 / zoom;
            ctx.setLineDash([6 / zoom, 3 / zoom]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw vertices
            for (const pt of polygonPoints) {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = "#22c55e";
                ctx.fill();
            }
        }

        // Line drawing preview
        if (drawMode === "line" && linePoints.length > 0) {
            ctx.beginPath();
            ctx.moveTo(linePoints[0].x, linePoints[0].y);
            for (let i = 1; i < linePoints.length; i++) {
                ctx.lineTo(linePoints[i].x, linePoints[i].y);
            }
            if (drawCurrent) {
                ctx.lineTo(drawCurrent.x, drawCurrent.y);
            }
            ctx.strokeStyle = "#f59e0b";
            ctx.lineWidth = 3 / zoom;
            ctx.stroke();

            for (const pt of linePoints) {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = "#f59e0b";
                ctx.fill();
            }
        }

        ctx.restore();

        // ── Origin marker ──
        const ox = panOffset.x;
        const oy = panOffset.y;
        ctx.fillStyle = "#475569";
        ctx.font = "10px monospace";
        ctx.textAlign = "left";
        ctx.fillText("0,0", ox + 4, oy - 4);

    }, [zoom, panOffset, buildingElements, poiElements, navNodeElements, navEdges,
        showNavGraph, selectedItem, drawMode, isDrawing, drawStart, drawCurrent,
        polygonPoints, linePoints, edgeStartNode, tc]);

    // ─── Resize handler ───
    useEffect(() => {
        const resize = () => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            render();
        };

        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, [render]);

    // ─── Animation loop ───
    useEffect(() => {
        let rafId: number;
        const loop = () => {
            render();
            rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafId);
    }, [render]);

    // ─── Hit testing ───
    const hitTest = useCallback((wx: number, wy: number): { kind: string; id: string } | null => {
        // Check nav nodes first (smallest)
        if (showNavGraph) {
            for (const n of navNodeElements) {
                const dist = Math.hypot(wx - n.x, wy - n.y);
                if (dist < 12) return { kind: "navnode", id: n.id };
            }
        }

        // POIs
        for (const p of poiElements) {
            const dist = Math.hypot(wx - p.x, wy - p.y);
            if (dist < 16) return { kind: "poi", id: p.id };
        }

        // Buildings
        for (const b of buildingElements) {
            if (wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h) {
                return { kind: "building", id: b.id };
            }
        }

        return null;
    }, [buildingElements, poiElements, navNodeElements, showNavGraph]);

    // ─── Mouse handlers ───
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const world = screenToWorld(sx, sy);
        const snapped = { x: snapToGrid(world.x), y: snapToGrid(world.y) };

        // Middle mouse or space held or hand tool -> always pan
        if (e.button === 1 || spaceHeld || drawMode === "hand") {
            setIsPanning(true);
            setPanStart({ x: sx, y: sy });
            return;
        }

        if (drawMode === "select") {
            // Check resize handles first (for selected building)
            if (selectedItem?.type === "building" && selectedItem.data.id) {
                const bPos = elPositions[selectedItem.data.id];
                if (bPos) {
                    const hs = 8 / zoom;
                    const handles = [
                        { name: "nw", hx: bPos.x, hy: bPos.y },
                        { name: "ne", hx: bPos.x + bPos.w, hy: bPos.y },
                        { name: "sw", hx: bPos.x, hy: bPos.y + bPos.h },
                        { name: "se", hx: bPos.x + bPos.w, hy: bPos.y + bPos.h },
                    ];
                    for (const h of handles) {
                        if (Math.abs(world.x - h.hx) < hs && Math.abs(world.y - h.hy) < hs) {
                            setIsResizing(true);
                            setResizeHandle(h.name);
                            setResizeStart({ x: world.x, y: world.y, ox: bPos.x, oy: bPos.y, ow: bPos.w, oh: bPos.h });
                            return;
                        }
                    }
                }
            }

            const hit = hitTest(world.x, world.y);
            if (hit) {
                // Select + start drag
                const pos = elPositions[hit.id];
                const ox = pos ? world.x - pos.x : 0;
                const oy = pos ? world.y - pos.y : 0;
                setIsDragging(true);
                setDragTarget({ kind: hit.kind, id: hit.id, offsetX: ox, offsetY: oy });

                if (hit.kind === "building") {
                    const b = buildings.find((bb) => bb.id === hit.id);
                    if (b) {
                        setSelectedItem({
                            type: "building",
                            data: {
                                id: b.id, name: b.name, short_name: b.short_name || "", description: b.description || "",
                                category: b.category, floors: b.floors, latitude: b.latitude, longitude: b.longitude,
                                geo_polygon: b.geo_polygon, icon: b.icon, color: b.color, operating_hours: b.operating_hours || "",
                                sort_order: b.sort_order, label_visible_zoom: b.label_visible_zoom || 17, show_polygon: b.show_polygon ?? true,
                            },
                        });
                    }
                } else if (hit.kind === "poi") {
                    const p = pois.find((pp) => pp.id === hit.id);
                    if (p) {
                        setSelectedItem({
                            type: "poi",
                            data: { id: p.id, name: p.name, category: p.category, description: p.description || "", icon: p.icon, latitude: p.latitude, longitude: p.longitude, building_id: p.building_id || "" },
                        });
                    }
                } else if (hit.kind === "navnode") {
                    const n = navNodes.find((nn) => nn.id === hit.id);
                    if (n) {
                        setSelectedItem({
                            type: "navnode",
                            data: { id: n.id, latitude: n.latitude, longitude: n.longitude, node_type: n.node_type, label: n.label || "", building_id: n.building_id || "" },
                        });
                    }
                }
                return;
            }

            // No hit -> start marquee selection (group select)
            setMarqueeStart(world);
            setMarqueeCurrent(world);
            setSelectedItem(null);
        } else if (drawMode === "rect") {
            setIsDrawing(true);
            setDrawStart(snapped);
            setDrawCurrent(snapped);
        } else if (drawMode === "polygon") {
            setPolygonPoints((prev) => [...prev, snapped]);
        } else if (drawMode === "line") {
            setLinePoints((prev) => [...prev, snapped]);
        } else if (drawMode === "marker") {
            // Place a new POI
            const newPOI: POIData = {
                name: "",
                category: "amenity",
                description: "",
                icon: "map-pin",
                latitude: mapCenter[0],
                longitude: mapCenter[1],
                building_id: "",
                cx: snapped.x,
                cy: snapped.y,
            };
            setSelectedItem({ type: "poi", data: newPOI });
            setHasChanges(true);
        } else if (drawMode === "label") {
            // Labels are just markers with text for now
            const newPOI: POIData = {
                name: "Label",
                category: "other",
                description: "",
                icon: "flag",
                latitude: mapCenter[0],
                longitude: mapCenter[1],
                building_id: "",
                cx: snapped.x,
                cy: snapped.y,
            };
            setSelectedItem({ type: "poi", data: newPOI });
            setHasChanges(true);
        } else if (drawMode === "navnode") {
            const newNode: NavNodeData = {
                latitude: mapCenter[0],
                longitude: mapCenter[1],
                node_type: "waypoint",
                label: "",
                building_id: "",
                cx: snapped.x,
                cy: snapped.y,
            };
            setSelectedItem({ type: "navnode", data: newNode });
            setHasChanges(true);
        } else if (drawMode === "navedge") {
            const hit = hitTest(world.x, world.y);
            if (hit?.kind === "navnode") {
                if (!edgeStartNode) {
                    setEdgeStartNode(hit.id);
                    toast.info("Start node selected. Click another node to connect.");
                } else if (edgeStartNode !== hit.id) {
                    // Create edge!
                    const startNode = navNodes.find((n) => n.id === edgeStartNode);
                    const endNode = navNodes.find((n) => n.id === hit.id);
                    if (startNode && endNode) {
                        const weight = Math.round(haversineDistance(
                            startNode.latitude, startNode.longitude,
                            endNode.latitude, endNode.longitude
                        )) || 10;

                        saveNavEdge(slug, {
                            from_node_id: edgeStartNode,
                            to_node_id: hit.id,
                            weight,
                            edge_type: "walkway",
                        }).then((newEdge) => {
                            setNavEdges((prev) => [...prev, newEdge]);
                            saveNavEdge(slug, {
                                from_node_id: hit.id,
                                to_node_id: edgeStartNode!,
                                weight,
                                edge_type: "walkway",
                            }).then((revEdge) => {
                                setNavEdges((prev) => [...prev, revEdge]);
                            });
                            toast.success(`Connected nodes (${weight}m)`);
                        }).catch((err: any) => {
                            toast.error("Edge creation failed: " + err.message);
                        });
                    }
                    setEdgeStartNode(null);
                }
            }
        } else if (drawMode === "eraser") {
            const hit = hitTest(world.x, world.y);
            if (hit) {
                if (hit.kind === "building") {
                    const b = buildings.find((bb) => bb.id === hit.id);
                    if (b) {
                        deleteBuildingAction(slug, b.id)
                            .then(() => {
                                setBuildings((prev) => prev.filter((bb) => bb.id !== b.id));
                                toast.success("Building deleted");
                            })
                            .catch((err: any) => toast.error(err.message));
                    }
                } else if (hit.kind === "poi") {
                    deletePOIAction(slug, hit.id)
                        .then(() => {
                            setPOIs((prev) => prev.filter((p) => p.id !== hit.id));
                            toast.success("POI deleted");
                        })
                        .catch((err: any) => toast.error(err.message));
                } else if (hit.kind === "navnode") {
                    deleteNavNodeAction(slug, hit.id)
                        .then(() => {
                            setNavNodes((prev) => prev.filter((n) => n.id !== hit.id));
                            setNavEdges((prev) => prev.filter((e) => e.from_node_id !== hit.id && e.to_node_id !== hit.id));
                            toast.success("Nav node deleted");
                        })
                        .catch((err: any) => toast.error(err.message));
                }
            }
        }
    }, [drawMode, screenToWorld, snapToGrid, hitTest, buildings, pois, navNodes, edgeStartNode, slug, mapCenter, haversineDistance]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const world = screenToWorld(sx, sy);
        const snapped = { x: snapToGrid(world.x), y: snapToGrid(world.y) };

        // Dragging element
        if (isDragging && dragTarget) {
            const newX = snapToGrid(world.x - dragTarget.offsetX);
            const newY = snapToGrid(world.y - dragTarget.offsetY);
            setElPositions((prev) => ({ ...prev, [dragTarget.id]: { ...prev[dragTarget.id], x: newX, y: newY } }));
            setHasChanges(true);
            return;
        }

        // Resizing element
        if (isResizing && resizeHandle && resizeStart && selectedItem?.data.id) {
            const dx = world.x - resizeStart.x;
            const dy = world.y - resizeStart.y;
            let nx = resizeStart.ox, ny = resizeStart.oy, nw = resizeStart.ow, nh = resizeStart.oh;

            if (resizeHandle.includes("e")) {
                nw = Math.max(40, resizeStart.ow + dx);
            }
            if (resizeHandle.includes("s")) {
                nh = Math.max(30, resizeStart.oh + dy);
            }
            if (resizeHandle.includes("w")) {
                const maxDx = resizeStart.ow - 40;
                const actualDx = Math.min(dx, maxDx);
                nx = resizeStart.ox + actualDx;
                nw = resizeStart.ow - actualDx;
            }
            if (resizeHandle.includes("n")) {
                const maxDy = resizeStart.oh - 30;
                const actualDy = Math.min(dy, maxDy);
                ny = resizeStart.oy + actualDy;
                nh = resizeStart.oh - actualDy;
            }

            setElPositions((prev) => ({ ...prev, [selectedItem.data.id!]: { x: snapToGrid(nx), y: snapToGrid(ny), w: snapToGrid(nw), h: snapToGrid(nh) } }));
            setHasChanges(true);
            return;
        }

        if (isPanning && panStart) {
            setPanOffset((prev) => ({
                x: prev.x + (sx - panStart.x),
                y: prev.y + (sy - panStart.y),
            }));
            setPanStart({ x: sx, y: sy });
            return;
        }

        if (marqueeStart) {
            setMarqueeCurrent(world);
            return;
        }

        if (drawMode === "rect" && isDrawing) {
            setDrawCurrent(snapped);
        }

        if (drawMode === "polygon" && polygonPoints.length > 0) {
            setDrawCurrent(snapped);
        }

        if (drawMode === "line" && linePoints.length > 0) {
            setDrawCurrent(snapped);
        }
    }, [isPanning, panStart, drawMode, isDrawing, screenToWorld, snapToGrid, polygonPoints, linePoints, isDragging, dragTarget, isResizing, resizeHandle, resizeStart, selectedItem]);

    const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        // End drag
        if (isDragging) {
            pushUndo();
            setIsDragging(false);
            setDragTarget(null);
            setHasChanges(true); // Dragging changes elPositions
            return;
        }

        // End resize
        if (isResizing) {
            pushUndo();
            setIsResizing(false);
            setResizeHandle(null);
            setResizeStart(null);
            return;
        }

        if (isPanning) {
            setIsPanning(false);
            setPanStart(null);
            return;
        }

        if (marqueeStart && marqueeCurrent) {
            const x = Math.min(marqueeStart.x, marqueeCurrent.x);
            const y = Math.min(marqueeStart.y, marqueeCurrent.y);
            const w = Math.abs(marqueeCurrent.x - marqueeStart.x);
            const h = Math.abs(marqueeCurrent.y - marqueeStart.y);

            // Phase 1 Group select: find first building inside marquee and select it
            const hitBuilding = buildingElements.find(b =>
                b.x >= x && b.y >= y && (b.x + b.w) <= (x + w) && (b.y + b.h) <= (y + h)
            );

            if (hitBuilding) {
                const b = buildings.find(bb => bb.id === hitBuilding.id);
                if (b) {
                    setSelectedItem({
                        type: "building",
                        data: {
                            id: b.id, name: b.name, short_name: b.short_name || "", description: b.description || "",
                            category: b.category, floors: b.floors, latitude: b.latitude, longitude: b.longitude,
                            geo_polygon: b.geo_polygon, icon: b.icon, color: b.color, operating_hours: b.operating_hours || "",
                            sort_order: b.sort_order, label_visible_zoom: b.label_visible_zoom || 17, show_polygon: b.show_polygon ?? true,
                        },
                    });
                }
            }

            setMarqueeStart(null);
            setMarqueeCurrent(null);
            return;
        }

        // Finish rectangle
        if (drawMode === "rect" && isDrawing && drawStart && drawCurrent) {
            pushUndo();
            const x = Math.min(drawStart.x, drawCurrent.x);
            const y = Math.min(drawStart.y, drawCurrent.y);
            const rw = Math.abs(drawCurrent.x - drawStart.x);
            const rh = Math.abs(drawCurrent.y - drawStart.y);

            if (rw > 20 && rh > 20) {
                const newBuilding: BuildingData = {
                    name: "", short_name: "", description: "", category: "academic", floors: 1,
                    latitude: mapCenter[0], longitude: mapCenter[1], icon: "building-2", color: "#3b82f6",
                    operating_hours: "", sort_order: buildings.length, label_visible_zoom: 17, show_polygon: true,
                    cx: x, cy: y, cw: rw, ch: rh,
                };
                setSelectedItem({ type: "building", data: newBuilding });
                setHasChanges(true);
            }

            setIsDrawing(false);
            setDrawStart(null);
            setDrawCurrent(null);
        }
    }, [isPanning, drawMode, isDrawing, drawStart, drawCurrent, mapCenter, buildings.length, isDragging, isResizing]);

    // Double-click to finish polygon/line
    const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (drawMode === "polygon" && polygonPoints.length >= 3) {
            // Create building from polygon
            const bounds = polygonPoints.reduce(
                (acc, pt) => ({
                    minX: Math.min(acc.minX, pt.x),
                    minY: Math.min(acc.minY, pt.y),
                    maxX: Math.max(acc.maxX, pt.x),
                    maxY: Math.max(acc.maxY, pt.y),
                }),
                { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
            );

            const newBuilding: BuildingData = {
                name: "",
                short_name: "",
                description: "",
                category: "academic",
                floors: 1,
                latitude: mapCenter[0],
                longitude: mapCenter[1],
                icon: "building-2",
                color: "#22c55e",
                operating_hours: "",
                sort_order: buildings.length,
                label_visible_zoom: 17,
                show_polygon: true,
                cx: bounds.minX,
                cy: bounds.minY,
                cw: bounds.maxX - bounds.minX,
                ch: bounds.maxY - bounds.minY,
            };
            setSelectedItem({ type: "building", data: newBuilding });
            setHasChanges(true);
            setPolygonPoints([]);
            setDrawCurrent(null);
        }

        if (drawMode === "line" && linePoints.length >= 2) {
            toast.info("Generating navigation path...");

            // Transform line points (already snapped world coords) to coordinate payload
            const pathNodes = linePoints.map((pt, i) => ({
                id: crypto.randomUUID(), // Temp ID
                latitude: mapCenter[0] + (pt.y * 0.00001), // Very rough projection
                longitude: mapCenter[1] + (pt.x * 0.00001),
                node_type: "waypoint",
                cx: pt.x,
                cy: pt.y
            }));

            // Create nodes synchronously to get IDs
            const createPath = async () => {
                setSaving(true);
                try {
                    const savedNodes: MapNavNode[] = [];
                    for (const node of pathNodes) {
                        const saved = await saveNavNode(slug, {
                            latitude: node.latitude,
                            longitude: node.longitude,
                            node_type: node.node_type
                        });
                        setElPositions(prev => ({ ...prev, [saved.id]: { x: node.cx, y: node.cy, w: 12, h: 12 } }));
                        savedNodes.push(saved);
                    }

                    setNavNodes(prev => [...prev, ...savedNodes]);

                    // Connect edges
                    const newEdges: any[] = [];
                    for (let i = 0; i < savedNodes.length - 1; i++) {
                        const fromNode = savedNodes[i];
                        const toNode = savedNodes[i + 1];
                        const weight = Math.round(haversineDistance(
                            fromNode.latitude, fromNode.longitude,
                            toNode.latitude, toNode.longitude
                        )) || 5;

                        const edgeForwards = await saveNavEdge(slug, {
                            from_node_id: fromNode.id,
                            to_node_id: toNode.id,
                            weight, edge_type: "walkway"
                        });

                        const edgeBackwards = await saveNavEdge(slug, {
                            from_node_id: toNode.id,
                            to_node_id: fromNode.id,
                            weight, edge_type: "walkway"
                        });

                        newEdges.push(edgeForwards, edgeBackwards);
                    }
                    setNavEdges(prev => [...prev, ...newEdges]);

                    toast.success(`Created path with ${savedNodes.length} nodes`);
                    setHasChanges(true); // Positional data changed
                    pushUndo();
                } catch (err: any) {
                    toast.error("Failed to save path: " + err.message);
                } finally {
                    setSaving(false);
                    setLinePoints([]);
                    setDrawCurrent(null);
                    setDrawMode("select");
                }
            };

            createPath();
        }
    }, [drawMode, polygonPoints, linePoints, mapCenter, buildings.length, slug, haversineDistance, pushUndo]);

    // ─── Delete handler (declared before keyboard shortcuts to avoid forward ref) ───
    const handleDeleteItem = useCallback(async () => {
        if (!selectedItem || !selectedItem.data.id) return;
        pushUndo();
        setSaving(true);
        try {
            if (selectedItem.type === "building") {
                await deleteBuildingAction(slug, selectedItem.data.id);
                setBuildings((prev) => prev.filter((b) => b.id !== selectedItem.data.id));
                toast.success("Building deleted");
            } else if (selectedItem.type === "poi") {
                await deletePOIAction(slug, selectedItem.data.id);
                setPOIs((prev) => prev.filter((p) => p.id !== selectedItem.data.id));
                toast.success("POI deleted");
            } else if (selectedItem.type === "navnode") {
                await deleteNavNodeAction(slug, selectedItem.data.id);
                setNavNodes((prev) => prev.filter((n) => n.id !== selectedItem.data.id));
                setNavEdges((prev) => prev.filter((e) => e.from_node_id !== selectedItem.data.id && e.to_node_id !== selectedItem.data.id));
                toast.success("Nav node deleted");
            }
            setSelectedItem(null);
        } catch (err: any) {
            toast.error("Delete failed: " + err.message);
        } finally {
            setSaving(false);
        }
    }, [selectedItem, slug]);

    // ─── Wheel zoom (native listener to bypass React passive) ───
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const handleNativeWheel = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const factor = e.deltaY < 0 ? 1.12 : 0.88;
            setZoom((prevZoom) => {
                const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prevZoom * factor));
                setPanOffset((prev) => {
                    const wx = (mx - prev.x) / prevZoom;
                    const wy = (my - prev.y) / prevZoom;
                    return { x: mx - wx * newZoom, y: my - wy * newZoom };
                });
                return newZoom;
            });
        };
        canvas.addEventListener("wheel", handleNativeWheel, { passive: false });
        return () => canvas.removeEventListener("wheel", handleNativeWheel);
    }, []);

    // ─── Keyboard shortcuts (skip when typing in inputs) ───
    useEffect(() => {
        const handlerDown = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable) return;

            if (e.code === "Space") {
                e.preventDefault(); // Prevent page scroll
                setSpaceHeld(true);
            }

            // Undo/Redo
            if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
                if (e.shiftKey) {
                    // Fire a custom event to trigger redo from the toolbar handler natively
                    window.dispatchEvent(new CustomEvent("map-editor-redo"));
                } else {
                    window.dispatchEvent(new CustomEvent("map-editor-undo"));
                }
                e.preventDefault();
                return;
            }

            if (e.key === "Escape") {
                setDrawMode("select");
                setPolygonPoints([]);
                setLinePoints([]);
                setDrawCurrent(null);
                setEdgeStartNode(null);
                setSelectedItem(null);
            }
            if (e.key === "v" || e.key === "V") setDrawMode("select");
            if (e.key === "h" || e.key === "H") setDrawMode("hand");
            if (e.key === "r" || e.key === "R") setDrawMode("rect");
            if (e.key === "p" || e.key === "P") setDrawMode("polygon");
            if (e.key === "l" || e.key === "L") setDrawMode("line");
            if (e.key === "m" || e.key === "M") setDrawMode("marker");
            if (e.key === "t" || e.key === "T") setDrawMode("label");
            if (e.key === "Delete" || e.key === "Backspace") {
                if (selectedItem?.data.id) {
                    handleDeleteItem();
                }
            }
        };

        const handlerUp = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                setSpaceHeld(false);
            }
        };

        window.addEventListener("keydown", handlerDown);
        window.addEventListener("keyup", handlerUp);
        return () => {
            window.removeEventListener("keydown", handlerDown);
            window.removeEventListener("keyup", handlerUp);
        };
    }, [selectedItem, handleDeleteItem]);

    // ─── Save handler ───
    const handleSaveItem = useCallback(async () => {
        if (!selectedItem) return;
        setSaving(true);

        try {
            if (selectedItem.type === "building") {
                const data = selectedItem.data;
                if (!data.name.trim()) {
                    toast.error("Building name is required");
                    setSaving(false);
                    return;
                }
                const result = await saveBuilding(slug, {
                    id: data.id,
                    name: data.name,
                    short_name: data.short_name || undefined,
                    description: data.description || undefined,
                    category: data.category,
                    floors: data.floors,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    geo_polygon: data.geo_polygon,
                    icon: data.icon,
                    color: data.color,
                    operating_hours: data.operating_hours || undefined,
                    sort_order: data.sort_order,
                    label_visible_zoom: data.label_visible_zoom,
                    show_polygon: data.show_polygon,
                });

                if (data.id) {
                    setBuildings((prev) => prev.map((b) => b.id === data.id ? result : b));
                } else {
                    setBuildings((prev) => [...prev, result]);
                    // Initialize canvas position from drawn rectangle
                    setElPositions(prev => ({
                        ...prev,
                        [result.id]: {
                            x: data.cx ?? 100 + buildings.length * 250,
                            y: data.cy ?? 100,
                            w: data.cw ?? 200,
                            h: data.ch ?? 120,
                        },
                    }));
                }
                setSelectedItem({ type: "building", data: { ...data, id: result.id } });
                toast.success("Building saved!");
            } else if (selectedItem.type === "poi") {
                const data = selectedItem.data;
                if (!data.name.trim()) {
                    toast.error("POI name is required");
                    setSaving(false);
                    return;
                }
                const result = await savePOI(slug, {
                    id: data.id,
                    name: data.name,
                    category: data.category,
                    description: data.description || undefined,
                    icon: data.icon,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    building_id: data.building_id || undefined,
                });

                if (data.id) {
                    setPOIs((prev) => prev.map((p) => p.id === data.id ? result : p));
                } else {
                    setPOIs((prev) => [...prev, result]);
                    // Initialize canvas position from clicked point
                    setElPositions(prev => ({
                        ...prev,
                        [result.id]: {
                            x: data.cx ?? 1500,
                            y: data.cy ?? 100,
                            w: 20,
                            h: 20,
                        },
                    }));
                }
                setSelectedItem({ type: "poi", data: { ...data, id: result.id } });
                toast.success("POI saved!");
            } else if (selectedItem.type === "navnode") {
                const data = selectedItem.data;
                const result = await saveNavNode(slug, {
                    id: data.id,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    node_type: data.node_type,
                    label: data.label || undefined,
                    building_id: data.building_id || undefined,
                });

                if (data.id) {
                    setNavNodes((prev) => prev.map((n) => n.id === data.id ? result : n));
                } else {
                    setNavNodes((prev) => [...prev, result]);
                    setElPositions(prev => ({
                        ...prev,
                        [result.id]: { x: data.cx ?? 100, y: data.cy ?? 800, w: 12, h: 12 },
                    }));
                }
                setSelectedItem({ type: "navnode", data: { ...data, id: result.id } });
                toast.success("Nav node saved!");
            }
            setHasChanges(false);
        } catch (err: any) {
            toast.error("Save failed: " + err.message);
        } finally {
            setSaving(false);
        }
    }, [selectedItem, slug]);

    // ─── Zoom controls ───
    const zoomIn = useCallback(() => {
        setZoom((z) => Math.min(MAX_ZOOM, z * 1.3));
    }, []);

    const zoomOut = useCallback(() => {
        setZoom((z) => Math.max(MIN_ZOOM, z / 1.3));
    }, []);

    const fitAll = useCallback(() => {
        setZoom(1);
        setPanOffset({ x: 200, y: 100 });
    }, []);

    // ─── Cursor style ───
    const cursor = useMemo(() => {
        if (spaceHeld || drawMode === "hand") {
            return isPanning ? "grabbing" : "grab";
        }
        switch (drawMode) {
            case "select": return "default";
            case "rect": return "crosshair";
            case "polygon": return "crosshair";
            case "line": return "crosshair";
            case "marker": return "crosshair";
            case "label": return "text";
            case "navnode": return "crosshair";
            case "navedge": return "pointer";
            case "eraser": return "not-allowed";
            default: return "default";
        }
    }, [drawMode, isPanning, spaceHeld]);

    return (
        <TooltipProvider delayDuration={200}>
            <div className="relative h-[calc(100vh-8rem)] w-full overflow-hidden rounded-xl border shadow-lg" style={{ backgroundColor: tc.canvasBg }}>
                {/* Status bar */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1001] flex items-center gap-2">
                    <Badge
                        variant="outline"
                        className="bg-background/90 backdrop-blur-sm shadow-sm px-3 py-1 gap-1.5"
                    >
                        <div className={`w-2 h-2 rounded-full ${drawMode === "select" ? "bg-green-500" : "bg-amber-500 animate-pulse"}`} />
                        <span className="text-xs font-medium capitalize">
                            {drawMode === "select" ? "Select Mode" :
                                drawMode === "navedge" ? "Connect Nodes" :
                                    drawMode === "eraser" ? "Delete Mode" :
                                        `Drawing: ${drawMode}`}
                        </span>
                    </Badge>
                    {edgeStartNode && (
                        <Badge variant="default" className="bg-purple-600 shadow-sm px-3 py-1 gap-1.5">
                            <span className="text-xs">Click target node...</span>
                            <button
                                className="ml-1 text-white/80 hover:text-white"
                                onClick={() => setEdgeStartNode(null)}
                            >
                                ✕
                            </button>
                        </Badge>
                    )}
                    <Badge variant="outline" className="bg-background/90 backdrop-blur-sm shadow-sm px-3 py-1">
                        <span className="text-xs text-muted-foreground">
                            {buildings.length} buildings · {pois.length} POIs · {navNodes.length} nodes
                        </span>
                    </Badge>
                </div>

                {/* Keyboard shortcut hints (desktop only) */}
                <div className="hidden md:block absolute bottom-3 left-1/2 -translate-x-1/2 z-[1001]">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm shadow-sm px-3 py-1">
                        <span className="text-[10px] text-muted-foreground font-mono">
                            V select · R rect · P polygon · L line · M marker · T label · Esc cancel · Del delete
                        </span>
                    </Badge>
                </div>

                {/* Canvas */}
                <div ref={containerRef} className="absolute inset-0">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full"
                        style={{ cursor, touchAction: "none" }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onDoubleClick={handleDoubleClick}
                        onContextMenu={(e) => e.preventDefault()}
                        onTouchStart={(e) => {
                            if (e.touches.length === 2) {
                                // Pinch start
                                const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                                (canvasRef.current as any).__pinchDist = d;
                                (canvasRef.current as any).__pinchZoom = zoom;
                                e.preventDefault();
                            } else if (e.touches.length === 1) {
                                const t = e.touches[0];
                                handleMouseDown({ clientX: t.clientX, clientY: t.clientY, target: e.target } as any);
                            }
                        }}
                        onTouchMove={(e) => {
                            if (e.touches.length === 2 && (canvasRef.current as any).__pinchDist) {
                                const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                                const ratio = d / (canvasRef.current as any).__pinchDist;
                                const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, (canvasRef.current as any).__pinchZoom * ratio));
                                setZoom(newZoom);
                                e.preventDefault();
                            } else if (e.touches.length === 1) {
                                const t = e.touches[0];
                                handleMouseMove({ clientX: t.clientX, clientY: t.clientY } as any);
                            }
                        }}
                        onTouchEnd={(e) => {
                            (canvasRef.current as any).__pinchDist = null;
                            handleMouseUp({} as any);
                        }}
                    />
                </div>

                {/* Toolbar */}
                <MapEditorToolbar
                    activeMode={drawMode}
                    onModeChange={(mode) => {
                        setDrawMode(mode);
                        setEdgeStartNode(null);
                        setPolygonPoints([]);
                        setLinePoints([]);
                        setDrawCurrent(null);
                    }}
                    snapEnabled={snapEnabled}
                    onSnapToggle={() => setSnapEnabled(!snapEnabled)}
                    onUndo={() => window.dispatchEvent(new CustomEvent("map-editor-undo"))}
                    onRedo={() => window.dispatchEvent(new CustomEvent("map-editor-redo"))}
                    canUndo={historyIndex >= 0}
                    canRedo={historyIndex + 1 < history.length}
                    onSave={handleSaveItem}
                    saving={saving}
                    isAutoSaving={isAutoSaving}
                    showNavGraph={showNavGraph}
                    onToggleNavGraph={() => setShowNavGraph(!showNavGraph)}
                    hasChanges={hasChanges}
                    zoom={zoom}
                    onZoomIn={zoomIn}
                    onZoomOut={zoomOut}
                    onFitAll={fitAll}
                    onHelp={() => window.open(`/campus/${slug}/admin/map-guide`, '_blank')}
                />

                {/* Property Panel */}
                <MapPropertyPanel
                    selectedItem={selectedItem}
                    onUpdate={setSelectedItem}
                    onSave={handleSaveItem}
                    onDelete={handleDeleteItem}
                    onClose={() => setSelectedItem(null)}
                    onManageFloors={() => {
                        if (selectedItem?.type === 'building' && selectedItem.data.id) {
                            loadFloorPlans(selectedItem.data.id);
                            setShowFloorPlanOverlay(true);
                        }
                    }}
                    saving={saving}
                />
            </div>

            {/* Floor Manager Overlay */}
            {showFloorPlanOverlay && selectedItem?.type === 'building' && selectedItem.data.id && !editingFloorPlan && (
                <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-background rounded-xl shadow-2xl border w-full max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h3 className="font-semibold">Manage Floors: {selectedItem.data.name}</h3>
                            <Button variant="ghost" size="icon" onClick={() => setShowFloorPlanOverlay(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="p-4 space-y-4">
                            {loadingFloorPlans ? (
                                <div className="text-sm text-muted-foreground text-center py-4">Loading floors...</div>
                            ) : (
                                <div className="space-y-2">
                                    {Array.from({ length: selectedItem.data.floors || 1 }, (_, i) => i + 1).map((floorNum) => {
                                        const plan = activeBuildingFloorPlans.find(p => p.floor_number === floorNum);
                                        return (
                                            <div key={floorNum} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                                <div>
                                                    <div className="font-medium text-sm">Floor {floorNum}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {plan ? `${plan.elements?.length || 0} elements` : "Not configured"}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {plan && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                                            onClick={async () => {
                                                                if (!confirm(`Delete floor plan for Floor ${floorNum}?`)) return;
                                                                try {
                                                                    setSaving(true);
                                                                    await deleteFloorPlanAction(plan.id!);
                                                                    setActiveBuildingFloorPlans(prev => prev.filter(p => p.id !== plan.id));
                                                                    toast.success("Floor plan deleted");
                                                                } catch (e: any) {
                                                                    toast.error("Failed to delete floor plan");
                                                                } finally {
                                                                    setSaving(false);
                                                                }
                                                            }}
                                                            disabled={saving}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setEditingFloorPlan({ plan, number: floorNum })}
                                                        disabled={saving}
                                                    >
                                                        {plan ? "Edit Plan" : "Create Plan"}
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Actual Floor Plan Editor Overlay */}
            {editingFloorPlan && selectedItem?.type === 'building' && selectedItem.data.id && (
                <div className="fixed inset-0 z-[2100] bg-background">
                    <FloorPlanEditor
                        initialFloorPlan={editingFloorPlan.plan}
                        buildingId={selectedItem.data.id as string}
                        floorNumber={editingFloorPlan.number}
                        buildingName={(selectedItem.data as BuildingData).name || "Building"}
                        onSave={async (plan) => {
                            try {
                                setSaving(true);
                                const saved = await saveFloorPlan({ ...plan, elements: plan.elements || [] });
                                setActiveBuildingFloorPlans(prev => {
                                    const exists = prev.find(p => p.id === saved.id || p.floor_number === saved.floor_number);
                                    if (exists) return prev.map(p => p.floor_number === saved.floor_number ? saved : p);
                                    return [...prev, saved].sort((a, b) => a.floor_number - b.floor_number);
                                });
                                toast.success("Floor plan saved successfully");
                                setEditingFloorPlan(null);
                            } catch (e: any) {
                                toast.error(e.message || "Failed to save floor plan");
                            } finally {
                                setSaving(false);
                            }
                        }}
                        onClose={() => setEditingFloorPlan(null)}
                    />
                </div>
            )}
        </TooltipProvider>
    );
}
