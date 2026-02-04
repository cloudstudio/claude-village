/**
 * WheatPlant - Wheat stalk geometry for wheat fields
 */

import * as THREE from 'three';
import { seededRandom } from '../../utils/index.js';

/**
 * Create wheat plant geometry
 * @param {Object} ctx - Plant context with position, seed, size factors
 * @returns {Array} Array of geometry objects with mat keys
 */
export function createWheatPlant(ctx) {
    const { localX, localZ, plantSeed, sizeFactor, mature } = ctx;
    const geometries = [];

    // Wheat stalks - more abundant when mature
    const baseStalkCount = mature ? 12 : 5;
    const stalkCount = baseStalkCount + Math.floor(seededRandom(plantSeed) * (mature ? 6 : 2));

    for (let i = 0; i < stalkCount; i++) {
        const offsetX = (seededRandom(plantSeed + i * 4) - 0.5) * 0.28;
        const offsetZ = (seededRandom(plantSeed + i * 4 + 1) - 0.5) * 0.28;
        const height = (0.65 + seededRandom(plantSeed + i * 4 + 2) * 0.35) * sizeFactor;

        const leanAngle = (0.08 + seededRandom(plantSeed + i + 20) * 0.18);
        const leanDir = seededRandom(plantSeed + i + 21) * Math.PI * 2;

        const stalkGeo = new THREE.CylinderGeometry(0.012, 0.018, height, 4);
        stalkGeo.translate(0, height / 2, 0);
        stalkGeo.rotateX(leanAngle * Math.cos(leanDir));
        stalkGeo.rotateZ(leanAngle * Math.sin(leanDir));
        stalkGeo.translate(localX + offsetX, 0, localZ + offsetZ);
        geometries.push({ geo: stalkGeo, mat: 'stalk' });

        // Wheat heads - smaller and green when young
        const headSize = mature ? 0.035 : 0.018;
        const headHeight = mature ? 0.16 : 0.08;
        const headMat = mature ? 'grain' : 'stalk';  // Green when young

        const headGeo = new THREE.ConeGeometry(headSize, headHeight, 5);
        const headX = localX + offsetX + Math.sin(leanDir) * leanAngle * height;
        const headZ = localZ + offsetZ + Math.cos(leanDir) * leanAngle * height;
        const headY = height * Math.cos(leanAngle);
        headGeo.translate(headX, headY + 0.04 * sizeFactor, headZ);
        geometries.push({ geo: headGeo, mat: headMat });

        // Add awns (more and longer when mature)
        const awnCount = mature ? 4 : 2;
        for (let a = 0; a < awnCount; a++) {
            const awnAngle = (a / 4) * Math.PI * 2 + seededRandom(plantSeed + i + a) * 0.3;
            const awnLen = mature ? 0.1 : 0.04;
            const awnGeo = new THREE.CylinderGeometry(0.002, 0.002, awnLen, 3);
            awnGeo.rotateZ(0.4);
            awnGeo.rotateY(awnAngle);
            awnGeo.translate(
                headX + Math.cos(awnAngle) * 0.025 * sizeFactor,
                headY + 0.08 * sizeFactor,
                headZ + Math.sin(awnAngle) * 0.025 * sizeFactor
            );
            geometries.push({ geo: awnGeo, mat: headMat });
        }
    }

    return geometries;
}
