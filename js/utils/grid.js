/**
 * Grid utilities - functions for grid-based positioning and movement
 */

import { clamp } from './math.js';

/**
 * Snap coordinates to the nearest grid position
 * @param {number} x - X coordinate
 * @param {number} z - Z coordinate
 * @param {number} [size=6] - Grid cell size
 * @returns {{x: number, z: number}} Snapped coordinates
 */
export function snapToGrid(x, z, size = 6) {
    return {
        x: Math.round(x / size) * size,
        z: Math.round(z / size) * size
    };
}

/**
 * Apply jitter to grid position for more natural placement
 * @param {number} x - X coordinate
 * @param {number} z - Z coordinate
 * @param {number} [size=6] - Grid cell size
 * @param {number} [jitter=0] - Jitter amount (0-1)
 * @returns {{x: number, z: number}} Jittered coordinates
 */
export function applyGridJitter(x, z, size = 6, jitter = 0) {
    if (!jitter) return { x, z };
    const range = size * jitter;
    return {
        x: x + (Math.random() - 0.5) * range,
        z: z + (Math.random() - 0.5) * range
    };
}

/**
 * Snap to grid and apply optional jitter and bounds clamping
 * @param {number} x - X coordinate
 * @param {number} z - Z coordinate
 * @param {Object} [bounds] - Optional bounds {minX, maxX, minZ, maxZ}
 * @param {number} [size=6] - Grid cell size
 * @param {number} [jitter=0] - Jitter amount
 * @returns {{x: number, z: number}} Final coordinates
 */
export function gridifyPosition(x, z, bounds = null, size = 6, jitter = 0) {
    const snapped = snapToGrid(x, z, size);
    const jittered = applyGridJitter(snapped.x, snapped.z, size, jitter);
    let gx = jittered.x;
    let gz = jittered.z;

    if (bounds) {
        gx = clamp(gx, bounds.minX, bounds.maxX);
        gz = clamp(gz, bounds.minZ, bounds.maxZ);
    }

    return { x: gx, z: gz };
}

/**
 * Pick a random grid-aligned step target from current position
 * @param {number} currentX - Current X position
 * @param {number} currentZ - Current Z position
 * @param {Object} [bounds] - Optional bounds {minX, maxX, minZ, maxZ}
 * @param {number} [step=6] - Step size
 * @returns {{x: number, z: number}} Target coordinates
 */
export function pickGridStepTarget(currentX, currentZ, bounds = null, step = 6) {
    const dirs = [-1, 0, 1];
    let dx = 0;
    let dz = 0;

    while (dx === 0 && dz === 0) {
        dx = dirs[Math.floor(Math.random() * dirs.length)];
        dz = dirs[Math.floor(Math.random() * dirs.length)];
    }

    let targetX = currentX + dx * step;
    let targetZ = currentZ + dz * step;
    const snapped = snapToGrid(targetX, targetZ, step);
    targetX = snapped.x;
    targetZ = snapped.z;

    if (bounds) {
        targetX = clamp(targetX, bounds.minX, bounds.maxX);
        targetZ = clamp(targetZ, bounds.minZ, bounds.maxZ);
    }

    return { x: targetX, z: targetZ };
}

/**
 * Pick a random grid-aligned target around a home position
 * @param {number} homeX - Home X position
 * @param {number} homeZ - Home Z position
 * @param {number} radius - Maximum radius from home
 * @param {number} [step=6] - Grid step size
 * @param {Object} [bounds] - Optional bounds
 * @returns {{x: number, z: number}} Target coordinates
 */
export function pickGridTargetAround(homeX, homeZ, radius, step = 6, bounds = null) {
    const offsetX = (Math.random() * 2 - 1) * radius;
    const offsetZ = (Math.random() * 2 - 1) * radius;
    const snapped = snapToGrid(homeX + offsetX, homeZ + offsetZ, step);
    let x = snapped.x;
    let z = snapped.z;

    if (bounds) {
        x = clamp(x, bounds.minX, bounds.maxX);
        z = clamp(z, bounds.minZ, bounds.maxZ);
    }

    return { x, z };
}

/**
 * Get grid cell index for a value
 * @param {number} value - Coordinate value
 * @param {number} [step=6] - Grid step size
 * @returns {number} Grid index
 */
export function gridIndex(value, step = 6) {
    return Math.round(value / step);
}

/**
 * Check if a cell should be used based on pattern
 * @param {number} x - X coordinate
 * @param {number} z - Z coordinate
 * @param {number} [pattern=2] - Pattern divisor
 * @param {number} [offset=0] - Pattern offset
 * @param {number} [step=6] - Grid step size
 * @returns {boolean} Whether cell should be used
 */
export function shouldUseCell(x, z, pattern = 2, offset = 0, step = 6) {
    return (gridIndex(x, step) + gridIndex(z, step) + offset) % pattern === 0;
}
