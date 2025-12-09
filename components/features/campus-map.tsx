"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Navigation, Info, X } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Dynamic import for Leaflet to work with Next.js SSR
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
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
    ssr: false,
});

interface Location {
    id: number;
    name: string;
    category: "Academic" | "Hostel" | "Facility" | "Recreation";
    coords: [number, number];
    description: string;
}

const campusLocations: Location[] = [
    { id: 1, name: "Main Block", category: "Academic", coords: [11.2588, 75.7804], description: "Administrative offices and CS Department." },
    { id: 2, name: "Science Block", category: "Academic", coords: [11.2590, 75.7810], description: "Physics, Chem labs and seminar halls." },
    { id: 3, name: "Central Library", category: "Facility", coords: [11.2585, 75.7808], description: "24/7 Library and Reading room." },
    { id: 4, name: "Men's Hostel", category: "Hostel", coords: [11.2580, 75.7815], description: "Senior and Junior men's hostel." },
    { id: 5, name: "Sports Ground", category: "Recreation", coords: [11.2595, 75.7800], description: "Football and Cricket ground." },
];

export function CampusMap() {
    const [selectedLoc, setSelectedLoc] = useState<Location | null>(null);
    const [L, setL] = useState<any>(null);

    useEffect(() => {
        // Fix leaflet marker icon issue
        import("leaflet").then((L) => {
            setL(L);
        });
    }, []);

    if (!L) return <div className="flex h-full items-center justify-center bg-muted/20">Loading Map...</div>;

    const customIcon = new L.Icon({
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    return (
        <div className="relative h-[calc(100vh-8rem)] w-full overflow-hidden rounded-xl border shadow-sm">
            <MapContainer
                center={[11.2588, 75.7804]}
                zoom={17}
                scrollWheelZoom={true}
                className="h-full w-full z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {campusLocations.map((loc) => (
                    <Marker
                        key={loc.id}
                        position={loc.coords}
                        icon={customIcon}
                        eventHandlers={{
                            click: () => setSelectedLoc(loc),
                        }}
                    >
                    </Marker>
                ))}
            </MapContainer>

            {/* Overlay Filters or Info */}
            <div className="absolute left-4 top-4 z-[1000] flex flex-col gap-2">
                {/* Categories could go here */}
            </div>

            {/* Detail Sidebar / Modal */}
            {selectedLoc && (
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    className="absolute right-0 top-0 z-[1000] h-full w-full max-w-sm border-l bg-background/95 p-6 backdrop-blur-sm sm:w-80"
                >
                    <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={() => setSelectedLoc(null)}>
                        <X className="h-4 w-4" />
                    </Button>
                    <div className="mt-8 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-primary/10 p-3 text-primary">
                                <MapPin className="h-6 w-6" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{selectedLoc.name}</h2>
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                {selectedLoc.category}
                            </span>
                        </div>

                        <p className="text-muted-foreground">{selectedLoc.description}</p>

                        <div className="pt-4">
                            <Button className="w-full gap-2">
                                <Navigation className="h-4 w-4" />
                                Navigate Here
                            </Button>
                        </div>

                        <div className="rounded-lg bg-muted p-4 text-sm">
                            <h4 className="mb-2 flex items-center gap-2 font-medium">
                                <Info className="h-4 w-4" />
                                Facility Info
                            </h4>
                            <p className="text-muted-foreground">Open: 9:00 AM - 5:00 PM</p>
                            <p className="text-muted-foreground">Floor: Ground</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
