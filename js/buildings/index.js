/**
 * Buildings module index - re-exports all building creation functions
 */

export { createHouse } from './House.js';
export { createHeadquarters } from './Headquarters.js';
export { createFence } from './Fence.js';
export { createPond, pondWater, pondWaterData, getPondWater, getPondWaterData } from './Pond.js';
export { wallColors, roofColors, doorColors, getRandomWallColor, getRandomRoofColor, getRandomDoorColor } from './HouseStyles.js';
