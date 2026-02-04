// ==================== CONFIGURATION ====================

// Field types for work areas
export const FieldTypes = {
    ORCHARD: 'orchard',      // Frutal (trees with fruits)
    RICE: 'rice',            // Rice paddy (water + plants)
    WHEAT: 'wheat',          // Wheat field (stalks)
    VEGETABLE: 'vegetable',  // Vegetable garden (varied)
    VINEYARD: 'vineyard',    // Vineyard (vines in rows)
};

// Field configuration per type - each can have its own size
// Fields are centered in their grid cell (max size = FIELD_GRID.fieldSize)
export const fieldConfig = {
    [FieldTypes.ORCHARD]: {
        width: 10,
        depth: 10,
        rows: 3,
        cols: 3,
        workAnimation: 'harvest'
    },
    [FieldTypes.RICE]: {
        width: 9,
        depth: 9,
        rows: 4,
        cols: 5,
        workAnimation: 'plant'
    },
    [FieldTypes.WHEAT]: {
        width: 10,
        depth: 8,
        rows: 5,
        cols: 6,
        workAnimation: 'harvest'
    },
    [FieldTypes.VEGETABLE]: {
        width: 8,
        depth: 8,
        rows: 4,
        cols: 4,
        workAnimation: 'tend'
    },
    [FieldTypes.VINEYARD]: {
        width: 10,
        depth: 9,
        rows: 3,
        cols: 5,
        workAnimation: 'prune'
    }
};

// Farm/Corral zone (where animals and dirt will be)
// Reduced size to make room for fields around it
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
    ERROR: 'error',
    HARVESTING: 'harvesting'
};

// Sky color
export const skyColor = 0x87CEEB;

// Pond position (to avoid placing things on it)
export const pondPosition = { x: 35, z: 0, radius: 8 };

// Field grid configuration - SIMPLE rectangular grid
// Fields are placed in a simple grid starting from top-left, going right then down
export const FIELD_GRID = {
    // Grid origin (top-left corner of first field)
    startX: -55,
    startZ: -45,
    // Field size (all fields same size)
    fieldSize: 10,
    // Gap between fields
    gap: 2,
    // Grid dimensions
    columns: 10,  // Fields per row
    rows: 8,      // Total rows
    // Blocked cells (where HQ, farm, pond are) - 2 rows in the middle
    // Row 3 and 4 (z from -9 to +15) contain all the main structures
    blockedRows: [3, 4],
};

// Fixed positions for houses - OUTSIDE the field grid
// Field grid: X from -55 to +65, Z from -45 to +51
// Safe zones: X > 70 (right), X < -60 (left), Z > 55 (bottom), Z < -50 (top)
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

// Demo task names
export const taskNames = [
    'Write login function',
    'Refactor auth module',
    'Create unit tests',
    'Optimize DB queries',
    'Implement cache',
    'Document API',
    'Fix bug #123',
    'Update dependencies'
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
