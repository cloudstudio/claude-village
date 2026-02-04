/**
 * PlantFactory - Creates plant geometries based on field type
 */

import { FieldTypes } from '../../config/index.js';
import { seededRandom } from '../../utils/index.js';
import { createOrchardPlant } from './OrchardPlant.js';
import { createRicePlant } from './RicePlant.js';
import { createWheatPlant } from './WheatPlant.js';
import { createVegetablePlant } from './VegetablePlant.js';
import { createVinePlant } from './VinePlant.js';

/**
 * Create a single plant/crop based on field type
 * @param {string} type - Field type
 * @param {number} row - Plant row
 * @param {number} col - Plant column
 * @param {number} fieldWidth - Field width
 * @param {number} fieldDepth - Field depth
 * @param {number} rows - Total rows
 * @param {number} cols - Total columns
 * @param {boolean} mature - Whether plant is fully grown
 * @returns {Array} Array of geometry objects with mat keys
 */
export function createPlantGeometry(type, row, col, fieldWidth, fieldDepth, rows, cols, mature = true) {
    // Calculate plant position within field
    const spacingX = fieldWidth / (cols + 1);
    const spacingZ = fieldDepth / (rows + 1);
    const localX = -fieldWidth / 2 + spacingX * (col + 1);
    const localZ = -fieldDepth / 2 + spacingZ * (row + 1);

    // Seed for this plant (deterministic but varied)
    const plantSeed = row * 100 + col;

    // Growth factors: young plants are MUCH smaller and have fewer elements
    const sizeFactor = mature ? 1.0 : 0.15;  // 15% size when young
    const densityFactor = mature ? 1.0 : 0.25;  // 25% density when young

    const context = {
        localX,
        localZ,
        spacingX,
        spacingZ,
        plantSeed,
        sizeFactor,
        densityFactor,
        mature
    };

    switch (type) {
        case FieldTypes.ORCHARD:
            return createOrchardPlant(context);
        case FieldTypes.RICE:
            return createRicePlant(context);
        case FieldTypes.WHEAT:
            return createWheatPlant(context);
        case FieldTypes.VEGETABLE:
            return createVegetablePlant(context);
        case FieldTypes.VINEYARD:
            return createVinePlant(context);
        default:
            return [];
    }
}
