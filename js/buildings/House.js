/**
 * House - House creation and management
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { materials } from '../materials/index.js';
import { getHeightAt } from '../utils/height.js';
import { state } from '../core/State.js';
import { wallColors, roofColors, doorColors } from './HouseStyles.js';

/**
 * Get the maximum Y value from an array of geometries
 * @param {Array<THREE.BufferGeometry>} geometries - Array of geometries
 * @returns {number} Maximum Y value
 */
function getMaxY(geometries) {
    let maxY = -Infinity;
    geometries.forEach(geo => {
        geo.computeBoundingBox();
        maxY = Math.max(maxY, geo.boundingBox.max.y);
    });
    return maxY;
}

/**
 * Create a house at the specified position
 * @param {THREE.Scene} scene - The scene to add the house to
 * @param {number} x - X position
 * @param {number} z - Z position
 * @returns {THREE.Group} The house group
 */
export function createHouse(scene, x, z) {
    const y = getHeightAt(x, z);
    const geometries = [];
    const roofGeos = [];

    // Random dimensions
    const width = 3.5 + Math.random() * 2.5;
    const depth = 3.5 + Math.random() * 2;
    const height = 2.5 + Math.random() * 1.5;
    const hasSecondFloor = Math.random() > 0.7;
    const totalHeight = hasSecondFloor ? height * 1.8 : height;

    // Random materials
    const wallMat = materials[wallColors[Math.floor(Math.random() * wallColors.length)]];
    const roofMat = materials[roofColors[Math.floor(Math.random() * roofColors.length)]];
    const doorMat = materials[doorColors[Math.floor(Math.random() * doorColors.length)]];
    const trimMat = Math.random() > 0.5 ? materials.white : materials.woodBirch;

    // Floor/Foundation
    const floorGeo = new THREE.BoxGeometry(width + 0.4, 0.35, depth + 0.4);
    floorGeo.translate(0, 0.175, 0);
    geometries.push({ geo: floorGeo, mat: materials.stone });

    // Walls
    const frontGeo = new THREE.BoxGeometry(width, totalHeight, 0.25);
    frontGeo.translate(0, totalHeight / 2 + 0.35, depth / 2);
    geometries.push({ geo: frontGeo, mat: wallMat });

    const backGeo = new THREE.BoxGeometry(width, totalHeight, 0.25);
    backGeo.translate(0, totalHeight / 2 + 0.35, -depth / 2);
    geometries.push({ geo: backGeo, mat: wallMat });

    const leftGeo = new THREE.BoxGeometry(0.25, totalHeight, depth);
    leftGeo.translate(-width / 2, totalHeight / 2 + 0.35, 0);
    geometries.push({ geo: leftGeo, mat: wallMat });

    const rightGeo = new THREE.BoxGeometry(0.25, totalHeight, depth);
    rightGeo.translate(width / 2, totalHeight / 2 + 0.35, 0);
    geometries.push({ geo: rightGeo, mat: wallMat });

    // Roof - flat style
    const wallTopY = totalHeight + 0.35;
    const roofWidth = width + 0.8;
    const roofDepth = depth + 0.6;

    const addRoof = (geo) => {
        roofGeos.push(geo);
        geometries.push({ geo, mat: roofMat });
    };

    const flatRoof = new THREE.BoxGeometry(roofWidth, 0.25, roofDepth);
    flatRoof.translate(0, wallTopY + 0.125, 0);
    addRoof(flatRoof);

    // Roof border/trim
    const borderH = 0.2;
    const borderThick = 0.12;

    const b1 = new THREE.BoxGeometry(roofWidth, borderH, borderThick);
    b1.translate(0, wallTopY + 0.25 + borderH / 2, roofDepth / 2 - borderThick / 2);
    geometries.push({ geo: b1, mat: trimMat });

    const b2 = new THREE.BoxGeometry(roofWidth, borderH, borderThick);
    b2.translate(0, wallTopY + 0.25 + borderH / 2, -roofDepth / 2 + borderThick / 2);
    geometries.push({ geo: b2, mat: trimMat });

    const b3 = new THREE.BoxGeometry(borderThick, borderH, roofDepth);
    b3.translate(-roofWidth / 2 + borderThick / 2, wallTopY + 0.25 + borderH / 2, 0);
    geometries.push({ geo: b3, mat: trimMat });

    const b4 = new THREE.BoxGeometry(borderThick, borderH, roofDepth);
    b4.translate(roofWidth / 2 - borderThick / 2, wallTopY + 0.25 + borderH / 2, 0);
    geometries.push({ geo: b4, mat: trimMat });

    const roofTopY = roofGeos.length > 0 ? getMaxY(roofGeos) : wallTopY + 0.25;

    // Chimney (50% chance)
    let hasChimney = false;
    let chimneyPos = null;

    if (Math.random() > 0.5) {
        hasChimney = true;
        const chimneyX = (Math.random() - 0.5) * width * 0.4;
        const chimneyZ = (Math.random() - 0.5) * depth * 0.4;
        const chimneyHeight = 1.0 + Math.random() * 0.4;

        chimneyPos = {
            localX: chimneyX,
            localZ: chimneyZ,
            topY: roofTopY + chimneyHeight
        };

        const chimneyGeo = new THREE.BoxGeometry(0.45, chimneyHeight, 0.45);
        chimneyGeo.translate(chimneyX, roofTopY + chimneyHeight / 2, chimneyZ);
        geometries.push({ geo: chimneyGeo, mat: materials.stoneDark });

        const capGeo = new THREE.BoxGeometry(0.55, 0.1, 0.55);
        capGeo.translate(chimneyX, roofTopY + chimneyHeight + 0.05, chimneyZ);
        geometries.push({ geo: capGeo, mat: materials.stone });
    }

    // Door
    const doorHeight = 1.6 + Math.random() * 0.4;
    const doorWidth = 0.7 + Math.random() * 0.3;
    const doorGeo = new THREE.BoxGeometry(doorWidth, doorHeight, 0.12);
    doorGeo.translate(0, doorHeight / 2 + 0.35, depth / 2 + 0.15);
    geometries.push({ geo: doorGeo, mat: doorMat });

    const frameGeo = new THREE.BoxGeometry(doorWidth + 0.2, doorHeight + 0.15, 0.08);
    frameGeo.translate(0, doorHeight / 2 + 0.4, depth / 2 + 0.18);
    geometries.push({ geo: frameGeo, mat: trimMat });

    // Windows
    const windowsPerSide = hasSecondFloor ? 2 : 1;
    const winWidth = 0.6 + Math.random() * 0.3;
    const winHeight = 0.7 + Math.random() * 0.3;

    for (let floor = 0; floor < windowsPerSide; floor++) {
        const winY = floor === 0 ? height * 0.5 + 0.35 : height * 1.3 + 0.35;

        if (Math.random() > 0.2) {
            const winL = new THREE.BoxGeometry(winWidth, winHeight, 0.12);
            winL.translate(-width * 0.3, winY, depth / 2 + 0.15);
            geometries.push({ geo: winL, mat: materials.glass });
            const frameL = new THREE.BoxGeometry(winWidth + 0.15, winHeight + 0.15, 0.08);
            frameL.translate(-width * 0.3, winY, depth / 2 + 0.18);
            geometries.push({ geo: frameL, mat: trimMat });
        }

        if (Math.random() > 0.2) {
            const winR = new THREE.BoxGeometry(winWidth, winHeight, 0.12);
            winR.translate(width * 0.3, winY, depth / 2 + 0.15);
            geometries.push({ geo: winR, mat: materials.glass });
            const frameR = new THREE.BoxGeometry(winWidth + 0.15, winHeight + 0.15, 0.08);
            frameR.translate(width * 0.3, winY, depth / 2 + 0.18);
            geometries.push({ geo: frameR, mat: trimMat });
        }
    }

    // Side windows
    const sideWinY = height * 0.5 + 0.35;
    if (Math.random() > 0.3) {
        const sideWin1 = new THREE.BoxGeometry(0.12, winHeight, winWidth);
        sideWin1.translate(-width / 2 - 0.1, sideWinY, 0);
        geometries.push({ geo: sideWin1, mat: materials.glass });
    }
    if (Math.random() > 0.3) {
        const sideWin2 = new THREE.BoxGeometry(0.12, winHeight, winWidth);
        sideWin2.translate(width / 2 + 0.1, sideWinY, 0);
        geometries.push({ geo: sideWin2, mat: materials.glass });
    }

    // Back window
    if (Math.random() > 0.4) {
        const backWin = new THREE.BoxGeometry(winWidth, winHeight, 0.12);
        backWin.translate(0, sideWinY, -depth / 2 - 0.1);
        geometries.push({ geo: backWin, mat: materials.glass });
    }

    // Porch (30% chance)
    if (Math.random() > 0.7) {
        const porchDepth = 1 + Math.random() * 0.5;
        const porchGeo = new THREE.BoxGeometry(width * 0.8, 0.15, porchDepth);
        porchGeo.translate(0, 0.25, depth / 2 + porchDepth / 2);
        geometries.push({ geo: porchGeo, mat: materials.wood });

        const postGeo = new THREE.BoxGeometry(0.15, 2, 0.15);
        const post1 = postGeo.clone();
        post1.translate(-width * 0.35, 1.1, depth / 2 + porchDepth - 0.2);
        geometries.push({ geo: post1, mat: materials.wood });
        const post2 = postGeo.clone();
        post2.translate(width * 0.35, 1.1, depth / 2 + porchDepth - 0.2);
        geometries.push({ geo: post2, mat: materials.wood });

        const porchRoof = new THREE.BoxGeometry(width * 0.9, 0.1, porchDepth + 0.3);
        porchRoof.translate(0, 2.2, depth / 2 + porchDepth / 2);
        geometries.push({ geo: porchRoof, mat: roofMat });
    }

    // Flower boxes (40% chance)
    if (Math.random() > 0.6) {
        const boxGeo = new THREE.BoxGeometry(winWidth + 0.1, 0.15, 0.2);
        const boxY = height * 0.5 - winHeight / 2 + 0.2;
        if (Math.random() > 0.5) {
            const box1 = boxGeo.clone();
            box1.translate(-width * 0.3, boxY, depth / 2 + 0.25);
            geometries.push({ geo: box1, mat: materials.wood });
        }
        if (Math.random() > 0.5) {
            const box2 = boxGeo.clone();
            box2.translate(width * 0.3, boxY, depth / 2 + 0.25);
            geometries.push({ geo: box2, mat: materials.wood });
        }
    }

    // Group by material and merge
    const byMaterial = new Map();
    geometries.forEach(({ geo, mat }) => {
        if (!byMaterial.has(mat)) byMaterial.set(mat, []);
        const finalGeo = geo.index ? geo.toNonIndexed() : geo;
        byMaterial.get(mat).push(finalGeo);
    });

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

    group.rotation.y = 0;
    group.position.set(x, y, z);

    group.userData = {
        x, z, width, depth, height: totalHeight, agents: [],
        doorPosition: { x: x, y: y, z: z + depth / 2 + 1 },
        bounds: {
            width: width + 0.8,
            depth: depth + 0.8,
            radius: Math.max(width, depth) / 2 + 1.5
        },
        hasChimney: hasChimney,
        chimneyPos: chimneyPos
    };

    scene.add(group);
    state.addHouse(group);
    return group;
}
