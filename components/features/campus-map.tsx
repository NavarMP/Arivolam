"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    MapPin, Navigation, X, Search, Building2, Coffee, Car,
    GraduationCap, Dumbbell, ChevronDown, Layers, Moon, Heart,
    Wifi, Bus, Droplets, Landmark, LogIn, Route, Clock, ChevronRight,
    Library, FlaskConical, BedDouble, Trophy, Utensils, ChevronUp,
    Locate, Compass, Star, Flag, ZoomIn, ZoomOut, Maximize2,
    ArrowRight, ArrowUpRight, ArrowDownRight, CornerDownRight, Footprints,
    Minimize, Globe, DoorOpen
} from "lucide-react";
import { FloorPlanViewer, type FloorPlan } from "../campus/floor-plan";
import { getFloorPlans } from "@/app/campus/[slug]/admin/map-editor/floor-plan-actions";
import { toast } from "sonner";
import { latToY, lonToX } from "@/lib/map-projection";
import dynamic from "next/dynamic";

const OSMBaseLayer = dynamic(() => import("../campus/osm-base-layer"), { ssr: false });

// ─── Direction step type ───
interface DirectionStep {
    instruction: string;
    distance: number;
    icon: "start" | "straight" | "left" | "right" | "arrive";
    nodeName?: string;
}

// ─── Types ───
interface Building {
    id: string; name: string; short_name: string | null; description: string | null;
    category: string; floors: number; latitude: number; longitude: number;
    geo_polygon?: any; icon: string; color: string; operating_hours: string | null;
    sort_order: number; label_visible_zoom?: number; show_polygon?: boolean; rooms?: Room[];
    canvas_x?: number; canvas_y?: number; canvas_w?: number; canvas_h?: number;
}
interface Room {
    id: string; building_id: string; name: string; room_number: string | null;
    room_type: string; capacity: number | null; description: string | null;
    latitude: number | null; longitude: number | null; floor_number?: number;
}
interface POI {
    id: string; name: string; category: string; description: string | null;
    icon: string; latitude: number; longitude: number; building_id: string | null;
    canvas_x?: number; canvas_y?: number;
}
interface NavNode {
    id: string; latitude: number; longitude: number; node_type: string;
    label: string | null; building_id: string | null;
    canvas_x?: number; canvas_y?: number;
}
interface NavEdge { id: string; from_node_id: string; to_node_id: string; weight: number; }

// ─── Icon mapping ───
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    school: GraduationCap, "flask-conical": FlaskConical, library: Library,
    "building-2": Building2, "bed-double": BedDouble, moon: Moon, utensils: Utensils,
    trophy: Trophy, "log-in": LogIn, car: Car, landmark: Landmark, droplets: Droplets,
    wifi: Wifi, "heart-pulse": Heart, coffee: Coffee, bus: Bus, "map-pin": MapPin,
    dumbbell: Dumbbell, star: Star, flag: Flag, compass: Compass,
};
const CATEGORIES = [
    { key: "all", label: "All", icon: Layers },
    { key: "academic", label: "Academic", icon: GraduationCap },
    { key: "facility", label: "Facilities", icon: Building2 },
    { key: "hostel", label: "Hostel", icon: BedDouble },
    { key: "recreation", label: "Sports", icon: Dumbbell },
    { key: "religious", label: "Religious", icon: Moon },
    { key: "food", label: "Food", icon: Coffee },
    { key: "transport", label: "Transport", icon: Bus },
];
const CAT_COLORS: Record<string, string> = {
    academic: "#3b82f6", administrative: "#ef4444", facility: "#f59e0b",
    hostel: "#06b6d4", recreation: "#22c55e", religious: "#059669",
    food: "#d97706", transport: "#8b5cf6", medical: "#dc2626", residential: "#14b8a6",
};
const POI_COLORS: Record<string, string> = {
    entrance: "#22c55e", parking: "#6366f1", atm: "#f59e0b", amenity: "#06b6d4",
    health: "#ef4444", food: "#d97706", transport: "#8b5cf6", sports: "#10b981",
    emergency: "#dc2626", other: "#64748b",
};

// ─── A* Pathfinding ───
function aStarPath(nodes: NavNode[], edges: NavEdge[], startId: string, endId: string): NavNode[] | null {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const start = nodeMap.get(startId);
    const end = nodeMap.get(endId);
    if (!start || !end) return null;

    const heuristic = (a: NavNode, b: NavNode) => {
        const R = 6371000;
        const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
        const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
        const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.latitude * Math.PI) / 180) * Math.cos((b.latitude * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    };

    const adj = new Map<string, { to: string; weight: number }[]>();
    for (const e of edges) {
        if (!adj.has(e.from_node_id)) adj.set(e.from_node_id, []);
        adj.get(e.from_node_id)!.push({ to: e.to_node_id, weight: e.weight });
    }

    const openSet = new Set<string>([startId]);
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>(); gScore.set(startId, 0);
    const fScore = new Map<string, number>(); fScore.set(startId, heuristic(start, end));

    while (openSet.size > 0) {
        let current = ""; let best = Infinity;
        for (const id of openSet) { const f = fScore.get(id) ?? Infinity; if (f < best) { best = f; current = id; } }
        if (current === endId) {
            const path: NavNode[] = [];
            let c: string | undefined = endId;
            while (c) { path.unshift(nodeMap.get(c)!); c = cameFrom.get(c); }
            return path;
        }
        openSet.delete(current);
        for (const neighbor of adj.get(current) || []) {
            const tentG = (gScore.get(current) ?? Infinity) + neighbor.weight;
            if (tentG < (gScore.get(neighbor.to) ?? Infinity)) {
                cameFrom.set(neighbor.to, current);
                gScore.set(neighbor.to, tentG);
                fScore.set(neighbor.to, tentG + heuristic(nodeMap.get(neighbor.to)!, end));
                openSet.add(neighbor.to);
            }
        }
    }
    return null;
}

// ─── Constants ───
const GRID_SIZE = 25;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 50;

// ─── Theme palettes ───
const THEME_COLORS = {
    dark: {
        canvasBg: "#0f172a",
        gridMinor: "#1e293b",
        gridMajor: "#334155",
        textPrimary: "#e2e8f0",
        textSecondary: "#94a3b8",
        textTertiary: "#64748b",
        labelBg: "#1e293be0",
        roomBg: "#1e293b80",
        roomBorder: "#334155",
        roomText: "#cbd5e1",
        selBorder: "#ffffff",
        iconText: "#ffffff",
    },
    light: {
        canvasBg: "#f8fafc",
        gridMinor: "#e2e8f0",
        gridMajor: "#cbd5e1",
        textPrimary: "#1e293b",
        textSecondary: "#475569",
        textTertiary: "#94a3b8",
        labelBg: "#ffffffe0",
        roomBg: "#f1f5f980",
        roomBorder: "#e2e8f0",
        roomText: "#334155",
        selBorder: "#1e293b",
        iconText: "#ffffff",
    },
};

// ─── Props ───
interface CampusMapProps { buildings?: Building[]; pois?: POI[]; navNodes?: NavNode[]; navEdges?: NavEdge[]; slug?: string; mapStyle?: any; initialDestination?: string; }

// ─── Main Component ───
export function CampusMap({ buildings: propBuildings, pois: propPois, navNodes: propNavNodes, navEdges: propNavEdges, mapStyle, initialDestination }: CampusMapProps) {
    const buildings = propBuildings ?? DEFAULT_BUILDINGS;
    const pois = propPois ?? DEFAULT_POIS;
    const navNodes = propNavNodes ?? DEFAULT_NAV_NODES;
    const navEdges = propNavEdges ?? DEFAULT_NAV_EDGES;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { resolvedTheme } = useTheme();
    const tc = THEME_COLORS[resolvedTheme === "light" ? "light" : "dark"];

    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
    const [positionAccuracy, setPositionAccuracy] = useState<number>(0);
    const [routePath, setRoutePath] = useState<NavNode[] | null>(null);
    const [routeInfo, setRouteInfo] = useState<{ distance: number; time: number } | null>(null);
    const [showDirectory, setShowDirectory] = useState(false);
    const [isTracking, setIsTracking] = useState(false);
    const [navSteps, setNavSteps] = useState<DirectionStep[]>([]);
    const [showNavPanel, setShowNavPanel] = useState(false);
    const [navDestination, setNavDestination] = useState<Building | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [showBaseMap, setShowBaseMap] = useState(false);

    // Floor plans state
    const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
    const [loadingFloorPlans, setLoadingFloorPlans] = useState(false);
    const [showFloorPlanOverlay, setShowFloorPlanOverlay] = useState(false);
    const [viewingFloorPlan, setViewingFloorPlan] = useState<FloorPlan | null>(null);

    // Canvas state
    const [manualStartPt, setManualStartPt] = useState<{ id: string, name: string } | null>(null);
    const boundaryPolygon = useMemo(() => {
        if (mapStyle?.boundary_polygon) {
            try {
                const parsed = typeof mapStyle.boundary_polygon === "string" ? JSON.parse(mapStyle.boundary_polygon) : mapStyle.boundary_polygon;
                if (Array.isArray(parsed)) return parsed as { x: number; y: number }[];
            } catch (e) { }
        }
        return [];
    }, [mapStyle]);

    // Canvas panning/zooming state
    const [zoom, setZoom] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 200, y: 100 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
    const [animPhase, setAnimPhase] = useState(0);

    const [spaceHeld, setSpaceHeld] = useState(false);
    useEffect(() => {
        const handlerDown = (e: KeyboardEvent) => {
            if (e.code === "Space" && !e.repeat && document.activeElement?.tagName !== "INPUT") {
                e.preventDefault();
                setSpaceHeld(true);
            }
        };
        const handlerUp = (e: KeyboardEvent) => {
            if (e.code === "Space") setSpaceHeld(false);
        };
        window.addEventListener("keydown", handlerDown);
        window.addEventListener("keyup", handlerUp);
        return () => { window.removeEventListener("keydown", handlerDown); window.removeEventListener("keyup", handlerUp); };
    }, []);

    // Fullscreen state
    const mapWrapperRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const handleToggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            mapWrapperRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Element positions (auto-layout from initial data)
    const elPositions = useMemo(() => {
        const pos: Record<string, { x: number; y: number; w: number; h: number }> = {};
        buildings.forEach((b, i) => { pos[b.id] = { x: b.canvas_x ?? (100 + (i % 5) * 280), y: b.canvas_y ?? (100 + Math.floor(i / 5) * 220), w: b.canvas_w ?? 220, h: b.canvas_h ?? 140 }; });
        pois.forEach((p, i) => { pos[p.id] = { x: p.canvas_x ?? (1600 + (i % 4) * 100), y: p.canvas_y ?? (100 + Math.floor(i / 4) * 100), w: 24, h: 24 }; });
        navNodes.forEach((n, i) => { pos[n.id] = { x: n.canvas_x ?? (100 + (i % 8) * 140), y: n.canvas_y ?? (900 + Math.floor(i / 8) * 140), w: 12, h: 12 }; });
        return pos;
    }, [buildings, pois, navNodes]);

    // ─── GPS tracking ───
    useEffect(() => {
        if (typeof navigator === "undefined" || !navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => { setUserPosition([pos.coords.latitude, pos.coords.longitude]); setPositionAccuracy(pos.coords.accuracy); },
            (err) => { console.warn("Geolocation unavailable or denied:", err.message); }
        );
        const watchId = navigator.geolocation.watchPosition(
            (pos) => { setUserPosition([pos.coords.latitude, pos.coords.longitude]); setPositionAccuracy(pos.coords.accuracy); setIsTracking(true); },
            (err) => { console.warn("Geolocation watch stopped:", err.message); setIsTracking(false); },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    useEffect(() => { if (showSearch && searchInputRef.current) searchInputRef.current.focus(); }, [showSearch]);

    // Animation timer (for route dashes)
    useEffect(() => {
        const iv = setInterval(() => setAnimPhase((p) => (p + 1) % 60), 80);
        return () => clearInterval(iv);
    }, []);

    // Load floor plans when building selected
    useEffect(() => {
        if (selectedBuilding) {
            setLoadingFloorPlans(true);
            getFloorPlans(selectedBuilding.id)
                .then(plans => setFloorPlans(plans))
                .catch(console.error)
                .finally(() => setLoadingFloorPlans(false));
        } else {
            setFloorPlans([]);
        }
    }, [selectedBuilding]);

    // ─── Filtering ───
    const filteredBuildings = buildings.filter((b) => {
        const matchCategory = selectedCategory === "all" || b.category === selectedCategory;
        const matchSearch = searchQuery === "" || b.name.toLowerCase().includes(searchQuery.toLowerCase()) || (b.short_name || "").toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });
    const filteredPois = pois.filter((p) => {
        const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
        const matchSearch = searchQuery === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });
    const allSearchResults = useMemo(() => [
        ...buildings.filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase()) || (b.short_name || "").toLowerCase().includes(searchQuery.toLowerCase())).map((b) => ({ type: "building" as const, item: b })),
        ...pois.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((p) => ({ type: "poi" as const, item: p })),
        ...buildings.flatMap((b) => (b.rooms || []).filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || (r.room_number || "").toLowerCase().includes(searchQuery.toLowerCase()) || r.room_type.toLowerCase().replace('_', ' ').includes(searchQuery.toLowerCase())).map((r) => ({ type: "room" as const, item: r, building: b }))),
    ], [searchQuery, buildings, pois]);

    // ─── Coordinate helpers ───
    const screenToWorld = useCallback((sx: number, sy: number) => ({
        x: (sx - panOffset.x) / zoom, y: (sy - panOffset.y) / zoom,
    }), [zoom, panOffset]);

    // ─── Generate turn-by-turn directions ───
    const generateDirections = useCallback((path: NavNode[]): DirectionStep[] => {
        if (path.length < 2) return [];
        const steps: DirectionStep[] = [];
        steps.push({ instruction: `Start at ${path[0].label || "starting point"}`, distance: 0, icon: "start", nodeName: path[0].label || undefined });

        for (let i = 0; i < path.length - 1; i++) {
            const cur = path[i], next = path[i + 1];
            const edge = navEdges.find((e) => e.from_node_id === cur.id && e.to_node_id === next.id);
            const dist = edge?.weight || 10;

            // Calculate turn direction using bearing
            let turnIcon: DirectionStep["icon"] = "straight";
            if (i > 0) {
                const prev = path[i - 1];
                const bearIn = Math.atan2(cur.longitude - prev.longitude, cur.latitude - prev.latitude);
                const bearOut = Math.atan2(next.longitude - cur.longitude, next.latitude - cur.latitude);
                let angle = ((bearOut - bearIn) * 180 / Math.PI + 360) % 360;
                if (angle > 180) angle -= 360;
                if (angle > 30) turnIcon = "right";
                else if (angle < -30) turnIcon = "left";
            }

            const isLast = i === path.length - 2;
            if (isLast) {
                steps.push({ instruction: `Arrive at ${next.label || "destination"}`, distance: dist, icon: "arrive", nodeName: next.label || undefined });
            } else if (next.node_type === "junction" && next.label) {
                const verb = turnIcon === "left" ? "Turn left" : turnIcon === "right" ? "Turn right" : "Continue";
                steps.push({ instruction: `${verb} at ${next.label}`, distance: dist, icon: turnIcon, nodeName: next.label });
            } else {
                steps.push({ instruction: `Walk ${dist}m towards ${next.label || "next point"}`, distance: dist, icon: turnIcon, nodeName: next.label || undefined });
            }
        }
        return steps;
    }, [navEdges]);

    // ─── GPS Projection ───
    const gpsToCanvas = useCallback((lat: number, lon: number) => {
        const anchorLat = mapStyle?.center_lat || 11.2274;
        const anchorLon = mapStyle?.center_lng || 75.9104;
        const anchorX = lonToX(anchorLon);
        const anchorY = latToY(anchorLat);
        return {
            x: lonToX(lon) - anchorX,
            y: latToY(lat) - anchorY
        };
    }, [mapStyle]);

    // ─── Navigate to building ───
    const navigateToBuilding = useCallback((building: Building) => {
        // Geofencing Check (Only if relying on GPS)
        if (!manualStartPt && userPosition) {
            const userCanvasPt = gpsToCanvas(userPosition[0], userPosition[1]);

            if (boundaryPolygon.length >= 3 && userCanvasPt) {
                let isInside = false;
                for (let i = 0, j = boundaryPolygon.length - 1; i < boundaryPolygon.length; j = i++) {
                    const xi = boundaryPolygon[i].x, yi = boundaryPolygon[i].y;
                    const xj = boundaryPolygon[j].x, yj = boundaryPolygon[j].y;
                    const intersect = ((yi > userCanvasPt.y) !== (yj > userCanvasPt.y))
                        && (userCanvasPt.x < (xj - xi) * (userCanvasPt.y - yi) / (yj - yi) + xi);
                    if (intersect) isInside = !isInside;
                }

                if (!isInside) {
                    const targetLat = building.latitude || 11.2274;
                    const targetLon = building.longitude || 75.9104;
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLon}`, "_blank");
                    toast.success("You are outside the campus boundary. Routing externally via Google Maps.");
                    return;
                }
            } else {
                // Fallback to generic distance check if boundary not drawn
                let sumLat = 0, sumLon = 0, count = 0;
                buildings.forEach(b => { if (b.latitude && b.longitude) { sumLat += b.latitude; sumLon += b.longitude; count++; } });
                if (count > 0) {
                    const centerLat = sumLat / count;
                    const centerLon = sumLon / count;
                    const R = 6371000;
                    const dLat = (userPosition[0] - centerLat) * Math.PI / 180;
                    const dLon = (userPosition[1] - centerLon) * Math.PI / 180;
                    const a = Math.sin(dLat / 2) ** 2 + Math.cos(centerLat * Math.PI / 180) * Math.cos(userPosition[0] * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
                    const distanceToCampus = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                    if (distanceToCampus > 200) {
                        const targetLat = building.latitude || centerLat;
                        const targetLon = building.longitude || centerLon;
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLon}`, "_blank");
                        toast.success("Opening Google Maps for external routing.");
                        return;
                    }
                }
            }
        }

        let buildingNode = navNodes.find((n) => n.building_id === building.id && n.node_type === "entrance");

        if (!buildingNode && navNodes.length > 0) {
            let minDist = Infinity;
            for (const node of navNodes) {
                const dist = Math.hypot(node.latitude - building.latitude, node.longitude - building.longitude);
                if (dist < minDist) { minDist = dist; buildingNode = node; }
            }
        }

        if (!buildingNode) { toast.error("No navigation pathways available nearby."); setSelectedBuilding(building); return; }
        let startNode = undefined;

        if (manualStartPt) {
            // Priority 1: User selected a manual start point
            // Check if it's a building
            const manualB = buildings.find(b => b.id === manualStartPt.id);
            if (manualB) {
                startNode = navNodes.find(n => n.building_id === manualB.id && n.node_type === "entrance");
                if (!startNode) {
                    let minDist = Infinity;
                    for (const node of navNodes) {
                        const dist = Math.hypot(node.latitude - manualB.latitude, node.longitude - manualB.longitude);
                        if (dist < minDist) { minDist = dist; startNode = node; }
                    }
                }
            } else {
                // Must be a POI
                const manualP = pois.find(p => p.id === manualStartPt.id);
                if (manualP) {
                    let minDist = Infinity;
                    for (const node of navNodes) {
                        const dist = Math.hypot(node.latitude - manualP.latitude, node.longitude - manualP.longitude);
                        if (dist < minDist) { minDist = dist; startNode = node; }
                    }
                }
            }
        } else if (userPosition) {
            // Priority 2: GPS Coordinate
            let minDist = Infinity;
            for (const node of navNodes) {
                const dist = Math.hypot(node.latitude - userPosition[0], node.longitude - userPosition[1]);
                if (dist < minDist) { minDist = dist; startNode = node; }
            }
        } else {
            // Priority 3: Fallback map anchor
            startNode = navNodes.find((n) => n.label?.toLowerCase() === "main gate") || navNodes[0];
        }

        if (!startNode) { toast.error("No start location available."); return; }

        const path = aStarPath(navNodes, navEdges, startNode.id, buildingNode.id);
        if (path) {
            setRoutePath(path);
            const steps = generateDirections(path);
            setNavSteps(steps);
            setShowNavPanel(true);
            setNavDestination(building);
            let totalWeight = 0;
            for (let i = 0; i < path.length - 1; i++) {
                const edge = navEdges.find((e) => e.from_node_id === path[i].id && e.to_node_id === path[i + 1].id);
                if (edge) totalWeight += edge.weight;
            }
            setRouteInfo({ distance: totalWeight, time: Math.ceil(totalWeight / 80) });
        } else {
            toast.error("No continuous route found to destination.");
        }
        setSelectedBuilding(building);
    }, [navNodes, navEdges, userPosition, generateDirections, buildings, pois, manualStartPt, boundaryPolygon, gpsToCanvas]);

    const clearRoute = () => { setRoutePath(null); setRouteInfo(null); setNavSteps([]); setShowNavPanel(false); setNavDestination(null); };

    // ─── Deep-link: auto-navigate to initialDestination ───
    const initialDestHandled = useRef(false);
    useEffect(() => {
        if (!initialDestination || initialDestHandled.current) return;
        initialDestHandled.current = true;
        const dest = initialDestination.toLowerCase().trim();
        // Try matching by room number first
        for (const b of buildings) {
            if (b.rooms) {
                const room = b.rooms.find(r =>
                    r.room_number?.toLowerCase() === dest ||
                    r.name.toLowerCase().includes(dest)
                );
                if (room) {
                    setSelectedBuilding(b);
                    setTimeout(() => navigateToBuilding(b), 500);
                    return;
                }
            }
        }
        // Try matching by building name or short_name
        const matchedBuilding = buildings.find(b =>
            b.name.toLowerCase().includes(dest) ||
            (b.short_name || "").toLowerCase().includes(dest)
        );
        if (matchedBuilding) {
            setSelectedBuilding(matchedBuilding);
            setTimeout(() => navigateToBuilding(matchedBuilding), 500);
            return;
        }
        // Try matching by POI name
        const matchedPoi = pois.find(p => p.name.toLowerCase().includes(dest));
        if (matchedPoi) {
            const poiBuilding = matchedPoi.building_id ? buildings.find(b => b.id === matchedPoi.building_id) : null;
            if (poiBuilding) {
                setSelectedBuilding(poiBuilding);
                setTimeout(() => navigateToBuilding(poiBuilding), 500);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialDestination]);



    // ─── Hit testing ───
    const hitTestBuilding = useCallback((wx: number, wy: number): Building | null => {
        for (const b of filteredBuildings) {
            const pos = elPositions[b.id]; if (!pos) continue;
            if (wx >= pos.x && wx <= pos.x + pos.w && wy >= pos.y && wy <= pos.y + pos.h) return b;
        }
        return null;
    }, [filteredBuildings, elPositions]);

    const cursor = spaceHeld || isPanning ? "grabbing" : "grab";
    // ─── Canvas Rendering ───
    const render = useCallback(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext("2d"); if (!ctx) return;
        const w = canvas.width, h = canvas.height;

        // Background — transparent when OSM base map is active
        if (showBaseMap) {
            ctx.clearRect(0, 0, w, h);
        } else {
            ctx.fillStyle = tc.canvasBg;
            ctx.fillRect(0, 0, w, h);
        }

        ctx.save();
        ctx.translate(panOffset.x, panOffset.y);
        ctx.scale(zoom, zoom);

        // Grid (hidden when OSM base map is active)
        if (!showBaseMap) {
            const gridStep = GRID_SIZE;
            const startX = Math.floor(-panOffset.x / zoom / gridStep) * gridStep;
            const startY = Math.floor(-panOffset.y / zoom / gridStep) * gridStep;
            const endX = startX + w / zoom + gridStep * 2;
            const endY = startY + h / zoom + gridStep * 2;

            ctx.strokeStyle = tc.gridMinor; ctx.lineWidth = 0.5 / zoom;
            for (let x = startX; x <= endX; x += gridStep) { ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke(); }
            for (let y = startY; y <= endY; y += gridStep) { ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke(); }
            // Major grid
            ctx.strokeStyle = tc.gridMajor; ctx.lineWidth = 1 / zoom;
            const ms = gridStep * 5;
            for (let x = Math.floor(startX / ms) * ms; x <= endX; x += ms) { ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke(); }
            for (let y = Math.floor(startY / ms) * ms; y <= endY; y += ms) { ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke(); }
        }

        // Buildings
        for (const b of filteredBuildings) {
            const pos = elPositions[b.id]; if (!pos) continue;
            const col = b.color || CAT_COLORS[b.category] || "#3b82f6";
            const isSel = selectedBuilding?.id === b.id;

            // Shape Rendering Selection
            const hasCircle = b.geo_polygon?.includes('"shape":"circle"');
            const hasPolygon = b.show_polygon && b.geo_polygon && b.geo_polygon.startsWith("[");

            // Shadow & Fill
            ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 8 / zoom; ctx.shadowOffsetY = 2 / zoom;
            ctx.fillStyle = col + "25";
            ctx.beginPath();
            let polyOk = false;

            if (hasCircle) {
                ctx.arc(pos.x + pos.w / 2, pos.y + pos.h / 2, pos.w / 2, 0, Math.PI * 2);
                polyOk = true;
            } else if (hasPolygon) {
                try {
                    const pts = JSON.parse(b.geo_polygon);
                    if (Array.isArray(pts) && pts.length > 0) {
                        ctx.moveTo(pos.x + (pts[0].x - (b as any).cx!), pos.y + (pts[0].y - (b as any).cy!));
                        for (let i = 1; i < pts.length; i++) ctx.lineTo(pos.x + (pts[i].x - (b as any).cx!), pos.y + (pts[i].y - (b as any).cy!));
                        ctx.closePath();
                        polyOk = true;
                    }
                } catch (e) { }
            }

            if (!polyOk) {
                ctx.roundRect(pos.x, pos.y, pos.w, pos.h, 6 / zoom);
            }
            ctx.fill();
            ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

            // Border
            ctx.strokeStyle = isSel ? tc.selBorder : col;
            ctx.lineWidth = isSel ? 3 / zoom : 2 / zoom;
            ctx.stroke();

            // Glow for selected
            if (isSel) {
                ctx.strokeStyle = col + "60"; ctx.lineWidth = 6 / zoom;
                ctx.beginPath();
                if (hasCircle) {
                    ctx.arc(pos.x + pos.w / 2, pos.y + pos.h / 2, (pos.w / 2) + (2 / zoom), 0, Math.PI * 2);
                } else {
                    ctx.roundRect(pos.x - 2, pos.y - 2, pos.w + 4, pos.h + 4, 8 / zoom);
                }
                ctx.stroke();
            }

            /* === PROGRESSIVE ZOOM DETAIL === */

            // Level 1 (zoom < 0.3): Just shapes + category color
            // Level 2 (zoom 0.3–0.7): + short name + floor dot
            // Level 3 (zoom 0.7–1.5): + full name + category label + room count
            // Level 4 (zoom 1.5–3.0): + description + operating hours
            // Level 5 (zoom 3.0–6.0): + room list for ALL buildings
            // Level 6 (zoom > 6.0): + room capacity, type, details

            if (zoom >= 0.3) {
                // Icon dot
                ctx.beginPath(); ctx.arc(pos.x + 18, pos.y + 18, 10, 0, Math.PI * 2);
                ctx.fillStyle = col; ctx.fill();
                ctx.fillStyle = tc.iconText; ctx.font = `bold ${10}px Inter, system-ui`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                ctx.fillText(b.floors.toString(), pos.x + 18, pos.y + 18);
            }

            if (zoom < 0.7) {
                // Short name only
                if (zoom >= 0.3) {
                    const fSize = Math.max(9, 11);
                    ctx.font = `600 ${fSize}px Inter, system-ui`; ctx.fillStyle = tc.textPrimary; ctx.textAlign = "left"; ctx.textBaseline = "top";
                    ctx.fillText((b.short_name || b.name).slice(0, 12), pos.x + 36, pos.y + 14, pos.w - 44);
                }
            } else {
                // Full name (zoom >= 0.7)
                const fSize = Math.max(10, 13);
                ctx.font = `600 ${fSize}px Inter, system-ui`; ctx.fillStyle = tc.textPrimary; ctx.textAlign = "left"; ctx.textBaseline = "top";
                ctx.fillText(b.name, pos.x + 36, pos.y + 12, pos.w - 44);

                // Category + floors
                ctx.font = `${10}px Inter, system-ui`; ctx.fillStyle = tc.textSecondary;
                ctx.fillText(`${b.category} · ${b.floors}F`, pos.x + 36, pos.y + 30, pos.w - 44);

                // Room count badge
                if (b.rooms && b.rooms.length > 0) {
                    ctx.font = `${9}px Inter, system-ui`; ctx.fillStyle = tc.textSecondary;
                    ctx.fillText(`${b.rooms.length} rooms`, pos.x + 8, pos.y + pos.h - 14);
                }
            }

            // Description preview at zoom >= 1.5
            if (zoom >= 1.5 && b.description) {
                ctx.font = `${9}px Inter, system-ui`; ctx.fillStyle = tc.textSecondary;
                const desc = b.description.length > 60 ? b.description.slice(0, 60) + "..." : b.description;
                ctx.fillText(desc, pos.x + 8, pos.y + 48, pos.w - 16);
            }

            // Operating hours at zoom >= 1.5
            if (zoom >= 1.5 && b.operating_hours) {
                ctx.font = `${8}px Inter, system-ui`; ctx.fillStyle = tc.textSecondary;
                ctx.fillText(`🕐 ${b.operating_hours}`, pos.x + 8, pos.y + 60, pos.w - 16);
            }

            // Room list at zoom >= 3 (for ALL buildings, not just selected)
            if (zoom >= 3 && b.rooms && b.rooms.length > 0) {
                let ry = pos.y + (zoom >= 1.5 ? 75 : 48);
                const maxRooms = zoom >= 6 ? 12 : 6;
                const visibleRooms = b.rooms.slice(0, maxRooms);
                for (const room of visibleRooms) {
                    ctx.fillStyle = tc.roomBg;
                    ctx.fillRect(pos.x + 6, ry - 2, pos.w - 12, zoom >= 6 ? 28 : 18);
                    ctx.strokeStyle = tc.roomBorder; ctx.lineWidth = 0.5 / zoom;
                    ctx.strokeRect(pos.x + 6, ry - 2, pos.w - 12, zoom >= 6 ? 28 : 18);
                    ctx.font = `${9}px Inter, system-ui`; ctx.fillStyle = tc.roomText; ctx.textAlign = "left"; ctx.textBaseline = "middle";
                    ctx.fillText(`${room.room_number || "•"} ${room.name}`, pos.x + 10, ry + 6, pos.w - 28);

                    // Zoom >= 6: show capacity + room type
                    if (zoom >= 6) {
                        ctx.font = `${8}px Inter, system-ui`; ctx.fillStyle = tc.textSecondary;
                        const detail = `${room.room_type.replace("_", " ")}${room.capacity ? ` · ${room.capacity} seats` : ""}`;
                        ctx.fillText(detail, pos.x + 10, ry + 18, pos.w - 28);
                        if (room.capacity) {
                            ctx.textAlign = "right"; ctx.font = `bold ${9}px Inter, system-ui`; ctx.fillStyle = col;
                            ctx.fillText(`${room.capacity}`, pos.x + pos.w - 10, ry + 6);
                        }
                        ry += 30;
                    } else {
                        if (room.capacity) {
                            ctx.textAlign = "right"; ctx.fillStyle = tc.textSecondary;
                            ctx.fillText(`${room.capacity}`, pos.x + pos.w - 10, ry + 6);
                        }
                        ry += 20;
                    }
                    ctx.textAlign = "left";
                }
                if (b.rooms.length > maxRooms) {
                    ctx.font = `italic ${8}px Inter, system-ui`; ctx.fillStyle = tc.textSecondary;
                    ctx.fillText(`+${b.rooms.length - maxRooms} more...`, pos.x + 10, ry + 4);
                }
            }
        }

        // POIs
        for (const p of filteredPois) {
            const pos = elPositions[p.id]; if (!pos) continue;
            const col = POI_COLORS[p.category] || "#64748b";
            // Outer ring
            ctx.beginPath(); ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
            ctx.fillStyle = col + "30"; ctx.fill();
            ctx.strokeStyle = col; ctx.lineWidth = 2 / zoom; ctx.stroke();
            // Inner dot
            ctx.beginPath(); ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = col; ctx.fill();
            // Label
            if (zoom >= 0.6) {
                ctx.font = `${10}px Inter, system-ui`; ctx.fillStyle = tc.textPrimary;
                ctx.textAlign = "center"; ctx.textBaseline = "top";
                ctx.fillText(p.name, pos.x, pos.y + 16);
            }
        }

        // Base pathways overlay
        ctx.strokeStyle = tc.textSecondary + "40"; // Semi-transparent
        ctx.lineWidth = 1.5 / zoom;
        ctx.setLineDash([4 / zoom, 4 / zoom]);
        for (const edge of navEdges) {
            const fromPos = elPositions[edge.from_node_id];
            const toPos = elPositions[edge.to_node_id];
            if (!fromPos || !toPos) continue;
            ctx.beginPath();
            ctx.moveTo(fromPos.x, fromPos.y);
            ctx.lineTo(toPos.x, toPos.y);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Route path (animated with waypoints and arrows)
        if (routePath && routePath.length >= 2) {
            // Glow effect
            ctx.save();
            ctx.shadowColor = "#3b82f6"; ctx.shadowBlur = 12 / zoom;
            for (let i = 0; i < routePath.length - 1; i++) {
                const fromPos = elPositions[routePath[i].id];
                const toPos = elPositions[routePath[i + 1].id];
                if (!fromPos || !toPos) continue;
                ctx.beginPath();
                ctx.moveTo(fromPos.x, fromPos.y); ctx.lineTo(toPos.x, toPos.y);
                ctx.strokeStyle = "#3b82f680"; ctx.lineWidth = 8 / zoom;
                ctx.stroke();
            }
            ctx.restore();

            // Main dashed line
            for (let i = 0; i < routePath.length - 1; i++) {
                const fromPos = elPositions[routePath[i].id];
                const toPos = elPositions[routePath[i + 1].id];
                if (!fromPos || !toPos) continue;
                ctx.beginPath();
                ctx.moveTo(fromPos.x, fromPos.y); ctx.lineTo(toPos.x, toPos.y);
                ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 3 / zoom;
                ctx.setLineDash([10, 6]); ctx.lineDashOffset = -animPhase * 2;
                ctx.stroke(); ctx.setLineDash([]);

                // Direction arrow at midpoint
                const mx = (fromPos.x + toPos.x) / 2, my = (fromPos.y + toPos.y) / 2;
                const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x);
                const arrowSize = 6;
                ctx.save(); ctx.translate(mx, my); ctx.rotate(angle);
                ctx.beginPath(); ctx.moveTo(arrowSize, 0); ctx.lineTo(-arrowSize, -arrowSize * 0.6); ctx.lineTo(-arrowSize, arrowSize * 0.6); ctx.closePath();
                ctx.fillStyle = "#60a5fa"; ctx.fill();
                ctx.restore();
            }

            // Waypoint dots with labels
            for (let i = 0; i < routePath.length; i++) {
                const pos = elPositions[routePath[i].id]; if (!pos) continue;
                const isStart = i === 0, isEnd = i === routePath.length - 1;
                const r = isStart || isEnd ? 10 : 5;
                const col = isStart ? "#22c55e" : isEnd ? "#ef4444" : "#60a5fa";
                ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
                ctx.fillStyle = col; ctx.fill();
                ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2 / zoom; ctx.stroke();

                // Label at waypoints
                if (routePath[i].label && zoom >= 0.5) {
                    ctx.font = `bold ${9}px Inter, system-ui`;
                    ctx.fillStyle = "#ffffff";
                    ctx.textAlign = "center"; ctx.textBaseline = "bottom";
                    const label = isStart ? `▶ ${routePath[i].label}` : isEnd ? `◉ ${routePath[i].label}` : routePath[i].label!;
                    // Background pill
                    const tw = ctx.measureText(label).width + 8;
                    ctx.fillStyle = tc.labelBg;
                    ctx.beginPath(); ctx.roundRect(pos.x - tw / 2, pos.y - r - 18, tw, 16, 4); ctx.fill();
                    ctx.fillStyle = tc.textPrimary; ctx.fillText(label, pos.x, pos.y - r - 5);
                }
            }
        }

        // User Position (Blue Dot)
        if (userPosition) {
            const canvasPos = gpsToCanvas(userPosition[0], userPosition[1]);
            if (canvasPos) {
                ctx.beginPath();
                ctx.arc(canvasPos.x, canvasPos.y, 8 / zoom, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(59, 130, 246, 0.4)";
                ctx.fill();

                ctx.beginPath();
                ctx.arc(canvasPos.x, canvasPos.y, 4 / zoom, 0, Math.PI * 2);
                ctx.fillStyle = "#3b82f6";
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 1.5 / zoom;
                ctx.fill();
                ctx.stroke();
            }
        }

        ctx.restore();
    }, [zoom, panOffset, filteredBuildings, filteredPois, elPositions, selectedBuilding, routePath, animPhase, tc, showBaseMap, userPosition, gpsToCanvas]);

    // ─── Canvas resize ───
    const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
    useEffect(() => {
        const resize = () => {
            const canvas = canvasRef.current; const container = containerRef.current;
            if (!canvas || !container) return;
            canvas.width = container.clientWidth; canvas.height = container.clientHeight;
            setCanvasSize({ w: container.clientWidth, h: container.clientHeight });
        };
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);

    // ─── Animation loop ───
    useEffect(() => {
        let rafId: number;
        const loop = () => { render(); rafId = requestAnimationFrame(loop); };
        rafId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafId);
    }, [render]);

    // ─── Wheel zoom (native, non-passive) ───
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const handler = (e: WheelEvent) => {
            e.preventDefault(); e.stopPropagation();
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left, my = e.clientY - rect.top;
            const factor = e.deltaY < 0 ? 1.12 : 0.88;
            setZoom((prev) => {
                const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * factor));
                setPanOffset((po) => {
                    const wx = (mx - po.x) / prev, wy = (my - po.y) / prev;
                    return { x: mx - wx * nz, y: my - wy * nz };
                });
                return nz;
            });
        };
        canvas.addEventListener("wheel", handler, { passive: false });
        return () => canvas.removeEventListener("wheel", handler);
    }, []);

    // ─── Mouse handlers ───
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
        const world = screenToWorld(sx, sy);

        if (!spaceHeld) {
            const hit = hitTestBuilding(world.x, world.y);
            if (hit) {
                setSelectedBuilding(hit);
                clearRoute();
                return;
            }
        }
        setIsPanning(true);
        setPanStart({ x: sx, y: sy });
    }, [screenToWorld, hitTestBuilding, spaceHeld]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isPanning || !panStart) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
        setPanOffset((prev) => ({ x: prev.x + sx - panStart.x, y: prev.y + sy - panStart.y }));
        setPanStart({ x: sx, y: sy });
    }, [isPanning, panStart]);

    const handleMouseUp = useCallback(() => {
        setIsPanning(false); setPanStart(null);
    }, []);

    // Zoom controls
    const zoomIn = useCallback(() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.3)), []);
    const zoomOut = useCallback(() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.3)), []);
    const fitAll = useCallback(() => { setZoom(1); setPanOffset({ x: 200, y: 100 }); }, []);

    return (
        <div ref={mapWrapperRef} className={`relative w-full overflow-hidden border shadow-lg ${isFullscreen ? 'h-screen rounded-none' : 'h-[calc(100vh-8rem)] rounded-xl'}`} style={{ backgroundColor: tc.canvasBg, zIndex: isFullscreen ? 50 : 1 }}>
            {/* Canvas */}
            <div ref={containerRef} className="absolute inset-0">
                {showBaseMap && (
                    <OSMBaseLayer
                        panOffset={panOffset}
                        zoom={zoom}
                        canvasWidth={canvasSize.w}
                        canvasHeight={canvasSize.h}
                        anchorLat={mapStyle?.center_lat || 11.2274}
                        anchorLon={mapStyle?.center_lng || 75.9104}
                    />
                )}
                <canvas
                    ref={canvasRef} className="w-full h-full"
                    style={{ cursor, touchAction: "none", position: "relative", zIndex: 1 }}
                    onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
                    onContextMenu={(e) => e.preventDefault()}
                    onTouchStart={(e) => {
                        if (e.touches.length === 2) {
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
                    onTouchEnd={() => { (canvasRef.current as any).__pinchDist = null; handleMouseUp(); }}
                />
            </div>

            {/* Search bar */}
            <div className="absolute left-3 right-16 top-3 z-[1000] md:left-4 md:top-4 md:right-auto md:w-80">
                <div className="relative">
                    <div className="flex items-center gap-2 rounded-xl bg-background/95 px-3 py-2.5 shadow-lg backdrop-blur-sm border cursor-pointer md:px-4 md:py-3" onClick={() => setShowSearch(true)}>
                        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                        {showSearch ? (
                            <Input ref={searchInputRef} placeholder="Search campus..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0" />
                        ) : (
                            <span className="text-sm text-muted-foreground truncate">Search campus...</span>
                        )}
                        {showSearch && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); setShowSearch(false); setSearchQuery(""); }}>
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                    {showSearch && searchQuery.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="absolute left-0 right-0 top-full mt-2 rounded-xl bg-background/95 backdrop-blur-sm border shadow-lg overflow-hidden max-h-72">
                            <ScrollArea className="max-h-72">
                                {allSearchResults.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">No results found</div>
                                ) : (
                                    allSearchResults.map((result, idx) => {
                                        const isBuilding = result.type === "building";
                                        const isRoom = result.type === "room";
                                        const room = isRoom ? (result as any).item as Room : null;
                                        const bldg = isRoom ? (result as any).building as Building : (isBuilding ? result.item as Building : null);

                                        return (
                                            <button key={`${result.type}-${idx}`} className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors border-b last:border-0 md:gap-3 md:px-4 md:py-3"
                                                onClick={() => {
                                                    if (bldg) {
                                                        setSelectedBuilding(bldg);
                                                        // Automatically load and open the floor plan for the room
                                                        if (isRoom && room?.floor_number !== undefined) {
                                                            // We cannot open immediately because floorPlans are fetched via useEffect
                                                            // We can set a temporary state or just let the user see the building details
                                                            // where the floor plans will be available.
                                                        }
                                                    }
                                                    setShowSearch(false);
                                                    setSearchQuery("");
                                                }}>
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: bldg ? bldg.color + "20" : "#64748b20" }}>
                                                    {isBuilding ? <Building2 className="h-4 w-4" style={{ color: bldg?.color }} /> : isRoom ? <DoorOpen className="h-4 w-4" style={{ color: bldg?.color }} /> : <MapPin className="h-4 w-4 text-muted-foreground" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{isRoom ? `${room?.name}${room?.room_number ? ` (${room.room_number})` : ""}` : result.item.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{isBuilding ? bldg?.category : isRoom ? `${bldg?.name} • Floor ${room?.floor_number ?? 0}` : (result.item as POI).category}</p>
                                                </div>
                                                {bldg && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigateToBuilding(bldg);
                                                        setShowSearch(false);
                                                        setSearchQuery("");
                                                    }}>
                                                        <Navigation className="h-3.5 w-3.5 text-primary" />
                                                    </Button>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </ScrollArea>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Category filters — positioned below search with proper spacing */}
            <div className="absolute left-3 right-16 z-[999] overflow-x-auto md:left-4 md:right-auto md:w-80" style={{ top: showSearch && searchQuery.length > 0 ? undefined : '52px' }}>
                {(!showSearch || searchQuery.length === 0) && (
                    <div className="flex gap-1 pb-1 md:gap-1.5 pt-1">
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const isActive = selectedCategory === cat.key;
                            return (
                                <button key={cat.key} onClick={() => { setSelectedCategory(cat.key); clearRoute(); setSelectedBuilding(null); }}
                                    className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all shadow-sm md:gap-1.5 md:px-3 md:py-1.5 md:text-xs ${isActive ? "bg-primary text-primary-foreground" : "bg-background/90 text-foreground backdrop-blur-sm border hover:bg-muted"}`}>
                                    <Icon className="h-3 w-3 md:h-3.5 md:w-3.5" />{cat.label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Right controls: zoom + locate */}
            <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
                <div className="flex flex-col gap-1 rounded-xl bg-background/95 p-1 shadow-lg backdrop-blur-sm border">
                    <Button variant={showBaseMap ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setShowBaseMap(!showBaseMap)} title="Toggle Map Layer"><Globe className="h-4 w-4" /></Button>
                    <div className="w-full h-[1px] bg-border my-0.5" />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn} title="Zoom In"><ZoomIn className="h-4 w-4" /></Button>
                    <div className="flex flex-col items-center">
                        <Badge variant="outline" className="text-[10px] justify-center py-0.5 px-1 font-mono">{Math.round(zoom * 100)}%</Badge>
                        <span className="text-[8px] text-muted-foreground mt-0.5">
                            {zoom < 0.3 ? "Campus" : zoom < 0.7 ? "Overview" : zoom < 1.5 ? "Buildings" : zoom < 3 ? "Details" : zoom < 6 ? "Rooms" : "Full"}
                        </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut} title="Zoom Out"><ZoomOut className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fitAll} title="Fit All"><Maximize2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleToggleFullscreen} title="Fullscreen">
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                </div>
                <Button variant="secondary" size="icon" className={`h-10 w-10 rounded-xl shadow-lg ${isTracking ? "ring-2 ring-blue-500/50" : ""}`} disabled={!userPosition} title="My Location" onClick={() => {
                    if (userPosition) {
                        const pt = gpsToCanvas(userPosition[0], userPosition[1]);
                        if (pt && canvasRef.current) {
                            const cw = canvasRef.current.width;
                            const ch = canvasRef.current.height;
                            setZoom(1.5);
                            setPanOffset({
                                x: cw / 2 - pt.x * 1.5,
                                y: ch / 2 - pt.y * 1.5
                            });
                        }
                    }
                }}>
                    <Locate className={`h-4 w-4 ${isTracking ? "text-blue-500" : ""}`} />
                </Button>
            </div>

            {/* Building directory toggle */}
            <div className="absolute left-4 bottom-4 z-[1000]">
                <Button variant="secondary" size="sm" className="rounded-full shadow-lg gap-1.5" onClick={() => setShowDirectory(!showDirectory)}>
                    <Building2 className="h-4 w-4" />Directory
                    {showDirectory ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                </Button>
            </div>

            {/* Route info bar */}
            <AnimatePresence>
                {routeInfo && (
                    <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
                        <Card className="border-primary/30 shadow-lg">
                            <CardContent className="flex items-center gap-4 p-3">
                                <Route className="h-5 w-5 text-primary" />
                                <div className="text-sm"><span className="font-bold">{routeInfo.distance}m</span><span className="text-muted-foreground"> • ~{routeInfo.time} min walk</span></div>
                                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setShowNavPanel(!showNavPanel)}>
                                    <Footprints className="h-3.5 w-3.5" />
                                    {showNavPanel ? "Hide" : "Steps"}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearRoute}><X className="h-3 w-3" /></Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation Steps Panel */}
            <AnimatePresence>
                {showNavPanel && navSteps.length > 0 && (
                    <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute left-0 top-0 z-[1002] h-full w-72 border-r bg-background/95 backdrop-blur-sm shadow-2xl">
                        <div className="flex items-center justify-between px-4 pt-4 pb-2">
                            <div>
                                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                                    <Footprints className="h-4 w-4 text-primary" /> Directions
                                </h3>
                                {navDestination && (
                                    <p className="text-xs text-muted-foreground mt-0.5">To {navDestination.name}</p>
                                )}
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowNavPanel(false)}><X className="h-4 w-4" /></Button>
                        </div>
                        {routeInfo && (
                            <div className="mx-4 mb-3 rounded-lg bg-primary/10 p-2.5 flex items-center gap-2">
                                <Route className="h-4 w-4 text-primary" />
                                <span className="text-xs font-medium">{routeInfo.distance}m</span>
                                <span className="text-xs text-muted-foreground">• ~{routeInfo.time} min</span>
                            </div>
                        )}
                        <ScrollArea className="h-[calc(100%-120px)] px-4 pb-4">
                            <div className="space-y-1">
                                {navSteps.map((step, i) => {
                                    const StepIcon = step.icon === "start" ? MapPin
                                        : step.icon === "arrive" ? Flag
                                            : step.icon === "left" ? CornerDownRight
                                                : step.icon === "right" ? ArrowDownRight
                                                    : ArrowRight;
                                    const isFirst = i === 0, isLast = i === navSteps.length - 1;
                                    return (
                                        <div key={i} className="flex gap-3 relative">
                                            {/* Timeline connector */}
                                            <div className="flex flex-col items-center">
                                                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isFirst ? "bg-green-500/20 text-green-500" : isLast ? "bg-red-500/20 text-red-500" : "bg-blue-500/20 text-blue-500"}`}>
                                                    <StepIcon className="h-3.5 w-3.5" />
                                                </div>
                                                {!isLast && <div className="w-0.5 flex-1 bg-border my-1" />}
                                            </div>
                                            <div className="flex-1 pb-3">
                                                <p className="text-sm font-medium leading-tight">{step.instruction}</p>
                                                {step.distance > 0 && (
                                                    <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0">
                                                        {step.distance}m
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showDirectory && (
                    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute left-0 right-0 bottom-0 z-[1001] max-h-[50vh] rounded-t-2xl bg-background/95 backdrop-blur-sm border-t shadow-2xl">
                        <div className="flex items-center justify-between px-4 pt-3 pb-2">
                            <h3 className="font-semibold">Campus Directory</h3>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowDirectory(false)}><X className="h-4 w-4" /></Button>
                        </div>
                        <ScrollArea className="max-h-[calc(50vh-48px)] px-4 pb-4">
                            <div className="space-y-2">
                                {buildings.sort((a, b) => a.sort_order - b.sort_order).map((b) => {
                                    const Icon = ICON_MAP[b.icon] || Building2;
                                    return (
                                        <div key={b.id} className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-muted/50 transition-colors cursor-pointer"
                                            onClick={() => { setSelectedBuilding(b); setShowDirectory(false); }}>
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: b.color + "20" }}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{b.name}</p>
                                                <p className="text-xs text-muted-foreground capitalize">{b.category} • {b.floors} floor{b.floors > 1 ? "s" : ""}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 relative z-10" onClick={(e) => { e.stopPropagation(); navigateToBuilding(b); setShowDirectory(false); }}>
                                                <Navigation className="h-4 w-4 text-primary" />
                                            </Button>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Building Detail Panel */}
            <AnimatePresence>
                {selectedBuilding && (
                    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute right-0 top-0 z-[1002] h-full w-full max-w-sm border-l bg-background/95 backdrop-blur-sm shadow-2xl sm:w-80">
                        <ScrollArea className="h-full">
                            <div className="p-5">
                                <Button variant="ghost" size="icon" className="absolute right-3 top-3" onClick={() => { setSelectedBuilding(null); clearRoute(); }}><X className="h-4 w-4" /></Button>
                                <div className="mt-4 mb-5">
                                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: selectedBuilding.color + "20" }}>
                                        {(() => { const Icon = ICON_MAP[selectedBuilding.icon] || Building2; return <Icon className="h-6 w-6" style={{ color: selectedBuilding.color }} />; })()}
                                    </div>
                                    <h2 className="text-xl font-bold">{selectedBuilding.name}</h2>
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <Badge variant="outline" className="capitalize text-xs">{selectedBuilding.category}</Badge>
                                        <span className="text-xs text-muted-foreground">{selectedBuilding.floors} floor{selectedBuilding.floors > 1 ? "s" : ""}</span>
                                    </div>
                                </div>
                                {selectedBuilding.description && <p className="text-sm text-muted-foreground mb-4">{selectedBuilding.description}</p>}
                                {selectedBuilding.operating_hours && (
                                    <div className="flex items-center gap-2 mb-4 text-sm"><Clock className="h-4 w-4 text-muted-foreground" /><span>{selectedBuilding.operating_hours}</span></div>
                                )}
                                <div className="mb-4 p-3 bg-muted/30 rounded-lg border flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5" /> Starting Location
                                    </label>
                                    <select
                                        className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        value={manualStartPt?.id || ""}
                                        onChange={(e) => {
                                            if (!e.target.value) setManualStartPt(null);
                                            else {
                                                const b = buildings.find(x => x.id === e.target.value);
                                                if (b) setManualStartPt({ id: b.id, name: b.name });
                                                else {
                                                    const p = pois.find(x => x.id === e.target.value);
                                                    if (p) setManualStartPt({ id: p.id, name: p.name });
                                                }
                                            }
                                        }}
                                    >
                                        <option value="">Current Location (GPS)</option>
                                        <optgroup label="Buildings">
                                            {buildings.filter(b => b.id !== selectedBuilding.id).map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Points of Interest">
                                            {pois.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </div>
                                <div className="grid gap-4 mb-4">
                                    <Button className="w-full gap-2" onClick={() => navigateToBuilding(selectedBuilding)}>
                                        <Navigation className="h-4 w-4" />Navigate
                                    </Button>

                                    {/* Floor Selector */}
                                    {loadingFloorPlans ? (
                                        <div className="flex items-center justify-center p-3 border rounded-lg bg-muted/10 text-sm text-muted-foreground animate-pulse">
                                            <Layers className="h-4 w-4 mr-2" /> Loading floors...
                                        </div>
                                    ) : floorPlans.length > 0 ? (
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                                <Layers className="h-3.5 w-3.5" /> Floor Plans
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {floorPlans.sort((a, b) => a.floor_number - b.floor_number).map((plan) => (
                                                    <Button
                                                        key={plan.id}
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-9 px-4 font-medium"
                                                        onClick={() => setViewingFloorPlan(plan)}
                                                    >
                                                        Floor {plan.floor_number}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                                {selectedBuilding.rooms && selectedBuilding.rooms.length > 0 && (() => {
                                    // Group rooms by floor
                                    const floorGroups = new Map<number, Room[]>();
                                    selectedBuilding.rooms.forEach(room => {
                                        const f = room.floor_number ?? 0;
                                        if (!floorGroups.has(f)) floorGroups.set(f, []);
                                        floorGroups.get(f)!.push(room);
                                    });
                                    const sortedFloors = [...floorGroups.entries()].sort((a, b) => a[0] - b[0]);

                                    return (
                                        <div>
                                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                                                <DoorOpen className="h-4 w-4 text-primary" />
                                                Rooms & Facilities
                                                <Badge variant="secondary" className="text-[10px] ml-auto">{selectedBuilding.rooms.length}</Badge>
                                            </h3>
                                            <div className="space-y-3">
                                                {sortedFloors.map(([floor, floorRooms]) => (
                                                    <div key={floor}>
                                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
                                                            {floor === 0 ? "Ground Floor" : `Floor ${floor}`}
                                                        </p>
                                                        <div className="space-y-1.5">
                                                            {floorRooms.map((room) => (
                                                                <div key={room.id} className="rounded-lg border p-2.5 bg-muted/20 hover:bg-muted/40 transition-colors group">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-1.5">
                                                                                {room.room_number && (
                                                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono shrink-0">
                                                                                        {room.room_number}
                                                                                    </Badge>
                                                                                )}
                                                                                <p className="text-sm font-medium truncate">{room.name}</p>
                                                                            </div>
                                                                            <p className="text-[11px] text-muted-foreground capitalize mt-0.5">
                                                                                {room.room_type.replace("_", " ")}{room.capacity ? ` · ${room.capacity} seats` : ""}
                                                                            </p>
                                                                        </div>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                navigateToBuilding(selectedBuilding);
                                                                            }}
                                                                            title={`Navigate to ${room.name}`}
                                                                        >
                                                                            <Navigation className="h-3.5 w-3.5 text-primary" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </ScrollArea>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floor Manager Overlay */}
            <AnimatePresence>
                {showFloorPlanOverlay && selectedBuilding && !viewingFloorPlan && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <div className="w-full max-w-sm rounded-2xl bg-background shadow-2xl overflow-hidden border">
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="font-semibold text-lg">{selectedBuilding.name} Floors</h3>
                                <Button variant="ghost" size="icon" onClick={() => setShowFloorPlanOverlay(false)}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                            <ScrollArea className="max-h-[60vh]">
                                <div className="p-4 space-y-2">
                                    {floorPlans.length > 0 ? (
                                        floorPlans.map((plan) => (
                                            <button
                                                key={plan.id}
                                                className="w-full flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left"
                                                onClick={() => setViewingFloorPlan(plan)}
                                            >
                                                <div>
                                                    <p className="font-medium">Floor {plan.floor_number}</p>
                                                    <p className="text-xs text-muted-foreground">{plan.elements?.length || 0} features</p>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                            </button>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Layers className="mx-auto h-8 w-8 mb-2 opacity-20" />
                                            <p className="text-sm">No floor plans available</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Actual Floor Plan Viewer Overlay */}
            <AnimatePresence>
                {viewingFloorPlan && (
                    <FloorPlanViewer
                        floorPlan={viewingFloorPlan}
                        onClose={() => setViewingFloorPlan(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Default fallback data ───
const DEFAULT_BUILDINGS: Building[] = [
    {
        id: "1", name: "Main Academic Block", short_name: "Main Block", category: "academic", floors: 3, latitude: 11.22755, longitude: 75.91050, description: "Primary academic building with CS, BCA, Commerce departments.", icon: "school", color: "#3b82f6", operating_hours: "8:30 AM - 5:00 PM", sort_order: 1, rooms: [
            { id: "r1", building_id: "1", name: "BCA Hall", room_number: "101", room_type: "classroom", capacity: 60, description: "BCA lecture hall", latitude: 11.22752, longitude: 75.91045 },
            { id: "r2", building_id: "1", name: "Computer Lab 1", room_number: "102", room_type: "lab", capacity: 40, description: "Main CS lab", latitude: 11.22754, longitude: 75.91052 },
            { id: "r3", building_id: "1", name: "Computer Lab 2", room_number: "103", room_type: "lab", capacity: 30, description: "Secondary lab", latitude: 11.22756, longitude: 75.91055 },
            { id: "r4", building_id: "1", name: "Seminar Hall", room_number: "201", room_type: "seminar_hall", capacity: 120, description: "Large seminar hall, 1st floor", latitude: 11.22755, longitude: 75.91048 },
            { id: "r5", building_id: "1", name: "HOD Office (CS)", room_number: "202", room_type: "office", capacity: 4, description: null, latitude: 11.22757, longitude: 75.91050 },
        ]
    },
    { id: "2", name: "Science Block", short_name: "Sci Block", category: "academic", floors: 2, latitude: 11.22770, longitude: 75.91080, description: "Physics, Chemistry, Biology labs.", icon: "flask-conical", color: "#8b5cf6", operating_hours: "8:30 AM - 5:00 PM", sort_order: 2 },
    {
        id: "3", name: "Central Library", short_name: "Library", category: "facility", floors: 2, latitude: 11.22730, longitude: 75.91060, description: "Library with reading room and digital section.", icon: "library", color: "#f59e0b", operating_hours: "8:00 AM - 8:00 PM", sort_order: 3, rooms: [
            { id: "r6", building_id: "3", name: "Reading Room", room_number: "G01", room_type: "library", capacity: 80, description: "Quiet reading area", latitude: 11.22728, longitude: 75.91058 },
            { id: "r7", building_id: "3", name: "Digital Section", room_number: "G02", room_type: "lab", capacity: 20, description: "Online resources", latitude: 11.22732, longitude: 75.91062 },
        ]
    },
    { id: "4", name: "Administrative Block", short_name: "Admin", category: "administrative", floors: 2, latitude: 11.22745, longitude: 75.91030, description: "Principal office, administration, accounts.", icon: "building-2", color: "#ef4444", operating_hours: "9:00 AM - 4:30 PM", sort_order: 4 },
    { id: "5", name: "Men's Hostel", short_name: "Hostel", category: "hostel", floors: 3, latitude: 11.22710, longitude: 75.91100, description: "Residential block for male students.", icon: "bed-double", color: "#06b6d4", operating_hours: "24/7", sort_order: 5 },
    { id: "6", name: "Masjid", short_name: "Mosque", category: "religious", floors: 1, latitude: 11.22760, longitude: 75.91020, description: "Campus mosque.", icon: "moon", color: "#059669", operating_hours: "Open for prayer times", sort_order: 6 },
    { id: "7", name: "Canteen & Mess", short_name: "Canteen", category: "facility", floors: 1, latitude: 11.22720, longitude: 75.91040, description: "Main dining hall and snack counter.", icon: "utensils", color: "#d97706", operating_hours: "7:00 AM - 9:00 PM", sort_order: 7 },
    { id: "8", name: "Sports Ground", short_name: "Ground", category: "recreation", floors: 1, latitude: 11.22790, longitude: 75.91070, description: "Football pitch, volleyball court.", icon: "trophy", color: "#16a34a", operating_hours: "6:00 AM - 7:00 PM", sort_order: 8 },
];
const DEFAULT_POIS: POI[] = [
    { id: "p1", name: "Main Entrance", category: "entrance", latitude: 11.22700, longitude: 75.91040, description: "Main campus gate", icon: "log-in", building_id: null },
    { id: "p2", name: "Parking Area", category: "parking", latitude: 11.22695, longitude: 75.91060, description: "Two and four wheeler parking", icon: "car", building_id: null },
    { id: "p3", name: "ATM (SBI)", category: "atm", latitude: 11.22740, longitude: 75.91025, description: "SBI ATM", icon: "landmark", building_id: null },
    { id: "p4", name: "Wi-Fi Zone", category: "amenity", latitude: 11.22750, longitude: 75.91048, description: "Free Wi-Fi", icon: "wifi", building_id: null },
    { id: "p5", name: "First Aid Room", category: "health", latitude: 11.22748, longitude: 75.91035, description: "Health center", icon: "heart-pulse", building_id: null },
    { id: "p6", name: "Snack Counter", category: "food", latitude: 11.22722, longitude: 75.91042, description: "Tea, snacks", icon: "coffee", building_id: "7" },
    { id: "p7", name: "Shuttle Stop", category: "transport", latitude: 11.22698, longitude: 75.91035, description: "Bus stop", icon: "bus", building_id: null },
];
const DEFAULT_NAV_NODES: NavNode[] = [
    { id: "n1", latitude: 11.22700, longitude: 75.91040, node_type: "entrance", label: "Main Gate", building_id: null },
    { id: "n2", latitude: 11.22695, longitude: 75.91060, node_type: "waypoint", label: "Parking", building_id: null },
    { id: "n3", latitude: 11.22720, longitude: 75.91045, node_type: "junction", label: "Main Junction", building_id: null },
    { id: "n4", latitude: 11.22745, longitude: 75.91050, node_type: "junction", label: "Central Junction", building_id: null },
    { id: "n5", latitude: 11.22770, longitude: 75.91060, node_type: "junction", label: "North Junction", building_id: null },
    { id: "n6", latitude: 11.22755, longitude: 75.91050, node_type: "entrance", label: "Main Block", building_id: "1" },
    { id: "n7", latitude: 11.22745, longitude: 75.91030, node_type: "entrance", label: "Admin", building_id: "4" },
    { id: "n8", latitude: 11.22730, longitude: 75.91060, node_type: "entrance", label: "Library", building_id: "3" },
    { id: "n9", latitude: 11.22720, longitude: 75.91040, node_type: "entrance", label: "Canteen", building_id: "7" },
    { id: "n10", latitude: 11.22770, longitude: 75.91080, node_type: "entrance", label: "Science Block", building_id: "2" },
    { id: "n11", latitude: 11.22710, longitude: 75.91100, node_type: "entrance", label: "Hostel", building_id: "5" },
    { id: "n12", latitude: 11.22760, longitude: 75.91020, node_type: "entrance", label: "Mosque", building_id: "6" },
    { id: "n13", latitude: 11.22790, longitude: 75.91070, node_type: "entrance", label: "Sports Ground", building_id: "8" },
];
const DEFAULT_NAV_EDGES: NavEdge[] = [
    { id: "e1", from_node_id: "n1", to_node_id: "n3", weight: 25 }, { id: "e2", from_node_id: "n3", to_node_id: "n1", weight: 25 },
    { id: "e3", from_node_id: "n1", to_node_id: "n2", weight: 30 }, { id: "e4", from_node_id: "n2", to_node_id: "n1", weight: 30 },
    { id: "e5", from_node_id: "n3", to_node_id: "n4", weight: 30 }, { id: "e6", from_node_id: "n4", to_node_id: "n3", weight: 30 },
    { id: "e7", from_node_id: "n4", to_node_id: "n5", weight: 30 }, { id: "e8", from_node_id: "n5", to_node_id: "n4", weight: 30 },
    { id: "e9", from_node_id: "n3", to_node_id: "n9", weight: 10 }, { id: "e10", from_node_id: "n9", to_node_id: "n3", weight: 10 },
    { id: "e11", from_node_id: "n4", to_node_id: "n6", weight: 15 }, { id: "e12", from_node_id: "n6", to_node_id: "n4", weight: 15 },
    { id: "e13", from_node_id: "n4", to_node_id: "n7", weight: 20 }, { id: "e14", from_node_id: "n7", to_node_id: "n4", weight: 20 },
    { id: "e15", from_node_id: "n4", to_node_id: "n8", weight: 20 }, { id: "e16", from_node_id: "n8", to_node_id: "n4", weight: 20 },
    { id: "e17", from_node_id: "n4", to_node_id: "n12", weight: 25 }, { id: "e18", from_node_id: "n12", to_node_id: "n4", weight: 25 },
    { id: "e19", from_node_id: "n5", to_node_id: "n10", weight: 15 }, { id: "e20", from_node_id: "n10", to_node_id: "n5", weight: 15 },
    { id: "e21", from_node_id: "n5", to_node_id: "n13", weight: 25 }, { id: "e22", from_node_id: "n13", to_node_id: "n5", weight: 25 },
    { id: "e23", from_node_id: "n8", to_node_id: "n11", weight: 50 }, { id: "e24", from_node_id: "n11", to_node_id: "n8", weight: 50 },
];
