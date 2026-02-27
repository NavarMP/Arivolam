"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
    MousePointer2, Square, Pentagon, Minus, MapPin, Type,
    Trash2, Undo2, Redo2, Magnet, Save, Eye, GitBranch,
    Route, ZoomIn, ZoomOut, Maximize2, Grid3X3,
} from "lucide-react";

export type DrawMode =
    | "select"
    | "rect"
    | "polygon"
    | "line"
    | "marker"
    | "label"
    | "navnode"
    | "navedge"
    | "eraser";

interface MapEditorToolbarProps {
    activeMode: DrawMode;
    onModeChange: (mode: DrawMode) => void;
    snapEnabled: boolean;
    onSnapToggle: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onSave: () => void;
    saving: boolean;
    showNavGraph: boolean;
    onToggleNavGraph: () => void;
    hasChanges: boolean;
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFitAll: () => void;
}

const DRAW_TOOLS: { mode: DrawMode; icon: typeof Square; label: string }[] = [
    { mode: "select", icon: MousePointer2, label: "Select / Move" },
    { mode: "rect", icon: Square, label: "Draw Building (Rectangle)" },
    { mode: "polygon", icon: Pentagon, label: "Draw Building (Polygon)" },
    { mode: "line", icon: Minus, label: "Draw Path / Road" },
    { mode: "marker", icon: MapPin, label: "Place POI" },
    { mode: "label", icon: Type, label: "Add Label" },
    { mode: "eraser", icon: Trash2, label: "Delete Element" },
];

const NAV_TOOLS: { mode: DrawMode; icon: typeof GitBranch; label: string }[] = [
    { mode: "navnode", icon: GitBranch, label: "Place Nav Node" },
    { mode: "navedge", icon: Route, label: "Connect Nav Nodes" },
];

export function MapEditorToolbar({
    activeMode,
    onModeChange,
    snapEnabled,
    onSnapToggle,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onSave,
    saving,
    showNavGraph,
    onToggleNavGraph,
    hasChanges,
    zoom,
    onZoomIn,
    onZoomOut,
    onFitAll,
}: MapEditorToolbarProps) {
    return (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-1.5">
            {/* Drawing tools */}
            <div className="flex flex-col gap-0.5 rounded-xl bg-background/95 p-1.5 shadow-lg backdrop-blur-sm border">
                {DRAW_TOOLS.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = activeMode === tool.mode;
                    return (
                        <Tooltip key={tool.mode}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={isActive ? "default" : "ghost"}
                                    size="icon"
                                    className={`h-9 w-9 ${isActive ? "shadow-sm" : ""} ${tool.mode === "eraser" && isActive ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
                                    onClick={() => onModeChange(tool.mode)}
                                >
                                    <Icon className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={8}>
                                {tool.label}
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>

            {/* Nav graph tools */}
            <div className="flex flex-col gap-0.5 rounded-xl bg-background/95 p-1.5 shadow-lg backdrop-blur-sm border">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={showNavGraph ? "default" : "ghost"}
                            size="icon"
                            className="h-9 w-9"
                            onClick={onToggleNavGraph}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                        {showNavGraph ? "Hide" : "Show"} Nav Graph
                    </TooltipContent>
                </Tooltip>
                {NAV_TOOLS.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = activeMode === tool.mode;
                    return (
                        <Tooltip key={tool.mode}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={isActive ? "default" : "ghost"}
                                    size="icon"
                                    className={`h-9 w-9 ${isActive ? "shadow-sm" : ""}`}
                                    onClick={() => onModeChange(tool.mode)}
                                >
                                    <Icon className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={8}>
                                {tool.label}
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>

            {/* Zoom + Grid + Actions */}
            <div className="flex flex-col gap-0.5 rounded-xl bg-background/95 p-1.5 shadow-lg backdrop-blur-sm border">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onZoomIn}>
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>Zoom In</TooltipContent>
                </Tooltip>

                <Badge variant="outline" className="text-[10px] justify-center py-0.5 px-1 font-mono">
                    {Math.round(zoom * 100)}%
                </Badge>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onZoomOut}>
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>Zoom Out</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onFitAll}>
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>Fit All</TooltipContent>
                </Tooltip>

                <div className="h-px bg-border my-0.5" />

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={snapEnabled ? "secondary" : "ghost"}
                            size="icon"
                            className="h-9 w-9"
                            onClick={onSnapToggle}
                        >
                            <Grid3X3 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                        Snap to Grid {snapEnabled ? "On" : "Off"}
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onUndo} disabled={!canUndo}>
                            <Undo2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>Undo</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onRedo} disabled={!canRedo}>
                            <Redo2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>Redo</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={hasChanges ? "default" : "ghost"}
                            size="icon"
                            className={`h-9 w-9 ${hasChanges ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                            onClick={onSave}
                            disabled={saving || !hasChanges}
                        >
                            <Save className={`h-4 w-4 ${saving ? "animate-spin" : ""}`} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                        {saving ? "Saving..." : "Save All"}
                    </TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}
