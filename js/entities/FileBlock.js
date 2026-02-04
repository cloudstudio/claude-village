/**
 * FileBlock - Floating file block creation
 */

import * as THREE from 'three';
import { materials } from '../materials/index.js';
import { getHeightAt } from '../utils/index.js';
import { state } from '../core/State.js';

/**
 * Create a file block near a house
 * @param {THREE.Scene} scene - The scene to add to
 * @param {THREE.Group} house - The house
 * @param {string} fileName - Name of the file
 * @returns {THREE.Mesh} The file mesh
 */
export function createFileBlock(scene, house, fileName) {
    const baseX = house.userData.x + house.userData.width + 1;
    const baseZ = house.userData.z;

    const files = state.files;
    let x = baseX, z = baseZ;
    for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (Math.abs(f.position.x - x) < 1 && Math.abs(f.position.z - z) < 1) {
            x += 1.0;
            if (x > baseX + 4) {
                x = baseX;
                z += 1.0;
            }
        }
    }

    const geo = new THREE.BoxGeometry(0.6, 0.7, 0.1);
    const mat = materials.fileBlock.clone();
    mat.emissive = new THREE.Color(0x4a9eff);
    mat.emissiveIntensity = 0.3;

    const file = new THREE.Mesh(geo, mat);
    file.position.set(x, getHeightAt(x, z) + 0.5, z);
    file.castShadow = true;

    file.userData = {
        fileName,
        house,
        floatPhase: Math.random() * Math.PI * 2,
        baseY: file.position.y
    };

    scene.add(file);
    state.addFile(file);
    return file;
}
