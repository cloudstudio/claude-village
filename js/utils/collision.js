/**
 * Collision utilities - area and collision detection functions
 * Note: Config values are passed as parameters to avoid circular dependencies
 */

/**
 * Check if a position is inside the farm zone
 * @param {number} x - X coordinate
 * @param {number} z - Z coordinate
 * @param {{minX: number, maxX: number, minZ: number, maxZ: number}} farmZone - Farm zone bounds
 * @param {number} [padding=0] - Extra padding around farm
 * @returns {boolean} True if inside farm
 */
export function isInsideFarm(x, z, farmZone, padding = 0) {
    return (
        x > farmZone.minX - padding &&
        x < farmZone.maxX + padding &&
        z > farmZone.minZ - padding &&
        z < farmZone.maxZ + padding
    );
}

/**
 * Check if a position is inside the pond
 * @param {number} x - X coordinate
 * @param {number} z - Z coordinate
 * @param {{x: number, z: number, radius: number}} pondPosition - Pond position and radius
 * @param {number} [padding=0] - Extra padding around pond
 * @returns {boolean} True if inside pond
 */
export function isInPond(x, z, pondPosition, padding = 0) {
    const dx = x - pondPosition.x;
    const dz = z - pondPosition.z;
    const r = pondPosition.radius + padding;
    return dx * dx + dz * dz < r * r;
}

/**
 * Check if a position is inside the HQ area (barn)
 * @param {number} x - X coordinate
 * @param {number} z - Z coordinate
 * @param {number} [hqX=-35] - HQ X position
 * @param {number} [hqZ=0] - HQ Z position
 * @param {number} [radius=20] - HQ area radius
 * @param {number} [padding=0] - Extra padding
 * @returns {boolean} True if inside HQ area
 */
export function isInHQArea(x, z, hqX = -35, hqZ = 0, radius = 20, padding = 0) {
    const dx = x - hqX;
    const dz = z - hqZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    return dist < radius + padding;
}

/**
 * Check if a position is inside the field grid area
 * @param {number} x - X coordinate
 * @param {number} z - Z coordinate
 * @param {Object} fieldGrid - Field grid configuration
 * @param {number} [padding=6] - Extra padding around field grid
 * @returns {boolean} True if inside field area
 */
export function isInFieldArea(x, z, fieldGrid, padding = 6) {
    const endX = fieldGrid.startX + fieldGrid.columns * (fieldGrid.fieldSize + fieldGrid.gap);
    const endZ = fieldGrid.startZ + fieldGrid.rows * (fieldGrid.fieldSize + fieldGrid.gap);

    return (
        x > fieldGrid.startX - padding &&
        x < endX + padding &&
        z > fieldGrid.startZ - padding &&
        z < endZ + padding
    );
}

/**
 * Check if position is near any house position
 * @param {number} x - X coordinate
 * @param {number} z - Z coordinate
 * @param {Array<{x: number, z: number}>} housePositions - Array of house positions
 * @param {number} [minDist=8] - Minimum distance
 * @returns {boolean} True if near a house position
 */
export function isNearHousePosition(x, z, housePositions, minDist = 8) {
    for (const pos of housePositions) {
        const dx = pos.x - x;
        const dz = pos.z - z;
        if (Math.sqrt(dx * dx + dz * dz) < minDist) {
            return true;
        }
    }
    return false;
}

/**
 * Check if position is near pond
 * @param {number} x - X coordinate
 * @param {number} z - Z coordinate
 * @param {{x: number, z: number, radius: number}} pondPosition - Pond position
 * @param {number} [extraPadding=3] - Extra padding
 * @returns {boolean} True if near pond
 */
export function isNearPond(x, z, pondPosition, extraPadding = 3) {
    const dx = pondPosition.x - x;
    const dz = pondPosition.z - z;
    return Math.sqrt(dx * dx + dz * dz) < pondPosition.radius + extraPadding;
}

/**
 * Check AABB collision between a point and a rectangle
 * @param {number} x - Point X
 * @param {number} z - Point Z
 * @param {number} rectX - Rectangle center X
 * @param {number} rectZ - Rectangle center Z
 * @param {number} halfW - Half width
 * @param {number} halfD - Half depth
 * @returns {boolean} True if point is inside rectangle
 */
export function pointInRect(x, z, rectX, rectZ, halfW, halfD) {
    return x > rectX - halfW && x < rectX + halfW &&
           z > rectZ - halfD && z < rectZ + halfD;
}

/**
 * Check if two circles overlap
 * @param {number} x1 - First center X
 * @param {number} z1 - First center Z
 * @param {number} r1 - First radius
 * @param {number} x2 - Second center X
 * @param {number} z2 - Second center Z
 * @param {number} r2 - Second radius
 * @returns {boolean} True if circles overlap
 */
export function circlesOverlap(x1, z1, r1, x2, z2, r2) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const distSq = dx * dx + dz * dz;
    const minDist = r1 + r2;
    return distSq < minDist * minDist;
}
