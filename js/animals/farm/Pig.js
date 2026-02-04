/**
 * Pig - Farm pig creation
 */

import * as THREE from 'three';
import { materials } from '../../materials/index.js';
import { getHeightAt } from '../../utils/index.js';
import { state } from '../../core/State.js';

/**
 * Create a pig at the specified position
 * @param {THREE.Scene} scene - The scene to add to
 * @param {number} x - X position
 * @param {number} z - Z position
 * @returns {THREE.Group} The pig group
 */
export function createPig(scene, x, z) {
    const group = new THREE.Group();
    const y = getHeightAt(x, z);

    // Body - plump capsule
    const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.28, 0.5, 8, 12),
        materials.pigPink
    );
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.38;
    body.castShadow = true;
    group.add(body);

    // Belly (slightly lighter/bigger underneath)
    const belly = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 8, 8),
        materials.pigSnout
    );
    belly.scale.set(1.2, 0.8, 1);
    belly.position.set(0, 0.28, 0);
    group.add(belly);

    // Head - round
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 10, 10),
        materials.pigPink
    );
    head.scale.set(1, 0.95, 1.1);
    head.position.set(0, 0.48, 0.42);
    group.add(head);

    // Snout - big and round
    const snout = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 0.1, 12),
        materials.pigSnout
    );
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, 0.44, 0.6);
    group.add(snout);

    // Nostrils
    const nostrilGeo = new THREE.SphereGeometry(0.025, 6, 6);
    const nostrilL = new THREE.Mesh(nostrilGeo, materials.pigPink);
    nostrilL.position.set(-0.04, 0.44, 0.66);
    group.add(nostrilL);
    const nostrilR = new THREE.Mesh(nostrilGeo, materials.pigPink);
    nostrilR.position.set(0.04, 0.44, 0.66);
    group.add(nostrilR);

    // Eyes (with shine)
    const eyeGeo = new THREE.SphereGeometry(0.03, 6, 6);
    const eyeL = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeL.position.set(-0.1, 0.52, 0.52);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeR.position.set(0.1, 0.52, 0.52);
    group.add(eyeR);

    // Eye shine
    const shineGeo = new THREE.SphereGeometry(0.01, 4, 4);
    const shineL = new THREE.Mesh(shineGeo, materials.white);
    shineL.position.set(-0.095, 0.525, 0.545);
    group.add(shineL);
    const shineR = new THREE.Mesh(shineGeo, materials.white);
    shineR.position.set(0.105, 0.525, 0.545);
    group.add(shineR);

    // Ears - floppy triangular
    const earGeo = new THREE.ConeGeometry(0.08, 0.12, 4);
    const earL = new THREE.Mesh(earGeo, materials.pigPink);
    earL.rotation.x = Math.PI / 4;
    earL.rotation.z = -0.4;
    earL.position.set(-0.14, 0.6, 0.35);
    group.add(earL);
    const earR = new THREE.Mesh(earGeo, materials.pigPink);
    earR.rotation.x = Math.PI / 4;
    earR.rotation.z = 0.4;
    earR.position.set(0.14, 0.6, 0.35);
    group.add(earR);

    // Curly tail
    const tailGroup = new THREE.Group();
    for (let i = 0; i < 5; i++) {
        const segment = new THREE.Mesh(
            new THREE.SphereGeometry(0.025, 6, 6),
            materials.pigPink
        );
        const angle = (i / 5) * Math.PI * 1.5;
        const r = 0.06;
        segment.position.set(
            Math.cos(angle) * r,
            Math.sin(angle) * r,
            i * 0.02
        );
        tailGroup.add(segment);
    }
    tailGroup.position.set(0, 0.4, -0.4);
    tailGroup.rotation.x = -0.3;
    group.add(tailGroup);

    // Legs with hooves
    const legs = [];
    const legPositions = [
        [-0.14, 0.12, 0.18],
        [0.14, 0.12, 0.18],
        [-0.14, 0.12, -0.18],
        [0.14, 0.12, -0.18]
    ];

    legPositions.forEach(pos => {
        const legGroup = new THREE.Group();

        const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.045, 0.22, 8),
            materials.pigPink
        );
        leg.position.y = 0.11;
        legGroup.add(leg);

        // Hoof
        const hoof = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.04, 8),
            materials.beeBlack
        );
        hoof.position.y = 0.02;
        legGroup.add(hoof);

        legGroup.position.set(...pos);
        legs.push(legGroup);
        group.add(legGroup);
    });

    group.position.set(x, y, z);
    group.scale.setScalar(1.4);

    group.userData = {
        type: 'pig',
        state: 'idle',
        stateTimer: 0,
        targetX: x,
        targetZ: z,
        speed: 0.02 + Math.random() * 0.01,
        legs: legs,
        walkCycle: 0,
        homeX: x,
        homeZ: z,
        confined: true
    };

    scene.add(group);
    state.addAnimal(group);
    return group;
}
