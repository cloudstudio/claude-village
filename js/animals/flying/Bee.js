/**
 * Bee - Flying bee creation
 */

import * as THREE from 'three';
import { materials } from '../../materials/index.js';
import { state } from '../../core/State.js';

/**
 * Create a bee at the specified position
 * @param {THREE.Scene} scene - The scene to add to
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} z - Z position
 * @returns {THREE.Group} The bee group
 */
export function createBee(scene, x, y, z) {
    const group = new THREE.Group();

    // Body segments
    const body1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        materials.beeYellow
    );
    body1.position.z = 0.05;
    group.add(body1);

    const body2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        materials.beeBlack
    );
    body2.position.z = 0;
    group.add(body2);

    const body3 = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        materials.beeYellow
    );
    body3.position.z = -0.06;
    group.add(body3);

    // Wings
    const wingGeo = new THREE.BoxGeometry(0.08, 0.01, 0.06);
    const wing1 = new THREE.Mesh(wingGeo, materials.beeWing);
    wing1.position.set(-0.06, 0.04, 0);
    group.add(wing1);
    const wing2 = new THREE.Mesh(wingGeo, materials.beeWing);
    wing2.position.set(0.06, 0.04, 0);
    group.add(wing2);

    group.position.set(x, y, z);

    group.userData = {
        type: 'bee',
        wings: [wing1, wing2],
        phase: Math.random() * Math.PI * 2,
        targetX: x,
        targetY: y,
        targetZ: z,
        speed: 0.03 + Math.random() * 0.02,
        homeX: x,
        homeZ: z,
        flightTimer: 0,
        targetFlower: null
    };

    scene.add(group);
    state.addInsect(group);
    return group;
}
