/**
 * Frog - Wild frog creation
 */

import * as THREE from 'three';
import { materials } from '../../materials/index.js';
import { getHeightAt } from '../../utils/index.js';
import { state } from '../../core/State.js';

/**
 * Create a frog at the specified position
 * @param {THREE.Scene} scene - The scene to add to
 * @param {number} x - X position
 * @param {number} z - Z position
 * @returns {THREE.Group} The frog group
 */
export function createFrog(scene, x, z) {
    const group = new THREE.Group();
    const y = getHeightAt(x, z);

    // Vibrant frog colors!
    const frogColors = [
        { body: 0x00ff44, belly: 0xccffcc }, // Bright green
        { body: 0x44ff00, belly: 0xddffaa }, // Lime green
        { body: 0xffdd00, belly: 0xffffcc }, // Yellow
        { body: 0xff6600, belly: 0xffddaa }, // Orange
        { body: 0x00ccff, belly: 0xccffff }, // Cyan/blue
        { body: 0xff0066, belly: 0xffccdd }, // Pink/red (poison dart frog)
        { body: 0x9933ff, belly: 0xddccff }, // Purple
        { body: 0x33ff99, belly: 0xccffee }, // Teal
    ];

    const colorScheme = frogColors[Math.floor(Math.random() * frogColors.length)];
    const bodyColor = new THREE.MeshStandardMaterial({ color: colorScheme.body, roughness: 0.5 });
    const bellyColor = new THREE.MeshStandardMaterial({ color: colorScheme.belly, roughness: 0.4 });

    // Body - squat and round
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), bodyColor);
    body.scale.set(1.2, 0.7, 1.4);
    body.position.y = 0.1;
    body.castShadow = true;
    group.add(body);

    // Belly
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), bellyColor);
    belly.scale.set(1.1, 0.6, 1.2);
    belly.position.set(0, 0.06, 0.02);
    group.add(belly);

    // Head - wide and flat
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), bodyColor);
    head.scale.set(1.3, 0.7, 1);
    head.position.set(0, 0.12, 0.14);
    group.add(head);

    // Big bulging eyes
    const eyeBulgeGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const eyeBulgeL = new THREE.Mesh(eyeBulgeGeo, bodyColor);
    eyeBulgeL.position.set(-0.07, 0.18, 0.16);
    group.add(eyeBulgeL);
    const eyeBulgeR = new THREE.Mesh(eyeBulgeGeo, bodyColor);
    eyeBulgeR.position.set(0.07, 0.18, 0.16);
    group.add(eyeBulgeR);

    // Eyeballs (black with shine)
    const eyeGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const eyeL = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeL.position.set(-0.07, 0.2, 0.19);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeR.position.set(0.07, 0.2, 0.19);
    group.add(eyeR);

    // Eye shine
    const shineGeo = new THREE.SphereGeometry(0.008, 4, 4);
    const shineL = new THREE.Mesh(shineGeo, materials.white);
    shineL.position.set(-0.065, 0.205, 0.21);
    group.add(shineL);
    const shineR = new THREE.Mesh(shineGeo, materials.white);
    shineR.position.set(0.075, 0.205, 0.21);
    group.add(shineR);

    // Mouth line
    const mouthGeo = new THREE.BoxGeometry(0.12, 0.01, 0.02);
    const mouth = new THREE.Mesh(mouthGeo, materials.beeBlack);
    mouth.position.set(0, 0.08, 0.22);
    group.add(mouth);

    // Nostrils
    const nostrilGeo = new THREE.SphereGeometry(0.008, 4, 4);
    const nostrilL = new THREE.Mesh(nostrilGeo, materials.beeBlack);
    nostrilL.position.set(-0.025, 0.12, 0.23);
    group.add(nostrilL);
    const nostrilR = new THREE.Mesh(nostrilGeo, materials.beeBlack);
    nostrilR.position.set(0.025, 0.12, 0.23);
    group.add(nostrilR);

    // Back legs (big and powerful for jumping)
    const legs = [];

    [-1, 1].forEach(side => {
        const legGroup = new THREE.Group();
        const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.08, 4, 6), bodyColor);
        thigh.rotation.z = side * 0.8;
        thigh.rotation.x = 0.3;
        thigh.position.set(side * 0.06, 0.04, -0.06);
        legGroup.add(thigh);
        const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.07, 4, 6), bodyColor);
        shin.rotation.z = side * -0.5;
        shin.position.set(side * 0.12, 0.02, -0.04);
        legGroup.add(shin);
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 0.08), bodyColor);
        foot.position.set(side * 0.14, 0.01, -0.02);
        legGroup.add(foot);
        legs.push(legGroup);
        group.add(legGroup);
    });

    // Front legs (smaller)
    [-1, 1].forEach(side => {
        const legGroup = new THREE.Group();
        const frontLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.04, 4, 6), bodyColor);
        frontLeg.rotation.z = side * 0.4;
        frontLeg.position.set(side * 0.08, 0.03, 0.1);
        legGroup.add(frontLeg);
        const frontFoot = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.008, 0.04), bodyColor);
        frontFoot.position.set(side * 0.1, 0.01, 0.12);
        legGroup.add(frontFoot);
        legs.push(legGroup);
        group.add(legGroup);
    });

    group.position.set(x, y, z);
    group.scale.setScalar(1.8);

    group.userData = {
        type: 'frog',
        state: 'idle',
        stateTimer: 0,
        targetX: x,
        targetZ: z,
        speed: 0.08,
        legs: legs,
        walkCycle: 0,
        homeX: x,
        homeZ: z,
        confined: false,
        roamRadius: 8,
        jumpTimer: 0,
        isJumping: false
    };

    scene.add(group);
    state.addAnimal(group);
    return group;
}
