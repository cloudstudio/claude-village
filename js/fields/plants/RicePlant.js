/**
 * RicePlant - Rice stalk geometry for paddies
 */

import * as THREE from 'three';
import { seededRandom } from '../../utils/index.js';

/**
 * Create rice plant geometry
 * @param {Object} ctx - Plant context with position, seed, size factors
 * @returns {Array} Array of geometry objects with mat keys
 */
export function createRicePlant(ctx) {
    const { localX, localZ, plantSeed, sizeFactor, mature } = ctx;
    const geometries = [];

    // Rice stalks - more when mature, but always visible
    const baseStalkCount = mature ? 10 : 4;
    const stalkCount = baseStalkCount + Math.floor(seededRandom(plantSeed) * (mature ? 5 : 2));

    for (let i = 0; i < stalkCount; i++) {
        const offsetX = (seededRandom(plantSeed + i * 3) - 0.5) * 0.35;
        const offsetZ = (seededRandom(plantSeed + i * 3 + 1) - 0.5) * 0.35;
        const height = (0.4 + seededRandom(plantSeed + i * 3 + 2) * 0.5) * sizeFactor;

        // Main stalk
        const stalkGeo = new THREE.CylinderGeometry(0.015, 0.025, height, 4);
        const lean = (seededRandom(plantSeed + i + 20) - 0.5) * 0.15;
        stalkGeo.translate(localX + offsetX + lean * 0.5, height / 2, localZ + offsetZ);
        geometries.push({ geo: stalkGeo, mat: 'stalk' });

        // Grain heads - smaller and green when young
        const grainSize = mature ? 0.04 : 0.02;
        const grainHeight = mature ? 0.12 : 0.06;
        const grainMat = mature ? 'grain' : 'stalk';  // Green when young

        const grainGeo = new THREE.ConeGeometry(grainSize, grainHeight, 5);
        grainGeo.rotateX(Math.PI);
        grainGeo.rotateZ(lean * 2);
        grainGeo.translate(localX + offsetX + lean, height + 0.02, localZ + offsetZ);
        geometries.push({ geo: grainGeo, mat: grainMat });

        // Add awns (more when mature)
        const awnCount = mature ? 3 : 1;
        for (let a = 0; a < awnCount; a++) {
            const awnAngle = (a / 3) * Math.PI * 2;
            const awnLen = mature ? 0.08 : 0.04;
            const awnGeo = new THREE.CylinderGeometry(0.003, 0.003, awnLen, 3);
            awnGeo.rotateZ(0.3 + seededRandom(plantSeed + i + a + 30) * 0.2);
            awnGeo.rotateY(awnAngle);
            awnGeo.translate(
                localX + offsetX + lean + Math.cos(awnAngle) * 0.03,
                height + 0.04,
                localZ + offsetZ + Math.sin(awnAngle) * 0.03
            );
            geometries.push({ geo: awnGeo, mat: grainMat });
        }
    }

    return geometries;
}
