// ==================== CONFIGURATION ====================

// Farm/Corral zone (where animals and dirt will be)
export const farmZone = {
    minX: -18, maxX: 18,
    minZ: -12, maxZ: 12
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

// Agent colors
export const agentColors = [
    0x6C5CE7,
    0x00B894,
    0xFDAA5E,
    0xE17055,
    0x00CEC9,
    0xFF7675,
    0xA29BFE,
    0x55A3FF
];

// Agent states
export const AgentState = {
    IDLE: 'idle',
    THINKING: 'thinking',
    WORKING: 'working',
    SUCCESS: 'success',
    ERROR: 'error'
};

// Sky color
export const skyColor = 0x87CEEB;

// Pond position (to avoid placing things on it)
export const pondPosition = { x: 35, z: 0, radius: 8 };

// Fixed positions for houses - starting from center and expanding outward
export const housePositions = [
    // Ring 1: Closest to farm center (just outside farm zone)
    { x: 22, z: 0 },
    { x: -22, z: 15 },
    { x: 0, z: 20 },
    { x: 15, z: -18 },
    { x: -18, z: -15 },
    // Ring 2: Medium distance
    { x: 30, z: 12 },
    { x: 28, z: -15 },
    { x: -25, z: 25 },
    { x: 12, z: 28 },
    { x: -15, z: -28 },
    // Ring 3: Further out
    { x: 40, z: 5 },
    { x: 38, z: -22 },
    { x: -30, z: 35 },
    { x: 25, z: 38 },
    { x: -28, z: -35 },
    // Ring 4: Outer areas
    { x: 50, z: 15 },
    { x: 48, z: -28 },
    { x: 20, z: 48 },
    { x: -45, z: 25 },
    { x: -42, z: -28 },
    // Ring 5: Far positions
    { x: 55, z: 30 },
    { x: 52, z: -38 },
    { x: 35, z: 52 },
    { x: -50, z: 40 },
    { x: -48, z: -42 },
];

// Demo task names
export const taskNames = [
    'Escribir función login',
    'Refactorizar auth module',
    'Crear tests unitarios',
    'Optimizar queries DB',
    'Implementar cache',
    'Documentar API',
    'Fix bug #123',
    'Update dependencias'
];

// Demo file names
export const fileNames = [
    'auth.js',
    'login.ts',
    'api.py',
    'index.tsx',
    'utils.js',
    'config.json',
    'styles.css',
    'data.sql'
];
