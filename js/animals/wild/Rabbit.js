/**
 * Rabbit - Wild rabbit creation
 */

import * as THREE from 'three';
import { materials } from '../../materials/index.js';
import { getHeightAt } from '../../utils/index.js';
import { state } from '../../core/State.js';

/**
 * Create a rabbit at the specified position
 * @param {THREE.Scene} scene - The scene to add to
 * @param {number} x - X position
 * @param {number} z - Z position
 * @returns {THREE.Group} The rabbit group
 */
export function createRabbit(scene, x, z) {
    const group = new THREE.Group();
    const y = getHeightAt(x, z);
    const isWhite = Math.random() > 0.7;
    const bodyMat = isWhite ? materials.rabbitWhite : materials.rabbitBrown;

    // Body - plump
    const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 10, 10),
        bodyMat
    );
    body.scale.set(1, 0.85, 1.3);
    body.position.y = 0.22;
    body.castShadow = true;
    group.add(body);

    // Head - round and cute
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 10, 10),
        bodyMat
    );
    head.scale.set(1, 0.95, 1);
    head.position.set(0, 0.35, 0.2);
    group.add(head);

    // Cheeks
    const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), bodyMat);
    cheekL.position.set(-0.1, 0.32, 0.28);
    group.add(cheekL);
    const cheekR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), bodyMat);
    cheekR.position.set(0.1, 0.32, 0.28);
    group.add(cheekR);

    // Eyes (large and cute with shine)
    const eyeGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const eyeL = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeL.position.set(-0.06, 0.38, 0.3);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeR.position.set(0.06, 0.38, 0.3);
    group.add(eyeR);

    // Eye shine
    const shineGeo = new THREE.SphereGeometry(0.012, 4, 4);
    const shineL = new THREE.Mesh(shineGeo, materials.white);
    shineL.position.set(-0.055, 0.385, 0.33);
    group.add(shineL);
    const shineR = new THREE.Mesh(shineGeo, materials.white);
    shineR.position.set(0.065, 0.385, 0.33);
    group.add(shineR);

    // Nose (pink)
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), materials.rabbitPink);
    nose.scale.set(1.2, 0.8, 1);
    nose.position.set(0, 0.33, 0.34);
    group.add(nose);

    // Whisker dots
    const whiskerDot = new THREE.SphereGeometry(0.008, 4, 4);
    [-0.08, -0.06, 0.06, 0.08].forEach((xPos) => {
        const dot = new THREE.Mesh(whiskerDot, materials.beeBlack);
        dot.position.set(xPos, 0.31, 0.32);
        group.add(dot);
    });

    // Ears (long)
    const earGeo = new THREE.CapsuleGeometry(0.04, 0.22, 6, 10);
    const ear1 = new THREE.Mesh(earGeo, bodyMat);
    ear1.position.set(-0.06, 0.58, 0.15);
    ear1.rotation.x = -0.15;
    ear1.rotation.z = -0.1;
    group.add(ear1);
    const ear2 = new THREE.Mesh(earGeo, bodyMat);
    ear2.position.set(0.06, 0.58, 0.15);
    ear2.rotation.x = -0.15;
    ear2.rotation.z = 0.1;
    group.add(ear2);

    // Inner ears (pink)
    const innerEarGeo = new THREE.CapsuleGeometry(0.02, 0.15, 4, 6);
    const innerEar1 = new THREE.Mesh(innerEarGeo, materials.rabbitPink);
    innerEar1.position.set(-0.06, 0.57, 0.17);
    innerEar1.rotation.x = -0.15;
    innerEar1.rotation.z = -0.1;
    group.add(innerEar1);
    const innerEar2 = new THREE.Mesh(innerEarGeo, materials.rabbitPink);
    innerEar2.position.set(0.06, 0.57, 0.17);
    innerEar2.rotation.x = -0.15;
    innerEar2.rotation.z = 0.1;
    group.add(innerEar2);

    // Tail (fluffy ball)
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), materials.rabbitWhite);
    tail.position.set(0, 0.22, -0.22);
    group.add(tail);

    // Legs
    const legs = [];

    // Front legs (smaller)
    [-0.07, 0.07].forEach(xPos => {
        const legGroup = new THREE.Group();
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.1, 6), bodyMat);
        leg.position.y = 0.05;
        legGroup.add(leg);
        const paw = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), bodyMat);
        paw.scale.set(1, 0.6, 1.3);
        paw.position.y = 0.01;
        legGroup.add(paw);
        legGroup.position.set(xPos, 0.05, 0.12);
        legs.push(legGroup);
        group.add(legGroup);
    });

    // Back legs (bigger for hopping)
    [-0.09, 0.09].forEach(xPos => {
        const legGroup = new THREE.Group();
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.08, 4, 6), bodyMat);
        leg.position.y = 0.06;
        legGroup.add(leg);
        const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.06, 4, 6), bodyMat);
        foot.rotation.x = Math.PI / 2;
        foot.position.set(0, 0.02, 0.03);
        legGroup.add(foot);
        legGroup.position.set(xPos, 0.05, -0.1);
        legs.push(legGroup);
        group.add(legGroup);
    });

    group.position.set(x, y, z);
    group.scale.setScalar(1.3);

    group.userData = {
        type: 'rabbit',
        state: 'idle',
        stateTimer: 0,
        targetX: x,
        targetZ: z,
        speed: 0.05 + Math.random() * 0.03,
        legs: legs,
        ears: [ear1, ear2],
        walkCycle: 0,
        homeX: x,
        homeZ: z,
        confined: false,
        roamRadius: 25 + Math.random() * 20
    };

    scene.add(group);
    state.addAnimal(group);
    return group;
}
