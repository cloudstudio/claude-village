/**
 * Agent configuration - colors, states, demo data
 */

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
