/**
 * FieldBase - Base field creation utilities
 */

import * as THREE from 'three';
import { FieldTypes } from '../config/index.js';

/**
 * Create furrows/rows pattern on the ground
 * @param {number} fieldWidth - Field width
 * @param {number} fieldDepth - Field depth
 * @param {number} rows - Number of rows
 * @param {string} type - Field type
 * @returns {Array} Array of geometry objects with mat keys
 */
export function createFurrows(fieldWidth, fieldDepth, rows, type) {
    const geometries = [];
    const furrowSpacing = fieldDepth / (rows + 1);

    for (let i = 1; i <= rows; i++) {
        const z = -fieldDepth / 2 + furrowSpacing * i;

        // Furrow ridge (raised earth)
        const ridgeGeo = new THREE.BoxGeometry(fieldWidth - 0.5, 0.15, 0.4);
        ridgeGeo.translate(0, 0.08, z);
        geometries.push({ geo: ridgeGeo, mat: 'soil' });
    }

    return geometries;
}

/**
 * Create the base soil/ground for a field
 * @param {number} fieldWidth - Field width
 * @param {number} fieldDepth - Field depth
 * @param {string} type - Field type
 * @returns {Array} Array of geometry objects with mat keys
 */
export function createFieldBase(fieldWidth, fieldDepth, type) {
    const geometries = [];

    // Main soil base
    const baseGeo = new THREE.BoxGeometry(fieldWidth, 0.1, fieldDepth);
    baseGeo.translate(0, 0.05, 0);

    if (type === FieldTypes.RICE) {
        // Rice paddy has water
        geometries.push({ geo: baseGeo, mat: 'water' });

        // Raised borders for rice paddy
        const borderThickness = 0.3;
        const borderHeight = 0.25;

        // Front border
        const front = new THREE.BoxGeometry(fieldWidth + borderThickness * 2, borderHeight, borderThickness);
        front.translate(0, borderHeight / 2, fieldDepth / 2 + borderThickness / 2);
        geometries.push({ geo: front, mat: 'soil' });

        // Back border
        const back = new THREE.BoxGeometry(fieldWidth + borderThickness * 2, borderHeight, borderThickness);
        back.translate(0, borderHeight / 2, -fieldDepth / 2 - borderThickness / 2);
        geometries.push({ geo: back, mat: 'soil' });

        // Left border
        const left = new THREE.BoxGeometry(borderThickness, borderHeight, fieldDepth);
        left.translate(-fieldWidth / 2 - borderThickness / 2, borderHeight / 2, 0);
        geometries.push({ geo: left, mat: 'soil' });

        // Right border
        const right = new THREE.BoxGeometry(borderThickness, borderHeight, fieldDepth);
        right.translate(fieldWidth / 2 + borderThickness / 2, borderHeight / 2, 0);
        geometries.push({ geo: right, mat: 'soil' });
    } else {
        geometries.push({ geo: baseGeo, mat: 'soil' });
    }

    return geometries;
}

/**
 * Update field progress visually
 * @param {THREE.Group} field - The field group
 * @param {number} progress - Progress value 0-100
 * @param {Function} regenerateCallback - Callback to regenerate plants when mature
 */
export function updateFieldProgress(field, progress, regenerateCallback) {
    field.userData.progress = Math.max(0, Math.min(100, progress));

    if (progress >= 100 && !field.userData.matured) {
        // Mark as matured to avoid re-regenerating
        field.userData.matured = true;
        field.userData.currentTask = null;

        // Regenerate plants as mature
        if (regenerateCallback) {
            regenerateCallback(field, true);
        }

        // Add completion visual: golden emissive glow on all meshes
        field.traverse((child) => {
            if (child.isMesh && child.material) {
                // Clone material to not affect other fields
                if (!child.userData.originalMaterial) {
                    child.userData.originalMaterial = child.material;
                    child.material = child.material.clone();
                }
                // Add golden glow
                child.material.emissive = new THREE.Color(0xffaa00);
                child.material.emissiveIntensity = 0.5;
            }
        });

        // Reset glow after 4 seconds
        setTimeout(() => {
            field.traverse((child) => {
                if (child.isMesh && child.material && child.material.emissive) {
                    child.material.emissive = new THREE.Color(0x000000);
                    child.material.emissiveIntensity = 0;
                }
            });
        }, 4000);
    }
}
