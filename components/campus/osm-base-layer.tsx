"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { latToY, lonToX, xToLon, yToLat } from "@/lib/map-projection";

interface OSMBaseLayerProps {
    panOffset: { x: number; y: number };
    zoom: number; // canvas zoom multiplier
    canvasWidth: number;
    canvasHeight: number;
    anchorLat: number;
    anchorLon: number;
}

function MapSyncer({ panOffset, zoom, canvasWidth, canvasHeight, anchorLat, anchorLon }: OSMBaseLayerProps) {
    const map = useMap();

    useEffect(() => {
        if (canvasWidth === 0 || canvasHeight === 0) return;

        // The anchor point (canvas 0,0) matches the provided real-world lat/lon
        const anchorX = lonToX(anchorLon);
        const anchorY = latToY(anchorLat);

        // Calculate the central pixel of the current canvas view
        const viewCenterX = (canvasWidth / 2 - panOffset.x) / zoom;
        const viewCenterY = (canvasHeight / 2 - panOffset.y) / zoom;

        // Convert the view center back to GPS coordinates
        const centerLon = xToLon(viewCenterX + anchorX);
        const centerLat = yToLat(viewCenterY + anchorY);

        // Web Mercator zoom 19 equals canvas zoom 1.0
        const leafletZoom = 19 + Math.log2(zoom);

        map.setView([centerLat, centerLon], leafletZoom, { animate: false });
    }, [map, panOffset, zoom, canvasWidth, canvasHeight, anchorLat, anchorLon]);

    return null;
}

export default function OSMBaseLayer(props: OSMBaseLayerProps) {
    return (
        <MapContainer
            center={[props.anchorLat, props.anchorLon]}
            zoom={19}
            zoomControl={false}
            attributionControl={false}
            dragging={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            boxZoom={false}
            keyboard={false}
            style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, zIndex: 0, pointerEvents: "none" }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxNativeZoom={19}
                maxZoom={24}
                opacity={0.4} // Slight transparency so canvas elements pop out
            />
            <MapSyncer {...props} />
        </MapContainer>
    );
}
