/**
 * HouseStyles - Color palettes for houses
 */

// Wall color material keys
export const wallColors = [
    'wallWhite', 'wallCream', 'wallYellow', 'wallPink',
    'wallBlue', 'wallGreen', 'wallOrange', 'wallBrick',
    'woodLight', 'woodBirch'
];

// Roof color material keys
export const roofColors = [
    'roofRed', 'roofBrown', 'roofBlue', 'roofGreen',
    'roofOrange', 'roofPurple'
];

// Door color material keys
export const doorColors = ['doorDark', 'doorRed', 'doorBlue', 'doorGreen'];

/**
 * Get random wall material key
 * @returns {string} Material key
 */
export function getRandomWallColor() {
    return wallColors[Math.floor(Math.random() * wallColors.length)];
}

/**
 * Get random roof material key
 * @returns {string} Material key
 */
export function getRandomRoofColor() {
    return roofColors[Math.floor(Math.random() * roofColors.length)];
}

/**
 * Get random door material key
 * @returns {string} Material key
 */
export function getRandomDoorColor() {
    return doorColors[Math.floor(Math.random() * doorColors.length)];
}
