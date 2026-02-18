"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";

const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import("react-leaflet").then((mod) => mod.Marker),
    { ssr: false }
);
const Polyline = dynamic(
    () => import("react-leaflet").then((mod) => mod.Polyline),
    { ssr: false }
);
const Circle = dynamic(
    () => import("react-leaflet").then((mod) => mod.Circle),
    { ssr: false }
);

// ─── Types ───
interface Building {
    id: string;
    name: string;
    short_name: string | null;
    description: string | null;
    category: string;
    floors: number;
    latitude: number;
    longitude: number;
    icon: string;
    color: string;
    operating_hours: string | null;
    sort_order: number;
    rooms?: Room[];
}

interface Room {
    id: string;
    building_id: string;
    name: string;
    room_number: string | null;
    room_type: string;
    capacity: number | null;
    description: string | null;
    latitude: number | null;
    longitude: number | null;
}

interface POI {
    id: string;
    name: string;
    category: string;
    description: string | null;
    icon: string;
    latitude: number;
    longitude: number;
    building_id: string | null;
}

interface NavNode {
    id: string;
    latitude: number;
    longitude: number;
    node_type: string;
    label: string | null;
    building_id: string | null;
}

interface NavEdge {
    id: string;
    from_node_id: string;
    to_node_id: string;
    weight: number;
}

// ─── Icon mapping ───
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    school: GraduationCap,
    "flask-conical": FlaskConical,
    library: Library,
    "building-2": Building2,
    "bed-double": BedDouble,
    moon: Moon,
    utensils: Utensils,
    trophy: Trophy,
    "log-in": LogIn,
    car: Car,
    landmark: Landmark,
    droplets: Droplets,
    wifi: Wifi,
    "heart-pulse": Heart,
    coffee: Coffee,
    bus: Bus,
    "map-pin": MapPin,
};

// ─── Category filters ───
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

// ─── Tile layers ───
const TILE_LIGHT = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_DARK = "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png";
const TILE_SATELLITE = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

// ─── A* Pathfinding ───
function aStarPath(
    nodes: NavNode[],
    edges: NavEdge[],
    startId: string,
    endId: string
): NavNode[] | null {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const adjacency = new Map<string, { nodeId: string; weight: number }[]>();

    for (const edge of edges) {
        if (!adjacency.has(edge.from_node_id)) adjacency.set(edge.from_node_id, []);
        adjacency.get(edge.from_node_id)!.push({ nodeId: edge.to_node_id, weight: edge.weight });
    }

    const heuristic = (a: NavNode, b: NavNode) => {
        const dx = (a.latitude - b.latitude) * 111139; // degrees to meters approx
        const dy = (a.longitude - b.longitude) * 111139 * Math.cos((a.latitude * Math.PI) / 180);
        return Math.sqrt(dx * dx + dy * dy);
    };

    const endNode = nodeMap.get(endId);
    if (!endNode) return null;

    const openSet = new Set([startId]);
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    gScore.set(startId, 0);
    fScore.set(startId, heuristic(nodeMap.get(startId)!, endNode));

    while (openSet.size > 0) {
        let current = "";
        let lowestF = Infinity;
        for (const id of openSet) {
            const f = fScore.get(id) ?? Infinity;
            if (f < lowestF) {
                lowestF = f;
                current = id;
            }
        }

        if (current === endId) {
            // Reconstruct path
            const path: NavNode[] = [];
            let c = endId;
            while (c) {
                path.unshift(nodeMap.get(c)!);
                c = cameFrom.get(c) || "";
            }
            return path;
        }

        openSet.delete(current);
        const neighbors = adjacency.get(current) || [];
        for (const neighbor of neighbors) {
            const tentativeG = (gScore.get(current) ?? Infinity) + neighbor.weight;
            if (tentativeG < (gScore.get(neighbor.nodeId) ?? Infinity)) {
                cameFrom.set(neighbor.nodeId, current);
                gScore.set(neighbor.nodeId, tentativeG);
                fScore.set(neighbor.nodeId, tentativeG + heuristic(nodeMap.get(neighbor.nodeId)!, endNode));
                openSet.add(neighbor.nodeId);
            }
        }
    }

    return null; // no path found
}

// ─── Main Component ───
interface CampusMapProps {
    buildings?: Building[];
    pois?: POI[];
    navNodes?: NavNode[];
    navEdges?: NavEdge[];
    slug?: string;
}

export function CampusMap({
    buildings: propBuildings,
    pois: propPois,
    navNodes: propNavNodes,
    navEdges: propNavEdges,
}: CampusMapProps) {
    // Fallback data (will be overridden by Supabase data when available)
    const buildings = propBuildings ?? DEFAULT_BUILDINGS;
    const pois = propPois ?? DEFAULT_POIS;
    const navNodes = propNavNodes ?? DEFAULT_NAV_NODES;
    const navEdges = propNavEdges ?? DEFAULT_NAV_EDGES;

    const [L, setL] = useState<any>(null);
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [tileMode, setTileMode] = useState<"light" | "dark" | "satellite">("light");
    const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
    const [routePath, setRoutePath] = useState<[number, number][] | null>(null);
    const [routeInfo, setRouteInfo] = useState<{ distance: number; time: number } | null>(null);
    const [showDirectory, setShowDirectory] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        import("leaflet").then((L) => setL(L));
    }, []);

    // Get user's position
    useEffect(() => {
        if (typeof navigator !== "undefined" && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserPosition([pos.coords.latitude, pos.coords.longitude]),
                () => { } // silently fail
            );
        }
    }, []);

    // Focus search input when opened
    useEffect(() => {
        if (showSearch && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [showSearch]);

    const filteredBuildings = buildings.filter((b) => {
        const matchCategory = selectedCategory === "all" || b.category === selectedCategory;
        const matchSearch = searchQuery === "" ||
            b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.short_name || "").toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    const filteredPois = pois.filter((p) => {
        const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
        const matchSearch = searchQuery === "" ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    const allSearchResults = [
        ...buildings.filter((b) =>
            b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.short_name || "").toLowerCase().includes(searchQuery.toLowerCase())
        ).map((b) => ({ type: "building" as const, item: b })),
        ...pois.filter((p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).map((p) => ({ type: "poi" as const, item: p })),
    ];

    // Navigate to a building
    const navigateToBuilding = useCallback(
        (building: Building) => {
            // Find nearest nav node to the building
            const buildingNode = navNodes.find(
                (n) => n.building_id === building.id && n.node_type === "entrance"
            );
            if (!buildingNode) {
                setSelectedBuilding(building);
                return;
            }

            // Find nearest nav node to user (or main gate)
            let startNode = navNodes.find((n) => n.label === "Main Gate");
            if (userPosition) {
                let minDist = Infinity;
                for (const node of navNodes) {
                    const dist = Math.hypot(
                        node.latitude - userPosition[0],
                        node.longitude - userPosition[1]
                    );
                    if (dist < minDist) {
                        minDist = dist;
                        startNode = node;
                    }
                }
            }

            if (!startNode) return;

            const path = aStarPath(navNodes, navEdges, startNode.id, buildingNode.id);
            if (path) {
                const coords = path.map((n): [number, number] => [n.latitude, n.longitude]);
                setRoutePath(coords);
                // Calculate total distance
                let totalWeight = 0;
                for (let i = 0; i < path.length - 1; i++) {
                    const edge = navEdges.find(
                        (e) => e.from_node_id === path[i].id && e.to_node_id === path[i + 1].id
                    );
                    if (edge) totalWeight += edge.weight;
                }
                setRouteInfo({ distance: totalWeight, time: Math.ceil(totalWeight / 80) }); // ~80m/min walk
            }
            setSelectedBuilding(building);
        },
        [navNodes, navEdges, userPosition]
    );

    const clearRoute = () => {
        setRoutePath(null);
        setRouteInfo(null);
    };

    const tileUrl = tileMode === "dark" ? TILE_DARK : tileMode === "satellite" ? TILE_SATELLITE : TILE_LIGHT;

    if (!L)
        return (
            <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-muted/20 rounded-xl">
                <div className="flex flex-col items-center gap-2">
                    <MapPin className="h-8 w-8 animate-bounce text-primary" />
                    <p className="text-sm text-muted-foreground">Loading Campus Map...</p>
                </div>
            </div>
        );

    const buildingIcon = (color: string) =>
        new L.DivIcon({
            className: "custom-marker",
            html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01"/></svg>
            </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
        });

    const poiIcon = (category: string) => {
        const colors: Record<string, string> = {
            entrance: "#22c55e",
            parking: "#6366f1",
            atm: "#f59e0b",
            amenity: "#06b6d4",
            health: "#ef4444",
            food: "#d97706",
            transport: "#8b5cf6",
        };
        return new L.DivIcon({
            className: "custom-poi-marker",
            html: `<div style="width:24px;height:24px;border-radius:50%;background:${colors[category] || "#64748b"};display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.2);border:2px solid white;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none"><circle cx="12" cy="12" r="4"/></svg>
            </div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 24],
        });
    };

    const userIcon = new L.DivIcon({
        className: "user-marker",
        html: `<div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 2px #3b82f6,0 2px 8px rgba(59,130,246,0.5);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });

    // SIAS center coordinates
    const mapCenter: [number, number] = [11.2274, 75.9104];

    return (
        <div className="relative h-[calc(100vh-8rem)] w-full overflow-hidden rounded-xl border shadow-lg">
            {/* Map */}
            <MapContainer
                center={mapCenter}
                zoom={18}
                scrollWheelZoom={true}
                className="h-full w-full z-0"
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url={tileUrl}
                />

                {/* Building markers */}
                {filteredBuildings.map((b) => (
                    <Marker
                        key={b.id}
                        position={[b.latitude, b.longitude]}
                        icon={buildingIcon(b.color)}
                        eventHandlers={{
                            click: () => {
                                setSelectedBuilding(b);
                                clearRoute();
                            },
                        }}
                    />
                ))}

                {/* POI markers */}
                {filteredPois.map((p) => (
                    <Marker
                        key={p.id}
                        position={[p.latitude, p.longitude]}
                        icon={poiIcon(p.category)}
                    />
                ))}

                {/* User position */}
                {userPosition && (
                    <>
                        <Circle
                            center={userPosition}
                            radius={15}
                            pathOptions={{
                                color: "#3b82f6",
                                fillColor: "#3b82f6",
                                fillOpacity: 0.1,
                                weight: 1,
                            }}
                        />
                        <Marker position={userPosition} icon={userIcon} />
                    </>
                )}

                {/* Route polyline */}
                {routePath && (
                    <Polyline
                        positions={routePath}
                        pathOptions={{
                            color: "#3b82f6",
                            weight: 4,
                            opacity: 0.8,
                            dashArray: "10, 10",
                        }}
                    />
                )}
            </MapContainer>

            {/* ── Floating Controls ── */}

            {/* Search bar */}
            <div className="absolute left-4 right-4 top-4 z-[1000] md:left-4 md:right-auto md:w-80">
                <div className="relative">
                    <div
                        className="flex items-center gap-2 rounded-xl bg-background/95 px-4 py-3 shadow-lg backdrop-blur-sm border cursor-pointer"
                        onClick={() => setShowSearch(true)}
                    >
                        <Search className="h-4 w-4 text-muted-foreground" />
                        {showSearch ? (
                            <Input
                                ref={searchInputRef}
                                placeholder="Search buildings, rooms, places..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0"
                            />
                        ) : (
                            <span className="text-sm text-muted-foreground">
                                Search campus...
                            </span>
                        )}
                        {showSearch && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowSearch(false);
                                    setSearchQuery("");
                                }}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>

                    {/* Search results dropdown */}
                    {showSearch && searchQuery.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute left-0 right-0 top-full mt-2 rounded-xl bg-background/95 backdrop-blur-sm border shadow-lg overflow-hidden max-h-64"
                        >
                            <ScrollArea className="max-h-64">
                                {allSearchResults.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        No results found
                                    </div>
                                ) : (
                                    allSearchResults.map((result) => {
                                        const isBuilding = result.type === "building";
                                        const item = result.item;
                                        return (
                                            <button
                                                key={item.id}
                                                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b last:border-0"
                                                onClick={() => {
                                                    if (isBuilding) {
                                                        setSelectedBuilding(item as Building);
                                                    }
                                                    setShowSearch(false);
                                                    setSearchQuery("");
                                                }}
                                            >
                                                <div
                                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                                    style={{
                                                        backgroundColor: isBuilding
                                                            ? (item as Building).color + "20"
                                                            : "#64748b20",
                                                    }}
                                                >
                                                    {isBuilding ? (
                                                        <Building2
                                                            className="h-4 w-4"
                                                            style={{ color: (item as Building).color }}
                                                        />
                                                    ) : (
                                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {isBuilding
                                                            ? (item as Building).category
                                                            : (item as POI).category}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </ScrollArea>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Category filters (horizontal scroll) */}
            <div className="absolute left-4 right-4 top-[72px] z-[1000] overflow-x-auto md:left-4 md:right-auto md:w-80">
                <div className="flex gap-1.5 pb-1">
                    {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = selectedCategory === cat.key;
                        return (
                            <button
                                key={cat.key}
                                onClick={() => {
                                    setSelectedCategory(cat.key);
                                    clearRoute();
                                    setSelectedBuilding(null);
                                }}
                                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all shadow-sm ${isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background/90 text-foreground backdrop-blur-sm border hover:bg-muted"
                                    }`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {cat.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tile mode + zoom controls (right side) */}
            <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
                <div className="flex flex-col gap-1 rounded-xl bg-background/95 p-1 shadow-lg backdrop-blur-sm border">
                    <Button
                        variant={tileMode === "light" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setTileMode("light")}
                        title="Default map"
                    >
                        <Layers className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={tileMode === "dark" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setTileMode("dark")}
                        title="Dark map"
                    >
                        <Moon className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={tileMode === "satellite" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setTileMode("satellite")}
                        title="Satellite view"
                    >
                        <MapPin className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Building directory toggle (bottom-left) */}
            <div className="absolute left-4 bottom-4 z-[1000]">
                <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full shadow-lg gap-1.5"
                    onClick={() => setShowDirectory(!showDirectory)}
                >
                    <Building2 className="h-4 w-4" />
                    Directory
                    {showDirectory ? (
                        <ChevronDown className="h-3 w-3" />
                    ) : (
                        <ChevronUp className="h-3 w-3" />
                    )}
                </Button>
            </div>

            {/* Route info bar */}
            <AnimatePresence>
                {routeInfo && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]"
                    >
                        <Card className="border-primary/30 shadow-lg">
                            <CardContent className="flex items-center gap-4 p-3">
                                <Route className="h-5 w-5 text-primary" />
                                <div className="text-sm">
                                    <span className="font-bold">{routeInfo.distance}m</span>
                                    <span className="text-muted-foreground"> • </span>
                                    <span className="text-muted-foreground">
                                        ~{routeInfo.time} min walk
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={clearRoute}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Building Directory Panel ── */}
            <AnimatePresence>
                {showDirectory && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute left-0 right-0 bottom-0 z-[1001] max-h-[50vh] rounded-t-2xl bg-background/95 backdrop-blur-sm border-t shadow-2xl"
                    >
                        <div className="flex items-center justify-between px-4 pt-3 pb-2">
                            <h3 className="font-semibold">Campus Directory</h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setShowDirectory(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <ScrollArea className="max-h-[calc(50vh-48px)] px-4 pb-4">
                            <div className="space-y-2">
                                {buildings
                                    .sort((a, b) => a.sort_order - b.sort_order)
                                    .map((b) => {
                                        const Icon = ICON_MAP[b.icon] || Building2;
                                        return (
                                            <button
                                                key={b.id}
                                                className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-muted/50 transition-colors"
                                                onClick={() => {
                                                    setSelectedBuilding(b);
                                                    setShowDirectory(false);
                                                }}
                                            >
                                                <div
                                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                                                    style={{ backgroundColor: b.color + "20" }}
                                                >
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{b.name}</p>
                                                    <p className="text-xs text-muted-foreground capitalize">
                                                        {b.category} • {b.floors} floor{b.floors > 1 ? "s" : ""}
                                                    </p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                            </button>
                                        );
                                    })}
                            </div>
                        </ScrollArea>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Building Detail Panel ── */}
            <AnimatePresence>
                {selectedBuilding && (
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute right-0 top-0 z-[1002] h-full w-full max-w-sm border-l bg-background/95 backdrop-blur-sm shadow-2xl sm:w-80"
                    >
                        <ScrollArea className="h-full">
                            <div className="p-5">
                                {/* Close button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-3 top-3"
                                    onClick={() => {
                                        setSelectedBuilding(null);
                                        clearRoute();
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>

                                {/* Building header */}
                                <div className="mt-4 mb-5">
                                    <div
                                        className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl"
                                        style={{ backgroundColor: selectedBuilding.color + "20" }}
                                    >
                                        {(() => {
                                            const Icon = ICON_MAP[selectedBuilding.icon] || Building2;
                                            return (
                                                <Icon
                                                    className="h-6 w-6"
                                                    style={{ color: selectedBuilding.color }}
                                                />
                                            );
                                        })()}
                                    </div>
                                    <h2 className="text-xl font-bold">{selectedBuilding.name}</h2>
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <Badge variant="outline" className="capitalize text-xs">
                                            {selectedBuilding.category}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {selectedBuilding.floors} floor{selectedBuilding.floors > 1 ? "s" : ""}
                                        </span>
                                    </div>
                                </div>

                                {selectedBuilding.description && (
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {selectedBuilding.description}
                                    </p>
                                )}

                                {/* Operating hours */}
                                {selectedBuilding.operating_hours && (
                                    <div className="flex items-center gap-2 mb-4 text-sm">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span>{selectedBuilding.operating_hours}</span>
                                    </div>
                                )}

                                {/* Navigate button */}
                                <Button
                                    className="w-full gap-2 mb-4"
                                    onClick={() => navigateToBuilding(selectedBuilding)}
                                >
                                    <Navigation className="h-4 w-4" />
                                    Navigate Here
                                </Button>

                                {/* Rooms */}
                                {selectedBuilding.rooms && selectedBuilding.rooms.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold mb-2">
                                            Rooms & Facilities
                                        </h3>
                                        <div className="space-y-2">
                                            {selectedBuilding.rooms.map((room) => (
                                                <div
                                                    key={room.id}
                                                    className="rounded-lg border p-3 bg-muted/30"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-medium">
                                                            {room.name}
                                                        </p>
                                                        {room.room_number && (
                                                            <Badge variant="secondary" className="text-[10px]">
                                                                {room.room_number}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground capitalize mt-0.5">
                                                        {room.room_type.replace("_", " ")}
                                                        {room.capacity && ` • ${room.capacity} seats`}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Default fallback data (for local dev without Supabase) ───
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
    { id: "2", name: "Science Block", short_name: "Sci Block", category: "academic", floors: 2, latitude: 11.22770, longitude: 75.91080, description: "Physics, Chemistry, Biology labs and seminar halls.", icon: "flask-conical", color: "#8b5cf6", operating_hours: "8:30 AM - 5:00 PM", sort_order: 2 },
    {
        id: "3", name: "Central Library", short_name: "Library", category: "facility", floors: 2, latitude: 11.22730, longitude: 75.91060, description: "Library with reading room and digital section.", icon: "library", color: "#f59e0b", operating_hours: "8:00 AM - 8:00 PM", sort_order: 3, rooms: [
            { id: "r6", building_id: "3", name: "Reading Room", room_number: "G01", room_type: "library", capacity: 80, description: "Quiet reading area", latitude: 11.22728, longitude: 75.91058 },
            { id: "r7", building_id: "3", name: "Digital Section", room_number: "G02", room_type: "lab", capacity: 20, description: "Online resources", latitude: 11.22732, longitude: 75.91062 },
        ]
    },
    { id: "4", name: "Administrative Block", short_name: "Admin", category: "administrative", floors: 2, latitude: 11.22745, longitude: 75.91030, description: "Principal office, administration, accounts.", icon: "building-2", color: "#ef4444", operating_hours: "9:00 AM - 4:30 PM", sort_order: 4 },
    { id: "5", name: "Men's Hostel", short_name: "Hostel", category: "hostel", floors: 3, latitude: 11.22710, longitude: 75.91100, description: "Residential block for male students.", icon: "bed-double", color: "#06b6d4", operating_hours: "24/7", sort_order: 5 },
    { id: "6", name: "Masjid", short_name: "Mosque", category: "religious", floors: 1, latitude: 11.22760, longitude: 75.91020, description: "Campus mosque for daily prayers.", icon: "moon", color: "#059669", operating_hours: "Open for prayer times", sort_order: 6 },
    { id: "7", name: "Canteen & Mess", short_name: "Canteen", category: "facility", floors: 1, latitude: 11.22720, longitude: 75.91040, description: "Main dining hall and snack counter.", icon: "utensils", color: "#d97706", operating_hours: "7:00 AM - 9:00 PM", sort_order: 7 },
    { id: "8", name: "Sports Ground", short_name: "Ground", category: "recreation", floors: 1, latitude: 11.22790, longitude: 75.91070, description: "Football pitch, volleyball court.", icon: "trophy", color: "#16a34a", operating_hours: "6:00 AM - 7:00 PM", sort_order: 8 },
];

const DEFAULT_POIS: POI[] = [
    { id: "p1", name: "Main Entrance", category: "entrance", latitude: 11.22700, longitude: 75.91040, description: "Main campus gate", icon: "log-in", building_id: null },
    { id: "p2", name: "Parking Area", category: "parking", latitude: 11.22695, longitude: 75.91060, description: "Two and four wheeler parking", icon: "car", building_id: null },
    { id: "p3", name: "ATM (SBI)", category: "atm", latitude: 11.22740, longitude: 75.91025, description: "SBI ATM near admin block", icon: "landmark", building_id: null },
    { id: "p4", name: "Wi-Fi Zone", category: "amenity", latitude: 11.22750, longitude: 75.91048, description: "Free Wi-Fi hotspot", icon: "wifi", building_id: null },
    { id: "p5", name: "First Aid Room", category: "health", latitude: 11.22748, longitude: 75.91035, description: "Health center", icon: "heart-pulse", building_id: null },
    { id: "p6", name: "Snack Counter", category: "food", latitude: 11.22722, longitude: 75.91042, description: "Tea, snacks, juice", icon: "coffee", building_id: "7" },
    { id: "p7", name: "Shuttle Stop", category: "transport", latitude: 11.22698, longitude: 75.91035, description: "Bus and auto stop", icon: "bus", building_id: null },
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
    // Entrance to junctions
    { id: "e1", from_node_id: "n1", to_node_id: "n3", weight: 25 },
    { id: "e2", from_node_id: "n3", to_node_id: "n1", weight: 25 },
    { id: "e3", from_node_id: "n1", to_node_id: "n2", weight: 30 },
    { id: "e4", from_node_id: "n2", to_node_id: "n1", weight: 30 },
    { id: "e5", from_node_id: "n3", to_node_id: "n4", weight: 30 },
    { id: "e6", from_node_id: "n4", to_node_id: "n3", weight: 30 },
    { id: "e7", from_node_id: "n4", to_node_id: "n5", weight: 30 },
    { id: "e8", from_node_id: "n5", to_node_id: "n4", weight: 30 },
    // Junction to buildings
    { id: "e9", from_node_id: "n3", to_node_id: "n9", weight: 10 },
    { id: "e10", from_node_id: "n9", to_node_id: "n3", weight: 10 },
    { id: "e11", from_node_id: "n4", to_node_id: "n6", weight: 15 },
    { id: "e12", from_node_id: "n6", to_node_id: "n4", weight: 15 },
    { id: "e13", from_node_id: "n4", to_node_id: "n7", weight: 20 },
    { id: "e14", from_node_id: "n7", to_node_id: "n4", weight: 20 },
    { id: "e15", from_node_id: "n4", to_node_id: "n8", weight: 20 },
    { id: "e16", from_node_id: "n8", to_node_id: "n4", weight: 20 },
    { id: "e17", from_node_id: "n4", to_node_id: "n12", weight: 25 },
    { id: "e18", from_node_id: "n12", to_node_id: "n4", weight: 25 },
    { id: "e19", from_node_id: "n5", to_node_id: "n10", weight: 15 },
    { id: "e20", from_node_id: "n10", to_node_id: "n5", weight: 15 },
    { id: "e21", from_node_id: "n5", to_node_id: "n13", weight: 25 },
    { id: "e22", from_node_id: "n13", to_node_id: "n5", weight: 25 },
    { id: "e23", from_node_id: "n8", to_node_id: "n11", weight: 50 },
    { id: "e24", from_node_id: "n11", to_node_id: "n8", weight: 50 },
];
