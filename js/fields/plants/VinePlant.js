/**
 * VinePlant - Vineyard grapevine geometry
 */

import * as THREE from 'three';
import { seededRandom } from '../../utils/index.js';

/**
 * Create vineyard grapevine geometry
 * @param {Object} ctx - Plant context with position, seed, size factors
 * @returns {Array} Array of geometry objects with mat keys
 */
export function createVinePlant(ctx) {
    const { localX, localZ, spacingX, plantSeed, sizeFactor, mature } = ctx;
    const geometries = [];

    // Vine post - always present
    const postGeo = new THREE.BoxGeometry(0.1, 1.3 * sizeFactor, 0.1);
    postGeo.translate(localX, 0.65 * sizeFactor, localZ);
    geometries.push({ geo: postGeo, mat: 'trunk' });

    // Wires - always present
    const wireGeo = new THREE.CylinderGeometry(0.015, 0.015, spacingX * 0.9, 4);
    wireGeo.rotateZ(Math.PI / 2);
    wireGeo.translate(localX, 1.05 * sizeFactor, localZ);
    geometries.push({ geo: wireGeo, mat: 'trunk' });

    const wire2Geo = new THREE.CylinderGeometry(0.015, 0.015, spacingX * 0.9, 4);
    wire2Geo.rotateZ(Math.PI / 2);
    wire2Geo.translate(localX, 0.75 * sizeFactor, localZ);
    geometries.push({ geo: wire2Geo, mat: 'trunk' });

    // Grapes - green and smaller when young, purple when mature
    const clusterCount = mature
        ? 4 + Math.floor(seededRandom(plantSeed) * 3)  // 4-7 clusters when mature
        : 2 + Math.floor(seededRandom(plantSeed) * 1); // 2-3 small clusters when young
    const grapeSize = mature ? 0.04 : 0.02;
    const grapeMat = mature ? 'grape' : 'grapeGreen';

    for (let c = 0; c < clusterCount; c++) {
        const clusterX = localX + (seededRandom(plantSeed + c * 10) - 0.5) * 0.5 * sizeFactor;
        const clusterBaseY = (0.5 + seededRandom(plantSeed + c * 10 + 1) * 0.3) * sizeFactor;

        const grapeCount = mature
            ? 15 + Math.floor(seededRandom(plantSeed + c * 10 + 2) * 8)  // 15-23 grapes per cluster
            : 5 + Math.floor(seededRandom(plantSeed + c * 10 + 2) * 3);  // 5-8 small grapes

        for (let g = 0; g < grapeCount; g++) {
            const phi = seededRandom(plantSeed + c * 100 + g) * Math.PI;
            const theta = seededRandom(plantSeed + c * 100 + g + 50) * Math.PI * 2;
            const r = (0.06 + seededRandom(plantSeed + c * 100 + g + 100) * 0.04) * sizeFactor;

            const gx = Math.sin(phi) * Math.cos(theta) * r;
            const gy = -Math.cos(phi) * r * 1.5;
            const gz = Math.sin(phi) * Math.sin(theta) * r;

            const grapeGeo = new THREE.SphereGeometry(grapeSize, 4, 3);
            grapeGeo.translate(
                clusterX + gx,
                clusterBaseY + gy,
                localZ + gz
            );
            geometries.push({ geo: grapeGeo, mat: grapeMat });
        }
    }

    // Leaves - more when mature
    const leafCount = mature ? 5 + Math.floor(seededRandom(plantSeed + 5) * 3) : 2;
    for (let l = 0; l < leafCount; l++) {
        const leafX = localX + (seededRandom(plantSeed + l + 20) - 0.5) * 0.4 * sizeFactor;
        const leafY = (0.7 + seededRandom(plantSeed + l + 21) * 0.35) * sizeFactor;
        const leafAngle = seededRandom(plantSeed + l + 22) * Math.PI * 2;

        const leafGeo = new THREE.BoxGeometry(0.2 * sizeFactor, 0.02, 0.18 * sizeFactor);
        leafGeo.rotateY(leafAngle);
        leafGeo.rotateX(seededRandom(plantSeed + l + 23) * 0.3 - 0.15);
        leafGeo.translate(leafX, leafY, localZ);
        geometries.push({ geo: leafGeo, mat: 'leaves' });
    }

    return geometries;
}
