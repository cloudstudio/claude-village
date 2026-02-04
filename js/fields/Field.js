/**
 * Field - Main field creation function
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { materials, fieldMaterials } from '../materials/index.js';
import { FieldTypes, fieldConfig, FIELD_GRID } from '../config/index.js';
import { getHeightAt } from '../utils/index.js';
import { state } from '../core/State.js';
import { createFieldBase, createFurrows, updateFieldProgress as baseUpdateProgress } from './FieldBase.js';
import { getNextFieldPosition, generateWorkPositions, removeTreesInArea } from './FieldManager.js';
import { createPlantGeometry } from './plants/index.js';

/**
 * Create a field of the specified type
 * @param {THREE.Scene} scene - The scene to add to
 * @param {string} type - Field type from FieldTypes
 * @param {number|null} x - X position (null for auto-placement)
 * @param {number|null} z - Z position (null for auto-placement)
 * @param {Object} options - Optional overrides for width, depth, rows, cols
 * @returns {THREE.Group|null} The field group or null if placement fails
 */
export function createField(scene, type, x = null, z = null, options = {}) {
    // If no position provided, get next position from grid (centered)
    if (x === null || z === null) {
        const pos = getNextFieldPosition();
        x = pos.x;
        z = pos.z;
    }

    const config = fieldConfig[type] || fieldConfig[FieldTypes.VEGETABLE];
    // Each field type can have its own size (centered in grid cell)
    const fieldWidth = options.width || config.width || FIELD_GRID.fieldSize;
    const fieldDepth = options.depth || config.depth || FIELD_GRID.fieldSize;
    const rows = options.rows || config.rows;
    const cols = options.cols || config.cols;

    // Check if position collides with existing houses
    if (state.collidesWithHouses(x, z, fieldWidth / 2 + 2)) {
        console.warn('Cannot create field: house exists at position', x, z);
        return null;
    }

    // Remove any trees in the field area
    removeTreesInArea(scene, x, z, fieldWidth, fieldDepth);

    const y = getHeightAt(x, z);
    const allGeometries = [];

    // 1. Create base soil/water
    const baseGeos = createFieldBase(fieldWidth, fieldDepth, type);
    allGeometries.push(...baseGeos);

    // 2. Create furrows (except for orchard and vineyard which don't need them)
    if (type !== FieldTypes.ORCHARD && type !== FieldTypes.VINEYARD) {
        const furrowGeos = createFurrows(fieldWidth, fieldDepth, rows, type);
        allGeometries.push(...furrowGeos);
    }

    // 3. Create plants/crops (start as young/immature)
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const plantGeos = createPlantGeometry(type, row, col, fieldWidth, fieldDepth, rows, cols, false);
            allGeometries.push(...plantGeos);
        }
    }

    // Group geometries by material type
    const byMaterial = new Map();
    allGeometries.forEach(({ geo, mat }) => {
        const material = fieldMaterials[mat] || materials[mat] || materials.grass;
        if (!byMaterial.has(material)) byMaterial.set(material, []);
        const finalGeo = geo.index ? geo.toNonIndexed() : geo;
        byMaterial.get(material).push(finalGeo);
    });

    // Create merged meshes
    const group = new THREE.Group();
    byMaterial.forEach((geos, mat) => {
        const merged = mergeGeometries(geos);
        if (merged) {
            const mesh = new THREE.Mesh(merged, mat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
        }
    });

    // Position field
    group.position.set(x, y, z);

    // Field metadata
    const fieldId = `field-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    group.userData = {
        id: fieldId,
        type,
        x,
        z,
        width: fieldWidth,
        depth: fieldDepth,
        rows,
        cols,
        progress: 0,
        currentTask: null,
        assignedAgent: null,
        // Work positions within the field (for agent movement)
        workPositions: generateWorkPositions(x, z, fieldWidth, fieldDepth, rows, cols),
        bounds: {
            width: fieldWidth + 1,
            depth: fieldDepth + 1,
            radius: Math.max(fieldWidth, fieldDepth) / 2 + 1
        }
    };

    scene.add(group);
    state.addField(group);

    // Register position to avoid overlaps
    state.registerPosition(x, z, Math.max(fieldWidth, fieldDepth) / 2 + 2);

    return group;
}

/**
 * Regenerate all plants in a field (for growth transitions)
 * @param {THREE.Group} field - The field group
 * @param {boolean} mature - Whether to generate mature plants
 */
export function regenerateFieldPlants(field, mature) {
    const { type, width, depth, rows, cols } = field.userData;
    const fieldWidth = width || FIELD_GRID.fieldSize;
    const fieldDepth = depth || FIELD_GRID.fieldSize;

    // Remove all existing meshes
    const toRemove = [];
    field.traverse((child) => {
        if (child.isMesh) {
            toRemove.push(child);
        }
    });
    toRemove.forEach(mesh => {
        mesh.geometry.dispose();
        field.remove(mesh);
    });

    // Rebuild all geometries
    const allGeometries = [];

    // 1. Create base soil/water
    const baseGeos = createFieldBase(fieldWidth, fieldDepth, type);
    allGeometries.push(...baseGeos);

    // 2. Create furrows (except for orchard and vineyard)
    if (type !== FieldTypes.ORCHARD && type !== FieldTypes.VINEYARD) {
        const furrowGeos = createFurrows(fieldWidth, fieldDepth, rows, type);
        allGeometries.push(...furrowGeos);
    }

    // 3. Create plants with new maturity level
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const plantGeos = createPlantGeometry(type, row, col, fieldWidth, fieldDepth, rows, cols, mature);
            allGeometries.push(...plantGeos);
        }
    }

    // Group geometries by material type
    const byMaterial = new Map();
    allGeometries.forEach(({ geo, mat }) => {
        const material = fieldMaterials[mat] || materials[mat] || materials.grass;
        if (!byMaterial.has(material)) byMaterial.set(material, []);
        const finalGeo = geo.index ? geo.toNonIndexed() : geo;
        byMaterial.get(material).push(finalGeo);
    });

    // Create merged meshes
    byMaterial.forEach((geos, mat) => {
        const merged = mergeGeometries(geos);
        if (merged) {
            const mesh = new THREE.Mesh(merged, mat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            field.add(mesh);
        }
    });
}

/**
 * Update field progress visually
 * @param {THREE.Group} field - The field group
 * @param {number} progress - Progress value 0-100
 */
export function updateFieldProgress(field, progress) {
    baseUpdateProgress(field, progress, regenerateFieldPlants);
}
