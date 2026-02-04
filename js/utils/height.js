/**
 * Height utilities - terrain height calculations
 */

/**
 * Get terrain height at a given position
 * Calculates height based on distance from center with hills at edges
 * @param {number} x - X coordinate
 * @param {number} z - Z coordinate
 * @returns {number} Height at position
 */
export function getHeightAt(x, z) {
    const dist = Math.sqrt(x * x + z * z);

    if (dist > 150) {
        // Mountains at far edges
        return Math.pow((dist - 150) / 100, 2) * 50 + Math.sin(x * 0.1) * Math.cos(z * 0.1) * 3;
    } else if (dist > 80) {
        // Rolling hills in transition zone
        const t = (dist - 80) / 70;
        return Math.sin(x * 0.15) * Math.cos(z * 0.15) * t * 2;
    }

    // Flat center
    return 0;
}
