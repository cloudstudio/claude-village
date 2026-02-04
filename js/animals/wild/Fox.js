/**
 * Fox - Wild fox creation
 */

import * as THREE from 'three';
import { materials } from '../../materials/index.js';
import { getHeightAt } from '../../utils/index.js';
import { state } from '../../core/State.js';

/**
 * Create a fox at the specified position
 * @param {THREE.Scene} scene - The scene to add to
 * @param {number} x - X position
 * @param {number} z - Z position
 * @returns {THREE.Group} The fox group
 */
export function createFox(scene, x, z) {
    const group = new THREE.Group();
    const y = getHeightAt(x, z);

    // Main body - sleek and elongated
    const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.18, 0.55, 8, 12),
        materials.foxOrange
    );
    body.rotation.z = Math.PI / 2;
    body.position.set(0, 0.32, 0);
    body.castShadow = true;
    group.add(body);

    // Chest (white underbelly)
    const chest = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 8, 8),
        materials.foxWhite
    );
    chest.scale.set(0.8, 1, 0.9);
    chest.position.set(0, 0.25, 0.2);
    group.add(chest);

    // Neck
    const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 0.15, 8),
        materials.foxOrange
    );
    neck.position.set(0, 0.4, 0.35);
    neck.rotation.x = -0.3;
    group.add(neck);

    // Head base - rounded
    const headBase = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 10, 10),
        materials.foxOrange
    );
    headBase.scale.set(1, 0.9, 1);
    headBase.position.set(0, 0.48, 0.42);
    group.add(headBase);

    // Snout - elegant pointed shape
    const snout = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.22, 8),
        materials.foxOrange
    );
    snout.rotation.x = -Math.PI / 2;
    snout.position.set(0, 0.44, 0.58);
    group.add(snout);

    // Nose tip (black)
    const nose = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 6, 6),
        materials.beeBlack
    );
    nose.position.set(0, 0.44, 0.7);
    group.add(nose);

    // White snout markings
    const snoutWhite = new THREE.Mesh(
        new THREE.ConeGeometry(0.055, 0.12, 8),
        materials.foxWhite
    );
    snoutWhite.rotation.x = -Math.PI / 2;
    snoutWhite.position.set(0, 0.41, 0.55);
    group.add(snoutWhite);

    // Cheeks (white fur patches)
    const cheekL = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 6),
        materials.foxWhite
    );
    cheekL.scale.set(0.8, 1, 0.6);
    cheekL.position.set(-0.1, 0.44, 0.48);
    group.add(cheekL);

    const cheekR = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 6),
        materials.foxWhite
    );
    cheekR.scale.set(0.8, 1, 0.6);
    cheekR.position.set(0.1, 0.44, 0.48);
    group.add(cheekR);

    // Eyes (dark with shine)
    const eyeGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const eyeL = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeL.position.set(-0.06, 0.52, 0.52);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeR.position.set(0.06, 0.52, 0.52);
    group.add(eyeR);

    // Eye shine
    const shineGeo = new THREE.SphereGeometry(0.008, 4, 4);
    const shineMat = materials.white || materials.foxWhite;
    const shineL = new THREE.Mesh(shineGeo, shineMat);
    shineL.position.set(-0.055, 0.525, 0.54);
    group.add(shineL);
    const shineR = new THREE.Mesh(shineGeo, shineMat);
    shineR.position.set(0.065, 0.525, 0.54);
    group.add(shineR);

    // Ears - large and triangular with black tips
    const earGeo = new THREE.ConeGeometry(0.06, 0.16, 4);
    const ear1 = new THREE.Mesh(earGeo, materials.foxOrange);
    ear1.position.set(-0.08, 0.65, 0.38);
    ear1.rotation.x = -0.2;
    ear1.rotation.z = -0.15;
    group.add(ear1);
    const ear2 = new THREE.Mesh(earGeo, materials.foxOrange);
    ear2.position.set(0.08, 0.65, 0.38);
    ear2.rotation.x = -0.2;
    ear2.rotation.z = 0.15;
    group.add(ear2);

    // Inner ears (pinkish)
    const innerEarGeo = new THREE.ConeGeometry(0.035, 0.1, 4);
    const innerEar1 = new THREE.Mesh(innerEarGeo, materials.rabbitPink);
    innerEar1.position.set(-0.08, 0.63, 0.4);
    innerEar1.rotation.x = -0.2;
    innerEar1.rotation.z = -0.15;
    group.add(innerEar1);
    const innerEar2 = new THREE.Mesh(innerEarGeo, materials.rabbitPink);
    innerEar2.position.set(0.08, 0.63, 0.4);
    innerEar2.rotation.x = -0.2;
    innerEar2.rotation.z = 0.15;
    group.add(innerEar2);

    // Ear tips (black)
    const earTipGeo = new THREE.ConeGeometry(0.025, 0.04, 4);
    const earTip1 = new THREE.Mesh(earTipGeo, materials.beeBlack);
    earTip1.position.set(-0.085, 0.73, 0.36);
    earTip1.rotation.z = -0.15;
    group.add(earTip1);
    const earTip2 = new THREE.Mesh(earTipGeo, materials.beeBlack);
    earTip2.position.set(0.085, 0.73, 0.36);
    earTip2.rotation.z = 0.15;
    group.add(earTip2);

    // Tail - big, fluffy, curved upward
    const tail1 = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.1, 0.25, 8, 12),
        materials.foxOrange
    );
    tail1.position.set(0, 0.32, -0.4);
    tail1.rotation.x = Math.PI / 6;
    group.add(tail1);

    const tail2 = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.12, 0.2, 8, 12),
        materials.foxOrange
    );
    tail2.position.set(0, 0.42, -0.55);
    tail2.rotation.x = Math.PI / 4;
    group.add(tail2);

    // Tail tip (white)
    const tailTip = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 10, 10),
        materials.foxWhite
    );
    tailTip.scale.set(0.9, 1.1, 0.9);
    tailTip.position.set(0, 0.58, -0.68);
    group.add(tailTip);

    // Legs - slender with dark "socks"
    const legs = [];
    const legPositions = [
        { pos: [-0.1, 0, 0.18], front: true },
        { pos: [0.1, 0, 0.18], front: true },
        { pos: [-0.1, 0, -0.15], front: false },
        { pos: [0.1, 0, -0.15], front: false }
    ];

    legPositions.forEach(({ pos, front }) => {
        const legGroup = new THREE.Group();

        // Upper leg
        const upperLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.035, 0.15, 8),
            materials.foxOrange
        );
        upperLeg.position.y = 0.22;
        legGroup.add(upperLeg);

        // Lower leg (black sock)
        const lowerLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.025, 0.12, 8),
            materials.beeBlack
        );
        lowerLeg.position.y = 0.06;
        legGroup.add(lowerLeg);

        // Paw
        const paw = new THREE.Mesh(
            new THREE.SphereGeometry(0.03, 6, 6),
            materials.beeBlack
        );
        paw.scale.set(1, 0.5, 1.3);
        paw.position.y = 0.015;
        legGroup.add(paw);

        legGroup.position.set(...pos);
        legs.push(legGroup);
        group.add(legGroup);
    });

    group.position.set(x, y, z);
    group.scale.setScalar(1.3);

    group.userData = {
        type: 'fox',
        state: 'walking',
        stateTimer: 0,
        targetX: x,
        targetZ: z,
        speed: 0.04 + Math.random() * 0.02,
        legs: legs,
        walkCycle: 0,
        homeX: x,
        homeZ: z,
        confined: false,
        roamRadius: 40 + Math.random() * 30
    };

    scene.add(group);
    state.addAnimal(group);
    return group;
}
