/**
 * Deer - Wild deer creation
 */

import * as THREE from 'three';
import { materials } from '../../materials/index.js';
import { getHeightAt } from '../../utils/index.js';
import { state } from '../../core/State.js';

/**
 * Create a deer at the specified position
 * @param {THREE.Scene} scene - The scene to add to
 * @param {number} x - X position
 * @param {number} z - Z position
 * @returns {THREE.Group} The deer group
 */
export function createDeer(scene, x, z) {
    const group = new THREE.Group();
    const y = getHeightAt(x, z);

    // Body - elegant
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.75, 8, 12), materials.deerBrown);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.72;
    body.castShadow = true;
    group.add(body);

    // Belly (lighter)
    const belly = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.5, 6, 10), materials.deerSpots);
    belly.rotation.z = Math.PI / 2;
    belly.position.y = 0.65;
    group.add(belly);

    // Spots on body (fawn spots)
    for (let i = 0; i < 8; i++) {
        const spot = new THREE.Mesh(new THREE.SphereGeometry(0.04 + Math.random() * 0.03, 6, 6), materials.deerSpots);
        spot.position.set((Math.random() - 0.5) * 0.25, 0.72 + (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.5);
        group.add(spot);
    }

    // Neck - long and elegant
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.45, 10), materials.deerBrown);
    neck.position.set(0, 1.0, 0.42);
    neck.rotation.x = -0.35;
    group.add(neck);

    // Head - graceful
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), materials.deerBrown);
    head.scale.set(0.9, 1, 1.3);
    head.position.set(0, 1.2, 0.58);
    group.add(head);

    // Snout
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 8), materials.deerBrown);
    snout.rotation.x = -Math.PI / 2;
    snout.position.set(0, 1.15, 0.72);
    group.add(snout);

    // Nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), materials.beeBlack);
    nose.position.set(0, 1.15, 0.82);
    group.add(nose);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const eyeL = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeL.position.set(-0.08, 1.22, 0.65);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeR.position.set(0.08, 1.22, 0.65);
    group.add(eyeR);

    // Eye shine
    const shineGeo = new THREE.SphereGeometry(0.012, 4, 4);
    const shineL = new THREE.Mesh(shineGeo, materials.white);
    shineL.position.set(-0.075, 1.225, 0.68);
    group.add(shineL);
    const shineR = new THREE.Mesh(shineGeo, materials.white);
    shineR.position.set(0.085, 1.225, 0.68);
    group.add(shineR);

    // Ears
    const earGeo = new THREE.ConeGeometry(0.055, 0.14, 6);
    const ear1 = new THREE.Mesh(earGeo, materials.deerBrown);
    ear1.position.set(-0.1, 1.35, 0.52);
    ear1.rotation.z = -0.4;
    ear1.rotation.x = -0.2;
    group.add(ear1);
    const ear2 = new THREE.Mesh(earGeo, materials.deerBrown);
    ear2.position.set(0.1, 1.35, 0.52);
    ear2.rotation.z = 0.4;
    ear2.rotation.x = -0.2;
    group.add(ear2);

    // Inner ears
    const innerEarGeo = new THREE.ConeGeometry(0.03, 0.08, 4);
    const innerEar1 = new THREE.Mesh(innerEarGeo, materials.rabbitPink);
    innerEar1.position.set(-0.1, 1.33, 0.54);
    innerEar1.rotation.z = -0.4;
    innerEar1.rotation.x = -0.2;
    group.add(innerEar1);
    const innerEar2 = new THREE.Mesh(innerEarGeo, materials.rabbitPink);
    innerEar2.position.set(0.1, 1.33, 0.54);
    innerEar2.rotation.z = 0.4;
    innerEar2.rotation.x = -0.2;
    group.add(innerEar2);

    // Antlers (if male - 50% chance)
    if (Math.random() > 0.5) {
        const antlerMat = materials.deerLight;
        const createBranch = (length, radius) => new THREE.CylinderGeometry(radius * 0.7, radius, length, 6);

        // Left antler system
        const antlerGroupL = new THREE.Group();
        const mainL = new THREE.Mesh(createBranch(0.3, 0.025), antlerMat);
        mainL.position.y = 0.15;
        mainL.rotation.z = -0.3;
        antlerGroupL.add(mainL);
        const branchL1 = new THREE.Mesh(createBranch(0.15, 0.02), antlerMat);
        branchL1.position.set(-0.08, 0.22, 0);
        branchL1.rotation.z = -0.8;
        antlerGroupL.add(branchL1);
        const branchL2 = new THREE.Mesh(createBranch(0.12, 0.015), antlerMat);
        branchL2.position.set(-0.12, 0.32, 0);
        branchL2.rotation.z = -1.2;
        antlerGroupL.add(branchL2);
        const tipL = new THREE.Mesh(createBranch(0.1, 0.012), antlerMat);
        tipL.position.set(-0.05, 0.35, 0);
        tipL.rotation.z = 0.2;
        antlerGroupL.add(tipL);
        antlerGroupL.position.set(-0.06, 1.35, 0.5);
        group.add(antlerGroupL);

        // Right antler system (mirrored)
        const antlerGroupR = new THREE.Group();
        const mainR = new THREE.Mesh(createBranch(0.3, 0.025), antlerMat);
        mainR.position.y = 0.15;
        mainR.rotation.z = 0.3;
        antlerGroupR.add(mainR);
        const branchR1 = new THREE.Mesh(createBranch(0.15, 0.02), antlerMat);
        branchR1.position.set(0.08, 0.22, 0);
        branchR1.rotation.z = 0.8;
        antlerGroupR.add(branchR1);
        const branchR2 = new THREE.Mesh(createBranch(0.12, 0.015), antlerMat);
        branchR2.position.set(0.12, 0.32, 0);
        branchR2.rotation.z = 1.2;
        antlerGroupR.add(branchR2);
        const tipR = new THREE.Mesh(createBranch(0.1, 0.012), antlerMat);
        tipR.position.set(0.05, 0.35, 0);
        tipR.rotation.z = -0.2;
        antlerGroupR.add(tipR);
        antlerGroupR.position.set(0.06, 1.35, 0.5);
        group.add(antlerGroupR);
    }

    // Tail (white underside)
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), materials.deerSpots);
    tail.scale.set(0.8, 1, 1.2);
    tail.position.set(0, 0.68, -0.52);
    group.add(tail);

    // Legs
    const legs = [];
    const legPositions = [
        { pos: [-0.12, 0, 0.22], front: true },
        { pos: [0.12, 0, 0.22], front: true },
        { pos: [-0.12, 0, -0.22], front: false },
        { pos: [0.12, 0, -0.22], front: false }
    ];

    legPositions.forEach(({ pos }) => {
        const legGroup = new THREE.Group();
        const upperLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.25, 8), materials.deerBrown);
        upperLeg.position.y = 0.35;
        legGroup.add(upperLeg);
        const lowerLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.25, 8), materials.deerBrown);
        lowerLeg.position.y = 0.12;
        legGroup.add(lowerLeg);
        const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.05, 8), materials.beeBlack);
        hoof.position.y = 0.025;
        legGroup.add(hoof);
        legGroup.position.set(...pos);
        legs.push(legGroup);
        group.add(legGroup);
    });

    group.position.set(x, y, z);
    group.scale.setScalar(1.1);

    group.userData = {
        type: 'deer',
        state: 'idle',
        stateTimer: 0,
        targetX: x,
        targetZ: z,
        speed: 0.035 + Math.random() * 0.02,
        legs: legs,
        walkCycle: 0,
        homeX: x,
        homeZ: z,
        confined: false,
        roamRadius: 50 + Math.random() * 40
    };

    scene.add(group);
    state.addAnimal(group);
    return group;
}
