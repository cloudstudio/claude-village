/**
 * Fields module index - re-exports all field-related functions
 */

// Main field creation
export { createField, updateFieldProgress, regenerateFieldPlants } from './Field.js';

// Field management
export {
    getNextFieldPosition,
    resetFieldPlacement,
    generateWorkPositions,
    getFieldWorkPosition,
    assignAgentToField,
    releaseAgentFromField,
    removeTreesInArea
} from './FieldManager.js';

// Field base utilities
export { createFieldBase, createFurrows } from './FieldBase.js';

// Plant factory
export { createPlantGeometry } from './plants/index.js';
