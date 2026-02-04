/**
 * VegetablePlant - Various vegetable geometries
 */

import * as THREE from 'three';
import { seededRandom } from '../../utils/index.js';

/**
 * Create vegetable plant geometry (cabbage, carrot, tomato, or lettuce)
 * @param {Object} ctx - Plant context with position, seed, size factors
 * @returns {Array} Array of geometry objects with mat keys
 */
export function createVegetablePlant(ctx) {
    const { localX, localZ, plantSeed, sizeFactor, mature } = ctx;
    const geometries = [];

    const vegType = Math.floor(seededRandom(plantSeed * 7.3) * 4);

    if (vegType === 0) {
        // Cabbage
        createCabbage(geometries, localX, localZ, plantSeed, sizeFactor, mature);
    } else if (vegType === 1) {
        // Carrot
        createCarrot(geometries, localX, localZ, plantSeed, sizeFactor, mature);
    } else if (vegType === 2) {
        // Tomato plant
        createTomato(geometries, localX, localZ, plantSeed, sizeFactor, mature);
    } else {
        // Lettuce
        createLettuce(geometries, localX, localZ, plantSeed, sizeFactor, mature);
    }

    return geometries;
}

function createCabbage(geometries, localX, localZ, plantSeed, sizeFactor, mature) {
    const baseSize = (0.22 + seededRandom(plantSeed) * 0.08) * sizeFactor;
    const cabbageGeo = new THREE.SphereGeometry(baseSize, 8, 6);
    const scaleX = 0.9 + seededRandom(plantSeed + 1) * 0.25;
    const scaleZ = 0.9 + seededRandom(plantSeed + 2) * 0.25;
    cabbageGeo.scale(scaleX, 0.85, scaleZ);
    cabbageGeo.translate(localX, baseSize * 0.85, localZ);
    geometries.push({ geo: cabbageGeo, mat: 'vegGreen' });

    // Outer leaves - fewer and smaller when young
    const leafCount = mature ? 4 : 2;
    const leafScale = mature ? 1.0 : 0.6;
    for (let l = 0; l < leafCount; l++) {
        const leafAngle = (l / leafCount) * Math.PI * 2 + seededRandom(plantSeed + l + 10) * 0.5;
        const leafGeo = new THREE.SphereGeometry(0.12 * leafScale, 4, 3);
        leafGeo.scale(1.5, 0.3, 1);
        leafGeo.rotateY(leafAngle);
        leafGeo.translate(
            localX + Math.cos(leafAngle) * baseSize * 0.8,
            0.08 * sizeFactor,
            localZ + Math.sin(leafAngle) * baseSize * 0.8
        );
        geometries.push({ geo: leafGeo, mat: 'leaves' });
    }
}

function createCarrot(geometries, localX, localZ, plantSeed, sizeFactor, mature) {
    const carrotSize = mature ? 1.0 : 0.4;
    const carrotGeo = new THREE.ConeGeometry(0.07 * carrotSize, 0.28 * carrotSize, 6);
    carrotGeo.rotateX(Math.PI);
    carrotGeo.translate(localX, 0.14 * carrotSize, localZ);
    // When young, show as light green (buried), when mature show orange
    geometries.push({ geo: carrotGeo, mat: mature ? 'vegOrange' : 'fruitGreen' });

    const frondCount = mature ? 5 : 3;
    const frondSize = mature ? 1.0 : 0.5;
    for (let f = 0; f < frondCount; f++) {
        const angle = (f / frondCount) * Math.PI * 2 + seededRandom(plantSeed + f) * 0.4;
        const frondGeo = new THREE.ConeGeometry(0.06 * frondSize, 0.18 * frondSize, 4);
        frondGeo.translate(0, 0.09 * frondSize, 0);
        frondGeo.rotateZ(0.3);
        frondGeo.rotateY(angle);
        frondGeo.translate(localX, mature ? 0.28 : 0.05, localZ);
        geometries.push({ geo: frondGeo, mat: 'leaves' });
    }
}

function createTomato(geometries, localX, localZ, plantSeed, sizeFactor, mature) {
    const stemHeight = (0.45 + seededRandom(plantSeed) * 0.15) * sizeFactor;
    const stemGeo = new THREE.CylinderGeometry(0.025 * sizeFactor, 0.035 * sizeFactor, stemHeight, 4);
    stemGeo.translate(localX, stemHeight / 2, localZ);
    geometries.push({ geo: stemGeo, mat: 'stalk' });

    // Leaves on stem - more when mature
    const leafCount = mature ? 3 : 2;
    for (let l = 0; l < leafCount; l++) {
        const leafGeo = new THREE.BoxGeometry(0.15 * sizeFactor, 0.02, 0.1 * sizeFactor);
        leafGeo.translate(
            localX + (l % 2 === 0 ? 0.1 : -0.1) * sizeFactor,
            (0.15 + l * 0.12) * sizeFactor,
            localZ
        );
        geometries.push({ geo: leafGeo, mat: 'leaves' });
    }

    // Tomatoes - green and small when young, red when mature
    const tomatoCount = mature
        ? 5 + Math.floor(seededRandom(plantSeed + 1) * 4)  // 5-9 tomatoes
        : 2 + Math.floor(seededRandom(plantSeed + 1) * 2); // 2-4 small green ones
    const tomatoSize = mature ? 0.08 : 0.04;
    const tomatoMat = mature ? 'vegRed' : 'fruitGreen';

    for (let t = 0; t < tomatoCount; t++) {
        const angle = seededRandom(plantSeed + t + 10) * Math.PI * 2;
        const radius = (0.08 + seededRandom(plantSeed + t + 20) * 0.12) * sizeFactor;
        const heightPos = (0.15 + seededRandom(plantSeed + t + 30) * (stemHeight - 0.2));
        const size = tomatoSize + seededRandom(plantSeed + t + 40) * 0.02;

        const tomatoGeo = new THREE.SphereGeometry(size, 6, 4);
        tomatoGeo.translate(
            localX + Math.cos(angle) * radius,
            heightPos,
            localZ + Math.sin(angle) * radius
        );
        geometries.push({ geo: tomatoGeo, mat: tomatoMat });
    }
}

function createLettuce(geometries, localX, localZ, plantSeed, sizeFactor, mature) {
    const baseGeo = new THREE.SphereGeometry(0.18 * sizeFactor, 8, 4);
    baseGeo.scale(1, 0.5, 1);
    baseGeo.translate(localX, 0.09 * sizeFactor, localZ);
    geometries.push({ geo: baseGeo, mat: 'vegGreen' });

    // Outer leaves - more when mature
    const leafCount = mature ? 6 : 3;
    const leafScale = mature ? 1.0 : 0.5;
    for (let l = 0; l < leafCount; l++) {
        const angle = (l / leafCount) * Math.PI * 2;
        const leafGeo = new THREE.SphereGeometry(0.08 * leafScale, 4, 3);
        leafGeo.scale(1.8, 0.25, 1);
        leafGeo.rotateY(angle + seededRandom(plantSeed + l) * 0.3);
        leafGeo.translate(
            localX + Math.cos(angle) * 0.15 * sizeFactor,
            0.05 * sizeFactor,
            localZ + Math.sin(angle) * 0.15 * sizeFactor
        );
        geometries.push({ geo: leafGeo, mat: 'leaves' });
    }
}
