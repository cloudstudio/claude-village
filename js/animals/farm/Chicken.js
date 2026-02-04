/**
 * Chicken - Farm chicken creation
 */

import * as THREE from 'three';
import { materials } from '../../materials/index.js';
import { getHeightAt } from '../../utils/index.js';
import { state } from '../../core/State.js';

/**
 * Create a chicken at the specified position
 * @param {THREE.Scene} scene - The scene to add to
 * @param {number} x - X position
 * @param {number} z - Z position
 * @returns {THREE.Group} The chicken group
 */
export function createChicken(scene, x, z) {
    const group = new THREE.Group();
    const y = getHeightAt(x, z);

    // Body - plump capsule shape
    const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.2, 0.25, 8, 12),
        materials.chickenWhite
    );
    body.rotation.x = Math.PI / 2;
    body.position.y = 0.35;
    body.castShadow = true;
    group.add(body);

    // Breast feathers (white puff)
    const breast = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 8),
        materials.chickenWhite
    );
    breast.position.set(0, 0.3, 0.15);
    group.add(breast);

    // Head - round
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 10),
        materials.chickenWhite
    );
    head.position.set(0, 0.55, 0.22);
    group.add(head);

    // Eyes (black with shine)
    const eyeGeo = new THREE.SphereGeometry(0.025, 6, 6);
    const eyeL = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeL.position.set(-0.06, 0.57, 0.3);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeR.position.set(0.06, 0.57, 0.3);
    group.add(eyeR);

    // Eye shine
    const shineGeo = new THREE.SphereGeometry(0.008, 4, 4);
    const shineL = new THREE.Mesh(shineGeo, materials.white);
    shineL.position.set(-0.055, 0.575, 0.32);
    group.add(shineL);
    const shineR = new THREE.Mesh(shineGeo, materials.white);
    shineR.position.set(0.065, 0.575, 0.32);
    group.add(shineR);

    // Beak - two parts
    const beakTop = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.1, 6),
        materials.chickenYellow
    );
    beakTop.rotation.x = -Math.PI / 2;
    beakTop.position.set(0, 0.55, 0.35);
    group.add(beakTop);

    const beakBottom = new THREE.Mesh(
        new THREE.ConeGeometry(0.025, 0.06, 6),
        materials.chickenYellow
    );
    beakBottom.rotation.x = -Math.PI / 2;
    beakBottom.position.set(0, 0.52, 0.33);
    group.add(beakBottom);

    // Wattle (red thing under beak)
    const wattle = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 6, 6),
        materials.chickenRed
    );
    wattle.scale.set(0.8, 1.2, 0.6);
    wattle.position.set(0, 0.48, 0.3);
    group.add(wattle);

    // Comb (red thing on top)
    const comb = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.1, 0.12),
        materials.chickenRed
    );
    comb.position.set(0, 0.68, 0.2);
    group.add(comb);

    // Wings (folded)
    const wingGeo = new THREE.CapsuleGeometry(0.08, 0.15, 4, 8);
    const wingL = new THREE.Mesh(wingGeo, materials.chickenWhite);
    wingL.rotation.z = Math.PI / 2;
    wingL.position.set(-0.18, 0.35, 0);
    group.add(wingL);
    const wingR = new THREE.Mesh(wingGeo, materials.chickenWhite);
    wingR.rotation.z = Math.PI / 2;
    wingR.position.set(0.18, 0.35, 0);
    group.add(wingR);

    // Tail feathers
    for (let i = 0; i < 3; i++) {
        const feather = new THREE.Mesh(
            new THREE.ConeGeometry(0.04, 0.18, 4),
            materials.chickenWhite
        );
        feather.position.set((i - 1) * 0.06, 0.4, -0.28);
        feather.rotation.x = -Math.PI / 3 - Math.random() * 0.2;
        feather.rotation.z = (i - 1) * 0.15;
        group.add(feather);
    }

    // Legs with feet
    const legs = [];
    [-0.08, 0.08].forEach(xPos => {
        const legGroup = new THREE.Group();

        const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.018, 0.18, 6),
            materials.chickenYellow
        );
        leg.position.y = 0.09;
        legGroup.add(leg);

        // Foot
        const foot = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.015, 0.08),
            materials.chickenYellow
        );
        foot.position.set(0, 0.01, 0.02);
        legGroup.add(foot);

        legGroup.position.set(xPos, 0.1, 0);
        legs.push(legGroup);
        group.add(legGroup);
    });

    group.position.set(x, y, z);
    group.scale.setScalar(1.5);

    group.userData = {
        type: 'chicken',
        state: 'idle',
        stateTimer: 0,
        targetX: x,
        targetZ: z,
        speed: 0.02 + Math.random() * 0.01,
        legs: legs,
        head: head,
        walkCycle: 0,
        homeX: x,
        homeZ: z,
        confined: true
    };

    scene.add(group);
    state.addAnimal(group);
    return group;
}
