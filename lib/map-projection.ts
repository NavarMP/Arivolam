// Web Mercator Mathematical Projection for Campus Map Coordinates

// We lock our logical canvas coordinates to OSM Web Mercator at Zoom Level 19.
// This ensures 1 canvas pixel = 1 web mercator pixel at zoom 19, allowing seamless 
// overlay of our custom map drawing canvas on top of standard map tiles.
const REFERENCE_ZOOM = 19;
export const MAP_TILE_SIZE = 256;
export const WORLD_SIZE = MAP_TILE_SIZE * Math.pow(2, REFERENCE_ZOOM);

/**
 * Converts Longitude to Canvas X (at Zoom 19)
 */
export function lonToX(lon: number): number {
    return ((lon + 180) / 360) * WORLD_SIZE;
}

/**
 * Converts Latitude to Canvas Y (at Zoom 19)
 */
export function latToY(lat: number): number {
    const latRad = (lat * Math.PI) / 180;
    return (
        ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
        WORLD_SIZE
    );
}

/**
 * Converts Canvas X to Longitude (at Zoom 19)
 */
export function xToLon(x: number): number {
    return (x / WORLD_SIZE) * 360 - 180;
}

/**
 * Converts Canvas Y to Latitude (at Zoom 19)
 */
export function yToLat(y: number): number {
    const n = Math.PI - (2 * Math.PI * y) / WORLD_SIZE;
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}
