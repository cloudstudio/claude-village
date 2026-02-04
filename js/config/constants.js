/**
 * Global constants and world configuration
 */

// Sky color
export const skyColor = 0x87CEEB;

// Farm/Corral zone (where animals and dirt will be)
export const farmZone = {
    minX: -12, maxX: 12,
    minZ: -8, maxZ: 8
};

// World grid (for ordered placement/movement)
export const grid = {
    size: 6,
    jitter: 0.0
};

// House placement layout (grid + ring)
export const houseLayout = {
    ringMin: 36,
    ringMax: 90,
    gridStep: 12,
    reservePadding: 6
};

// Pond position (to avoid placing things on it)
export const pondPosition = { x: 35, z: 0, radius: 8 };

// Field grid configuration - SIMPLE rectangular grid
export const FIELD_GRID = {
    // Grid origin (top-left corner of first field)
    startX: -55,
    startZ: -45,
    // Field size (all fields same size)
    fieldSize: 10,
    // Gap between fields
    gap: 2,
    // Grid dimensions
    columns: 10,
    rows: 8,
    // Blocked cells (where HQ, farm, pond are)
    blockedRows: [3, 4],
};

// Fixed positions for houses - OUTSIDE the field grid
export const housePositions = [
    // Right zone (X > 70)
    { x: 75, z: -20 },
    { x: 75, z: 0 },
    { x: 75, z: 20 },
    { x: 85, z: -10 },
    { x: 85, z: 10 },
    { x: 95, z: -15 },
    { x: 95, z: 5 },
    // Bottom zone (Z > 55)
    { x: -30, z: 60 },
    { x: -10, z: 60 },
    { x: 10, z: 60 },
    { x: 30, z: 60 },
    { x: -20, z: 70 },
    { x: 0, z: 70 },
    { x: 20, z: 70 },
    // Top zone (Z < -50)
    { x: -30, z: -55 },
    { x: -10, z: -55 },
    { x: 10, z: -55 },
    { x: 30, z: -55 },
    { x: -20, z: -65 },
    { x: 0, z: -65 },
    { x: 20, z: -65 },
    // Left zone (X < -60)
    { x: -65, z: -20 },
    { x: -65, z: 0 },
    { x: -65, z: 20 },
    { x: -75, z: -10 },
    { x: -75, z: 10 },
];

// Map boundaries
export const mapBounds = { minX: -130, maxX: 130, minZ: -130, maxZ: 130 };

// World boundaries for camera/objects
export const WORLD_BOUNDS = { minX: -120, maxX: 120, minZ: -120, maxZ: 120 };
