/**
 * Headquarters - Barn/Farmhouse HQ building
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { materials } from '../materials/index.js';
import { getHeightAt } from '../utils/height.js';
import { state } from '../core/State.js';

/**
 * Create the headquarters building (barn)
 * @param {THREE.Scene} scene - The scene to add to
 * @returns {THREE.Group} The HQ group
 */
export function createHeadquarters(scene) {
    const x = -35;
    const z = 0;
    const y = getHeightAt(x, z);
    const geometries = [];
    const width = 12;
    const depth = 8;
    const wallHeight = 5;

    const wallMat = materials.roofRed;
    const roofMat = materials.roofBrown;
    const trimMat = materials.white;

    // Foundation
    const foundGeo = new THREE.BoxGeometry(width + 1, 0.6, depth + 1);
    foundGeo.translate(0, 0.3, 0);
    geometries.push({ geo: foundGeo, mat: materials.stone });

    // Walls
    const frontGeo = new THREE.BoxGeometry(width, wallHeight, 0.5);
    frontGeo.translate(0, wallHeight / 2 + 0.6, depth / 2);
    geometries.push({ geo: frontGeo, mat: wallMat });

    const backGeo = new THREE.BoxGeometry(width, wallHeight, 0.5);
    backGeo.translate(0, wallHeight / 2 + 0.6, -depth / 2);
    geometries.push({ geo: backGeo, mat: wallMat });

    const leftGeo = new THREE.BoxGeometry(0.5, wallHeight, depth);
    leftGeo.translate(-width / 2, wallHeight / 2 + 0.6, 0);
    geometries.push({ geo: leftGeo, mat: wallMat });

    const rightGeo = new THREE.BoxGeometry(0.5, wallHeight, depth);
    rightGeo.translate(width / 2, wallHeight / 2 + 0.6, 0);
    geometries.push({ geo: rightGeo, mat: wallMat });

    // Roof
    const roofOverhang = 2;
    const roofThickness = 0.5;

    const roofGeo = new THREE.BoxGeometry(width + roofOverhang, roofThickness, depth + roofOverhang);
    roofGeo.translate(0, wallHeight + 0.6 + roofThickness / 2, 0);
    geometries.push({ geo: roofGeo, mat: roofMat });

    // Barn door
    const barnDoorH = 3.5;
    const barnDoorW = 3;
    const doorGeo = new THREE.BoxGeometry(0.3, barnDoorH, barnDoorW);
    doorGeo.translate(width / 2 + 0.2, barnDoorH / 2 + 0.6, 0);
    geometries.push({ geo: doorGeo, mat: materials.wood });

    const doorFrameGeo = new THREE.BoxGeometry(0.2, barnDoorH + 0.4, barnDoorW + 0.5);
    doorFrameGeo.translate(width / 2 + 0.35, barnDoorH / 2 + 0.8, 0);
    geometries.push({ geo: doorFrameGeo, mat: trimMat });

    // Cross beam on door
    const crossH = new THREE.BoxGeometry(0.1, 0.2, barnDoorW - 0.2);
    crossH.translate(width / 2 + 0.35, barnDoorH / 2 + 0.6, 0);
    geometries.push({ geo: crossH, mat: materials.woodLight });

    // Hay loft door
    const loftDoorGeo = new THREE.BoxGeometry(2, 1.8, 0.2);
    loftDoorGeo.translate(0, wallHeight + 1.5, depth / 2 + 0.3);
    geometries.push({ geo: loftDoorGeo, mat: materials.wood });

    // Windows
    for (let i = -1; i <= 1; i += 2) {
        const winGeo = new THREE.BoxGeometry(0.2, 1.2, 1.2);
        winGeo.translate(-width / 2 - 0.15, wallHeight / 2 + 1, i * 2.5);
        geometries.push({ geo: winGeo, mat: materials.glass });
    }

    // Trim
    const trim1 = new THREE.BoxGeometry(width + 0.4, 0.2, 0.6);
    trim1.translate(0, wallHeight + 0.6, depth / 2 + 0.1);
    geometries.push({ geo: trim1, mat: trimMat });

    const trim2 = new THREE.BoxGeometry(width + 0.4, 0.2, 0.6);
    trim2.translate(0, wallHeight + 0.6, -depth / 2 - 0.1);
    geometries.push({ geo: trim2, mat: trimMat });

    // Silo
    const siloRadius = 2;
    const siloHeight = 9;
    const siloGeo = new THREE.CylinderGeometry(siloRadius, siloRadius, siloHeight, 16);
    siloGeo.translate(-width / 2 - siloRadius - 2, siloHeight / 2 + 0.3, -depth / 4);
    geometries.push({ geo: siloGeo, mat: materials.stoneDark });

    const siloRoofGeo = new THREE.ConeGeometry(siloRadius + 0.4, 2.5, 16);
    siloRoofGeo.translate(-width / 2 - siloRadius - 2, siloHeight + 1.5, -depth / 4);
    geometries.push({ geo: siloRoofGeo, mat: roofMat });

    // Silo rings
    for (let i = 0; i < 3; i++) {
        const ringGeo = new THREE.TorusGeometry(siloRadius + 0.05, 0.1, 8, 16);
        ringGeo.rotateX(Math.PI / 2);
        ringGeo.translate(-width / 2 - siloRadius - 2, 2 + i * 3, -depth / 4);
        geometries.push({ geo: ringGeo, mat: materials.stone });
    }

    // Merge by material
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

    group.position.set(x, y, z);
    group.userData = {
        x, z, width, depth, height: wallHeight + 0.5, agents: [],
        doorPosition: { x: x + width / 2 + 2, y: y, z: z },
        isHQ: true,
        bounds: {
            width: width + 6,
            depth: depth + 4,
            radius: Math.max(width, depth) / 2 + 5
        }
    };

    scene.add(group);
    state.addHouse(group);
    state.headquarters = group;
    return group;
}
