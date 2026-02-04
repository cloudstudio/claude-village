/**
 * Fence - Farm fence creation
 */

import * as THREE from 'three';
import { materials } from '../materials/index.js';

/**
 * Create a fence segment between two points
 * @param {THREE.Scene} scene - The scene to add to
 * @param {number} x1 - Start X position
 * @param {number} z1 - Start Z position
 * @param {number} x2 - End X position
 * @param {number} z2 - End Z position
 * @returns {THREE.Group} The fence group
 */
export function createFence(scene, x1, z1, x2, z2) {
    const group = new THREE.Group();
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dz, dx);
    const postCount = Math.ceil(length / 2);

    // Create fence posts
    for (let i = 0; i <= postCount; i++) {
        const t = i / postCount;
        const px = x1 + dx * t;
        const pz = z1 + dz * t;

        const post = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.8, 0.15),
            materials.fence
        );
        post.position.set(px, 0.4, pz);
        post.castShadow = true;
        group.add(post);
    }

    // Rails
    const railGeo = new THREE.BoxGeometry(length, 0.08, 0.08);

    const rail1 = new THREE.Mesh(railGeo, materials.fence);
    rail1.position.set((x1 + x2) / 2, 0.25, (z1 + z2) / 2);
    rail1.rotation.y = angle;
    rail1.castShadow = true;
    group.add(rail1);

    const rail2 = new THREE.Mesh(railGeo, materials.fence);
    rail2.position.set((x1 + x2) / 2, 0.55, (z1 + z2) / 2);
    rail2.rotation.y = angle;
    rail2.castShadow = true;
    group.add(rail2);

    scene.add(group);
    return group;
}
