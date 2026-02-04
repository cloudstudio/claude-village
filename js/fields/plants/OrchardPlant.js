/**
 * OrchardPlant - Fruit tree geometry for orchards
 */

import * as THREE from 'three';
import { seededRandom } from '../../utils/index.js';

/**
 * Create orchard tree geometry
 * @param {Object} ctx - Plant context with position, seed, size factors
 * @returns {Array} Array of geometry objects with mat keys
 */
export function createOrchardPlant(ctx) {
    const { localX, localZ, plantSeed, sizeFactor, mature } = ctx;
    const geometries = [];

    // Tree trunk with slight variation
    const trunkHeight = (1.4 + seededRandom(plantSeed) * 0.3) * sizeFactor;
    const trunkGeo = new THREE.CylinderGeometry(0.15 * sizeFactor, 0.22 * sizeFactor, trunkHeight, 6);
    trunkGeo.translate(localX, trunkHeight / 2, localZ);
    geometries.push({ geo: trunkGeo, mat: 'trunk' });

    // Visible branches (3 extending from trunk)
    for (let b = 0; b < 3; b++) {
        const branchAngle = (b / 3) * Math.PI * 2 + seededRandom(plantSeed + b) * 0.5;
        const branchLen = (0.4 + seededRandom(plantSeed + b + 10) * 0.2) * sizeFactor;
        const branchGeo = new THREE.CylinderGeometry(0.04 * sizeFactor, 0.06 * sizeFactor, branchLen, 4);
        branchGeo.rotateZ(Math.PI / 3);
        branchGeo.rotateY(branchAngle);
        branchGeo.translate(
            localX + Math.cos(branchAngle) * 0.2 * sizeFactor,
            trunkHeight * 0.7,
            localZ + Math.sin(branchAngle) * 0.2 * sizeFactor
        );
        geometries.push({ geo: branchGeo, mat: 'trunk' });
    }

    // Tree crown (ellipsoid with random scale)
    const crownScaleX = 0.85 + seededRandom(plantSeed + 20) * 0.35;
    const crownScaleZ = 0.85 + seededRandom(plantSeed + 21) * 0.35;
    const crownGeo = new THREE.SphereGeometry(0.85 * sizeFactor, 8, 6);
    crownGeo.scale(crownScaleX, 1, crownScaleZ);
    crownGeo.translate(localX, trunkHeight + 0.6 * sizeFactor, localZ);
    geometries.push({ geo: crownGeo, mat: 'leaves' });

    // Fruits - green/small when young, red/abundant when mature
    const fruitCount = mature
        ? 15 + Math.floor(seededRandom(plantSeed + 30) * 10)  // 15-25 fruits when mature
        : 4 + Math.floor(seededRandom(plantSeed + 30) * 3);   // 4-7 small fruits when young
    const fruitSize = mature ? 0.12 : 0.05;  // Smaller fruits when young
    const fruitMat = mature ? 'fruit' : 'fruitGreen';  // Green when young

    for (let i = 0; i < fruitCount; i++) {
        const angle = seededRandom(plantSeed + i + 40) * Math.PI * 2;
        const radius = (0.3 + seededRandom(plantSeed + i + 50) * 0.4) * sizeFactor;
        const heightOffset = (seededRandom(plantSeed + i + 60) * 0.6 - 0.2) * sizeFactor;
        const sizeVariation = fruitSize + seededRandom(plantSeed + i + 70) * 0.03;
        const fruitGeo = new THREE.SphereGeometry(sizeVariation, 6, 4);
        fruitGeo.translate(
            localX + Math.cos(angle) * radius * crownScaleX,
            trunkHeight + 0.4 * sizeFactor + heightOffset,
            localZ + Math.sin(angle) * radius * crownScaleZ
        );
        // When mature, vary between red and dark red; when young, all green
        const matType = mature
            ? (seededRandom(plantSeed + i + 80) > 0.5 ? 'fruit' : 'fruitDark')
            : fruitMat;
        geometries.push({ geo: fruitGeo, mat: matType });
    }

    return geometries;
}
