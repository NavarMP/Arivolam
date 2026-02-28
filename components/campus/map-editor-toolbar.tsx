"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
    MousePointer2, Square, Pentagon, Minus, MapPin, Type,
    Trash2, Undo2, Redo2, Magnet, Save, Eye, GitBranch,
    Route, ZoomIn, ZoomOut, Maximize2, Grid3X3, ChevronUp,
    HelpCircle, Hand, Maximize, Minimize, Circle
} from "lucide-react";
import { useState } from "react";

export type DrawMode =
    | "select"
    | "hand"
    | "rect"
    | "polygon"
    | "circle"
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
    onHelp?: () => void;
    isAutoSaving?: boolean;
    isFullscreen?: boolean;
    onToggleFullscreen?: () => void;
}

const DRAW_TOOLS: { mode: DrawMode; icon: any; label: string; shortcut?: string }[] = [
    { mode: "select", icon: MousePointer2, label: "Select", shortcut: "V" },
    { mode: "hand", icon: Hand, label: "Hand (Pan)", shortcut: "H / Space" },
    { mode: "rect", icon: Square, label: "Rectangle", shortcut: "R" },
    { mode: "circle", icon: Circle, label: "Circle", shortcut: "C" },
    { mode: "polygon", icon: Pentagon, label: "Polygon", shortcut: "P" },
    { mode: "line", icon: Minus, label: "Line", shortcut: "L" },
    { mode: "marker", icon: MapPin, label: "POI", shortcut: "M" },
    { mode: "label", icon: Type, label: "Label", shortcut: "T" },
    { mode: "eraser", icon: Trash2, label: "Delete" },
];

const NAV_TOOLS: { mode: DrawMode; icon: typeof GitBranch; label: string }[] = [
    { mode: "navnode", icon: GitBranch, label: "Nav Node" },
    { mode: "navedge", icon: Route, label: "Nav Edge" },
];

function ToolButton({ mode, icon: Icon, label, shortcut, isActive, isEraser, onClick }: {
    mode: DrawMode; icon: typeof Square; label: string; shortcut?: string; isActive: boolean; isEraser?: boolean;
    onClick: () => void;
}) {
    const tip = shortcut ? `${label} (${shortcut})` : label;
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant={isActive ? "default" : "ghost"}
                    size="icon"
                    className={`h-9 w-9 shrink-0 ${isActive ? "shadow-sm" : ""} ${isEraser && isActive ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
                    onClick={onClick}
                >
                    <Icon className="h-4 w-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8} className="md:block hidden">{tip}</TooltipContent>
            <TooltipContent side="top" sideOffset={8} className="md:hidden block">{tip}</TooltipContent>
        </Tooltip>
    );
}

export function MapEditorToolbar({
    activeMode, onModeChange, snapEnabled, onSnapToggle,
    onUndo, onRedo, canUndo, canRedo, onSave, saving,
    showNavGraph, onToggleNavGraph, hasChanges,
    zoom, onZoomIn, onZoomOut, onFitAll, onHelp, isAutoSaving,
    isFullscreen, onToggleFullscreen
}: MapEditorToolbarProps) {
    const [mobileExpanded, setMobileExpanded] = useState(false);

    return (
        <>
            {/* ─── Desktop: Vertical left sidebar (hidden on mobile) ─── */}
            <div className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-[1000] flex-col gap-1.5">
                {/* Drawing tools */}
                <div className="flex flex-col gap-0.5 rounded-xl bg-background/95 p-1.5 shadow-lg backdrop-blur-sm border">
                    {DRAW_TOOLS.map((tool) => (
                        <ToolButton key={tool.mode} {...tool} isActive={activeMode === tool.mode} isEraser={tool.mode === "eraser"}
                            onClick={() => onModeChange(tool.mode)} />
                    ))}
                </div>

                {/* Nav graph tools */}
                <div className="flex flex-col gap-0.5 rounded-xl bg-background/95 p-1.5 shadow-lg backdrop-blur-sm border">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant={showNavGraph ? "default" : "ghost"} size="icon" className="h-9 w-9" onClick={onToggleNavGraph}>
                                <Eye className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>{showNavGraph ? "Hide" : "Show"} Nav Graph</TooltipContent>
                    </Tooltip>
                    {NAV_TOOLS.map((tool) => (
                        <ToolButton key={tool.mode} {...tool} isActive={activeMode === tool.mode}
                            onClick={() => onModeChange(tool.mode)} />
                    ))}
                </div>

                {/* Zoom + Actions */}
                <div className="flex flex-col gap-0.5 rounded-xl bg-background/95 p-1.5 shadow-lg backdrop-blur-sm border">
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9" onClick={onZoomIn}><ZoomIn className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="right" sideOffset={8}>Zoom In</TooltipContent></Tooltip>
                    <Badge variant="outline" className="text-[10px] justify-center py-0.5 px-1 font-mono">{Math.round(zoom * 100)}%</Badge>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9" onClick={onZoomOut}><ZoomOut className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="right" sideOffset={8}>Zoom Out</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9" onClick={onFitAll}><Maximize2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="right" sideOffset={8}>Fit All</TooltipContent></Tooltip>
                    {onToggleFullscreen && (
                        <Tooltip><TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onToggleFullscreen}>
                                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger><TooltipContent side="right" sideOffset={8}>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</TooltipContent></Tooltip>
                    )}
                    <div className="h-px bg-border my-0.5" />
                    <Tooltip><TooltipTrigger asChild><Button variant={snapEnabled ? "secondary" : "ghost"} size="icon" className="h-9 w-9" onClick={onSnapToggle}><Grid3X3 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="right" sideOffset={8}>Snap {snapEnabled ? "On" : "Off"}</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9" onClick={onUndo} disabled={!canUndo}><Undo2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="right" sideOffset={8}>Undo</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9" onClick={onRedo} disabled={!canRedo}><Redo2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent side="right" sideOffset={8}>Redo</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild>
                        <Button variant={hasChanges ? "default" : "ghost"} size="icon"
                            className={`h-9 w-9 ${hasChanges ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                            onClick={onSave} disabled={saving || !hasChanges || isAutoSaving}>
                            <Save className={`h-4 w-4 ${(saving || isAutoSaving) ? "animate-spin" : ""}`} />
                        </Button>
                    </TooltipTrigger><TooltipContent side="right" sideOffset={8}>{(saving || isAutoSaving) ? "Saving..." : "Save All"}</TooltipContent></Tooltip>
                    {onHelp && (
                        <Tooltip><TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={onHelp}>
                                <HelpCircle className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger><TooltipContent side="right" sideOffset={8}>Map Editor Guide</TooltipContent></Tooltip>
                    )}
                </div>
            </div>

            {/* ─── Mobile: Horizontal bottom bar ─── */}
            <div className="md:hidden absolute bottom-0 left-0 right-0 z-[1000]">
                {/* Expandable panel */}
                {mobileExpanded && (
                    <div className="mx-2 mb-1 rounded-xl bg-background/95 p-2 shadow-lg backdrop-blur-sm border">
                        <div className="grid grid-cols-5 gap-1">
                            {NAV_TOOLS.map((tool) => {
                                const Icon = tool.icon;
                                return (
                                    <Button key={tool.mode} variant={activeMode === tool.mode ? "default" : "ghost"} size="sm"
                                        className="h-9 flex flex-col gap-0.5 text-[9px]"
                                        onClick={() => { onModeChange(tool.mode); setMobileExpanded(false); }}>
                                        <Icon className="h-3.5 w-3.5" />{tool.label}
                                    </Button>
                                );
                            })}
                            <Button variant={showNavGraph ? "default" : "ghost"} size="sm" className="h-9 flex flex-col gap-0.5 text-[9px]"
                                onClick={onToggleNavGraph}><Eye className="h-3.5 w-3.5" />Graph</Button>
                            <Button variant={snapEnabled ? "secondary" : "ghost"} size="sm" className="h-9 flex flex-col gap-0.5 text-[9px]"
                                onClick={onSnapToggle}><Grid3X3 className="h-3.5 w-3.5" />Snap</Button>
                            <Button variant="ghost" size="sm" className="h-9 flex flex-col gap-0.5 text-[9px]" onClick={onFitAll}>
                                <Maximize2 className="h-3.5 w-3.5" />Fit
                            </Button>
                        </div>
                    </div>
                )}

                {/* Main row */}
                <div className="flex items-center gap-1 p-2 bg-background/95 backdrop-blur-sm border-t shadow-lg">
                    <div className="flex-1 flex items-center gap-0.5 overflow-x-auto pb-safe">
                        {DRAW_TOOLS.map((tool) => {
                            const Icon = tool.icon;
                            const isActive = activeMode === tool.mode;
                            return (
                                <Button key={tool.mode} variant={isActive ? "default" : "ghost"} size="icon"
                                    className={`h-9 w-9 shrink-0 ${isActive ? "shadow-sm" : ""} ${tool.mode === "eraser" && isActive ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
                                    onClick={() => onModeChange(tool.mode)}>
                                    <Icon className="h-4 w-4" />
                                </Button>
                            );
                        })}
                    </div>
                    <div className="h-8 w-px bg-border shrink-0" />
                    <div className="flex items-center gap-0.5 shrink-0">
                        <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">{Math.round(zoom * 100)}%</Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomIn}><ZoomIn className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onZoomOut}><ZoomOut className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileExpanded(!mobileExpanded)}>
                            <ChevronUp className={`h-3.5 w-3.5 transition-transform ${mobileExpanded ? "rotate-180" : ""}`} />
                        </Button>
                        <Button variant={hasChanges ? "default" : "ghost"} size="icon"
                            className={`h-8 w-8 ${hasChanges ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                            onClick={onSave} disabled={saving || !hasChanges}>
                            <Save className={`h-3.5 w-3.5 ${saving ? "animate-spin" : ""}`} />
                        </Button>
                        {onHelp && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" onClick={onHelp}>
                                <HelpCircle className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
