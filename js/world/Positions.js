/**
 * Positions - Position finding and management utilities
 */

import { state } from '../core/State.js';
import { snapToGrid, gridifyPosition } from '../utils/grid.js';
import { isInsideFarm, isInPond, isInHQArea, isInFieldArea } from '../utils/collision.js';
import { farmZone, pondPosition, housePositions, houseLayout, grid, FIELD_GRID } from '../config/index.js';

const GRID_SIZE = grid?.size ?? 6;
const HOUSE_MIN_RADIUS = houseLayout?.ringMin ?? 36;
const HOUSE_MAX_RADIUS = houseLayout?.ringMax ?? 90;
const HOUSE_GRID_STEP = houseLayout?.gridStep ?? (grid?.size ?? 6) * 2;
const HOUSE_EXCLUDE_PADDING = houseLayout?.reservePadding ?? 6;
const MIN_HOUSE_SPACING = 16;

/**
 * Hash function for deterministic cell ordering
 * @param {number} ix - Grid index X
 * @param {number} iz - Grid index Z
 * @returns {number} Hash value
 */
function cellHash(ix, iz) {
    return ((ix * 73856093) ^ (iz * 19349663)) >>> 0;
}

/**
 * Generate house placement slots
 * @returns {Array<{x: number, z: number, ix: number, iz: number}>} Array of valid slots
 */
export function getHouseSlots() {
    if (state.houseSlots) return state.houseSlots;

    const seen = new Set();
    const slots = [];

    const addSlot = (x, z) => {
        const key = `${x},${z}`;
        if (seen.has(key)) return;
        seen.add(key);
        slots.push({ x, z, ix: Math.round(x / GRID_SIZE), iz: Math.round(z / GRID_SIZE) });
    };

    // Start with curated positions (snapped to grid)
    for (const pos of housePositions) {
        const snapped = snapToGrid(pos.x, pos.z, HOUSE_GRID_STEP);
        if (isInPond(snapped.x, snapped.z, pondPosition, HOUSE_EXCLUDE_PADDING)) continue;
        if (isInHQArea(snapped.x, snapped.z)) continue;
        if (isInsideFarm(snapped.x, snapped.z, farmZone, HOUSE_EXCLUDE_PADDING)) continue;
        addSlot(snapped.x, snapped.z);
    }

    // Fill with grid slots around the village ring
    for (let x = -100; x <= 100; x += HOUSE_GRID_STEP) {
        for (let z = -100; z <= 100; z += HOUSE_GRID_STEP) {
            const { x: gx, z: gz } = snapToGrid(x, z, HOUSE_GRID_STEP);
            const dist = Math.hypot(gx, gz);
            if (dist < HOUSE_MIN_RADIUS || dist > HOUSE_MAX_RADIUS) continue;
            if (isInsideFarm(gx, gz, farmZone, HOUSE_EXCLUDE_PADDING)) continue;
            if (isInPond(gx, gz, pondPosition, HOUSE_EXCLUDE_PADDING)) continue;
            if (isInHQArea(gx, gz)) continue;
            if (isInFieldArea(gx, gz, FIELD_GRID, HOUSE_EXCLUDE_PADDING)) continue;
            addSlot(gx, gz);
        }
    }

    // Deterministic distribution across map
    slots.sort((a, b) => cellHash(a.ix, a.iz) - cellHash(b.ix, b.iz));
    state.houseSlots = slots;
    return state.houseSlots;
}

/**
 * Get a random position inside the farm
 * @param {number} [radius=1] - Required radius
 * @returns {{x: number, z: number}} Position
 */
export function getRandomPositionInFarm(radius = 1) {
    const bounds = {
        minX: farmZone.minX + 1,
        maxX: farmZone.maxX - 1,
        minZ: farmZone.minZ + 1,
        maxZ: farmZone.maxZ - 1
    };

    for (let attempts = 0; attempts < 50; attempts++) {
        const rawX = farmZone.minX + 2 + Math.random() * (farmZone.maxX - farmZone.minX - 4);
        const rawZ = farmZone.minZ + 2 + Math.random() * (farmZone.maxZ - farmZone.minZ - 4);
        const { x, z } = gridifyPosition(rawX, rawZ, bounds, GRID_SIZE);

        if (state.isPositionFree(x, z, radius)) {
            return { x, z };
        }
    }

    return gridifyPosition(
        farmZone.minX + 2 + Math.random() * (farmZone.maxX - farmZone.minX - 4),
        farmZone.minZ + 2 + Math.random() * (farmZone.maxZ - farmZone.minZ - 4),
        bounds,
        GRID_SIZE
    );
}

/**
 * Get a random position outside the farm
 * @param {number} minDist - Minimum distance from center
 * @param {number} maxDist - Maximum distance from center
 * @param {number} [radius=1] - Required radius
 * @returns {{x: number, z: number}} Position
 */
export function getRandomPositionOutsideFarm(minDist, maxDist, radius = 1) {
    for (let attempts = 0; attempts < 100; attempts++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = minDist + Math.random() * (maxDist - minDist);
        const rawX = Math.cos(angle) * dist;
        const rawZ = Math.sin(angle) * dist;
        const { x, z } = gridifyPosition(rawX, rawZ, null, GRID_SIZE);

        if (state.isPositionFree(x, z, radius, true, farmZone)) {
            return { x, z };
        }
    }

    const angle = Math.random() * Math.PI * 2;
    const dist = minDist + Math.random() * (maxDist - minDist);
    return gridifyPosition(Math.cos(angle) * dist, Math.sin(angle) * dist, null, GRID_SIZE);
}

/**
 * Find a valid position for placing a house
 * @param {number} [minDist=12] - Minimum spacing
 * @returns {{x: number, z: number}} Position
 */
export function findPosition(minDist = 12) {
    const spacing = Math.max(minDist, MIN_HOUSE_SPACING);

    // Try random positions in a ring around the village
    for (let attempts = 0; attempts < 100; attempts++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = HOUSE_MIN_RADIUS + Math.random() * (HOUSE_MAX_RADIUS - HOUSE_MIN_RADIUS);
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;

        const snapped = snapToGrid(x, z, HOUSE_GRID_STEP);

        // Skip if in excluded areas
        if (isInPond(snapped.x, snapped.z, pondPosition, HOUSE_EXCLUDE_PADDING)) continue;
        if (isInHQArea(snapped.x, snapped.z)) continue;
        if (isInsideFarm(snapped.x, snapped.z, farmZone, HOUSE_EXCLUDE_PADDING)) continue;
        if (isInFieldArea(snapped.x, snapped.z, FIELD_GRID, HOUSE_EXCLUDE_PADDING)) continue;

        // Skip if too close to existing structures
        if (state.collidesWithHouses(snapped.x, snapped.z, spacing)) continue;
        if (state.collidesWithFields(snapped.x, snapped.z, HOUSE_EXCLUDE_PADDING)) continue;
        if (!state.isPositionFree(snapped.x, snapped.z, spacing / 2)) continue;

        state.registerPosition(snapped.x, snapped.z, spacing / 2);
        return { x: snapped.x, z: snapped.z };
    }

    // Fallback: find ANY valid position
    for (let attempts = 0; attempts < 50; attempts++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 80;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;

        if (isInPond(x, z, pondPosition, HOUSE_EXCLUDE_PADDING)) continue;
        if (isInHQArea(x, z)) continue;
        if (isInsideFarm(x, z, farmZone, HOUSE_EXCLUDE_PADDING)) continue;
        if (isInFieldArea(x, z, FIELD_GRID, HOUSE_EXCLUDE_PADDING)) continue;
        if (state.collidesWithHouses(x, z, spacing)) continue;
        if (state.collidesWithFields(x, z, HOUSE_EXCLUDE_PADDING)) continue;

        state.registerPosition(x, z, spacing / 2);
        return { x, z };
    }

    // Last resort
    const fallbackX = 50 + Math.random() * 30;
    const fallbackZ = (Math.random() - 0.5) * 60;
    state.registerPosition(fallbackX, fallbackZ, spacing / 2);
    return { x: fallbackX, z: fallbackZ };
}

/**
 * Get farm grid cells for animal placement
 * @param {number} [step=6] - Grid step size
 * @returns {Array<{x: number, z: number}>} Array of grid cells
 */
export function getFarmGridCells(step = GRID_SIZE) {
    const cells = [];
    for (let x = farmZone.minX + step; x <= farmZone.maxX - step; x += step) {
        for (let z = farmZone.minZ + step; z <= farmZone.maxZ - step; z += step) {
            cells.push({ x, z });
        }
    }
    return cells;
}
