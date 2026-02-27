import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    MapPin, MousePointer2, Move, Navigation,
    Square, Layers, Plus, Save, Compass
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MapEditorGuidePage({ params }: { params: { slug: string } }) {
    return (
        <div className="container max-w-5xl py-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campus Map Manager Guide</h1>
                    <p className="text-muted-foreground mt-2">
                        Learn how to create, manage, and configure your institution's interactive campus map.
                    </p>
                </div>
                <Link href={`/campus/${params.slug}/admin/map-editor`}>
                    <Button>Open Map Editor</Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* 1. Basic Navigation */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MousePointer2 className="h-5 w-5 text-primary" />
                            1. Navigating the Editor
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-lg border bg-muted/30 p-4 aspect-video flex items-center justify-center relative overflow-hidden">
                            {/* Diagram: Canvas Pan/Zoom */}
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                            <div className="relative flex flex-col items-center gap-2 text-primary">
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center p-3 bg-background rounded-lg shadow-sm border">
                                        <MousePointer2 className="h-6 w-6 mb-2" />
                                        <span className="text-xs font-medium">Click & Drag to Pan</span>
                                    </div>
                                    <div className="flex flex-col items-center p-3 bg-background rounded-lg shadow-sm border">
                                        <Compass className="h-6 w-6 mb-2" />
                                        <span className="text-xs font-medium">Scroll/Pinch to Zoom</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                            <li>Use your mouse wheel or trackpad to zoom in and out.</li>
                            <li>Click and hold anywhere on the blank canvas grid to pan around the map.</li>
                            <li>On touch devices, use two fingers to pinch-to-zoom and one finger to pan.</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* 2. Adding Buildings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Square className="h-5 w-5 text-primary" />
                            2. Creating Buildings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-lg border bg-muted/30 p-4 aspect-video flex items-center justify-center relative overflow-hidden">
                            <div className="relative flex flex-col items-center gap-3">
                                <div className="flex items-center gap-2 bg-background p-2 rounded-md shadow-sm border">
                                    <Square className="h-4 w-4 text-blue-500" />
                                    <span className="text-xs font-medium">Click "Draw Building"</span>
                                </div>
                                <div className="h-4 w-px bg-border" />
                                <div className="w-24 h-16 bg-blue-500/20 border-2 border-blue-500 rounded-md relative cursor-crosshair flex items-center justify-center">
                                    <span className="text-xs text-blue-700 font-semibold">New Building</span>
                                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-background border border-primary rounded-full" />
                                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-background border border-primary rounded-full" />
                                </div>
                            </div>
                        </div>
                        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                            <li>Select the <strong>Draw Building</strong> tool from the left toolbar.</li>
                            <li>Click anywhere on the map to place a generic building block.</li>
                            <li>Use the four corner handles (white circles) to stretch and resize the building precisely.</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* 3. Editing Properties */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Save className="h-5 w-5 text-primary" />
                            3. Setting Properties
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-lg border bg-muted/30 p-4 aspect-video flex items-center justify-center relative overflow-hidden">
                            <div className="w-48 bg-background border rounded-lg shadow-sm p-3 space-y-2 relative -right-12">
                                <div className="h-2 w-1/2 bg-muted rounded" />
                                <div className="h-6 w-full bg-muted/50 rounded border" />
                                <div className="h-2 w-1/3 bg-muted rounded mt-2" />
                                <div className="flex gap-1 mt-1">
                                    <div className="h-4 w-4 rounded-full bg-blue-500" />
                                    <div className="h-4 w-4 rounded-full bg-red-500" />
                                    <div className="h-4 w-4 rounded-full bg-green-500 border-2 border-primary" />
                                </div>
                                <div className="mt-3 bg-primary/10 text-primary text-[10px] text-center py-1 rounded">Save Changes</div>
                            </div>
                        </div>
                        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                            <li>Click the <strong>Select</strong> tool, then click a building or node on the map.</li>
                            <li>The Property Panel will slide in from the right.</li>
                            <li>Assign names, categories, colors, and GPS coordinates (Latitude/Longitude).</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* 4. Indoor Floor Management */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-primary" />
                            4. Indoor Floor Plans
                        </CardTitle>
                        <Badge className="w-fit ml-7" variant="secondary">New Feature</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-lg border bg-muted/30 p-4 aspect-video flex items-center justify-center relative overflow-hidden">
                            <div className="relative group perspective-1000">
                                <div className="w-32 h-20 border-2 border-primary/40 bg-background shadow-lg rounded-md rotate-x-12 -rotate-y-12 translate-y-4 transition-transform group-hover:translate-y-6" />
                                <div className="absolute inset-0 w-32 h-20 border-2 border-primary bg-background shadow-xl rounded-md flex items-center justify-center -translate-y-4 rotate-x-12 -rotate-y-12 transition-transform group-hover:-translate-y-6">
                                    <span className="text-xs font-semibold text-primary">Floor 1</span>
                                    <div className="absolute w-8 h-8 border border-muted-foreground/30 left-2 top-2 rounded-sm" />
                                    <div className="absolute w-12 h-6 bg-primary/10 right-2 bottom-2 rounded-sm" />
                                </div>
                            </div>
                        </div>
                        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                            <li>Select a saved building and click <strong>Manage Floor Plans</strong> at the bottom of the property panel.</li>
                            <li>Use the dedicated indoor editor to draw complex rooms, walls, doors, and furniture.</li>
                            <li>Users will see a "Floor Plans" button on the public map when zoomed tightly into the building.</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* 5. Navigation & Routing */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Navigation className="h-5 w-5 text-primary" />
                            5. Setting Up the Navigation Graph
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                For the turn-by-turn routing feature to work, you must define the paths users can walk on campus.
                            </p>
                            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                                <li>Select the <strong>Place Nav Node</strong> tool (Pin icon) to drop waypoints at intersections, entrances, and paths.</li>
                                <li>Select the <strong>Draw Path Edge</strong> tool (Line icon), click a starting node, and then click an ending node to connect them.</li>
                                <li>The system uses these connected paths to automatically calculate the shortest walking directions for users.</li>
                                <li>Always connect building entrances back to the main path network.</li>
                            </ul>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-4 aspect-video flex items-center justify-center relative overflow-hidden">
                            <div className="relative w-48 h-32">
                                {/* Nodes */}
                                <div className="absolute top-4 left-4 w-3 h-3 bg-blue-500 rounded-full shadow z-10" />
                                <div className="absolute top-16 left-24 w-3 h-3 bg-green-500 rounded-full shadow z-10" />
                                <div className="absolute top-4 right-4 w-3 h-3 bg-blue-500 rounded-full shadow z-10" />
                                <div className="absolute bottom-4 left-24 w-3 h-3 bg-blue-500 rounded-full shadow z-10" />

                                {/* Edges */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-primary" strokeWidth="2" strokeDasharray="4 4" fill="none">
                                    <line x1="20" y1="20" x2="100" y2="68" />
                                    <line x1="180" y1="20" x2="100" y2="68" />
                                    <line x1="100" y1="68" x2="100" y2="120" />
                                </svg>

                                <Badge className="absolute top-14 left-28 text-[8px] tracking-tighter" variant="secondary">Junction</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
