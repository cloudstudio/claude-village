/**
 * Math utilities - centralized math functions
 */

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

/**
 * Seeded pseudo-random number generator
 * Returns a value between 0 and 1 based on the seed
 * @param {number} seed - Seed value
 * @returns {number} Pseudo-random value between 0 and 1
 */
export function seededRandom(seed) {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
}

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Calculate distance between two 2D points
 * @param {number} x1 - First point X
 * @param {number} z1 - First point Z
 * @param {number} x2 - Second point X
 * @param {number} z2 - Second point Z
 * @returns {number} Distance
 */
export function distance2D(x1, z1, x2, z2) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    return Math.sqrt(dx * dx + dz * dz);
}
