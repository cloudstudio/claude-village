/**
 * Sheep - Farm sheep creation
 */

import * as THREE from 'three';
import { materials } from '../../materials/index.js';
import { getHeightAt } from '../../utils/index.js';
import { state } from '../../core/State.js';

/**
 * Create a sheep at the specified position
 * @param {THREE.Scene} scene - The scene to add to
 * @param {number} x - X position
 * @param {number} z - Z position
 * @returns {THREE.Group} The sheep group
 */
export function createSheep(scene, x, z) {
    const group = new THREE.Group();
    const y = getHeightAt(x, z);

    // Fluffy body - main wool
    const bodyMain = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.35, 0.6, 8, 12),
        materials.sheepWhite
    );
    bodyMain.rotation.x = Math.PI / 2;
    bodyMain.position.y = 0.55;
    bodyMain.castShadow = true;
    group.add(bodyMain);

    // Extra fluff puffs for woolly look
    for (let i = 0; i < 10; i++) {
        const fluff = new THREE.Mesh(
            new THREE.SphereGeometry(0.15 + Math.random() * 0.1, 8, 8),
            materials.sheepWhite
        );
        const angle = (i / 10) * Math.PI * 2;
        const r = 0.25 + Math.random() * 0.1;
        fluff.position.set(
            Math.cos(angle) * r,
            0.55 + (Math.random() - 0.5) * 0.2,
            Math.sin(angle) * r * 1.3
        );
        group.add(fluff);
    }

    // Head - rounded black face
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 10, 10),
        materials.sheepFace
    );
    head.scale.set(0.9, 1, 1.1);
    head.position.set(0, 0.7, 0.55);
    group.add(head);

    // Wool tuft on head
    const headWool = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        materials.sheepWhite
    );
    headWool.position.set(0, 0.85, 0.5);
    group.add(headWool);

    // Eyes (with shine)
    const eyeGeo = new THREE.SphereGeometry(0.03, 6, 6);
    const eyeL = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeL.position.set(-0.08, 0.72, 0.68);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeR.position.set(0.08, 0.72, 0.68);
    group.add(eyeR);

    // Eye shine
    const shineGeo = new THREE.SphereGeometry(0.01, 4, 4);
    const shineL = new THREE.Mesh(shineGeo, materials.white);
    shineL.position.set(-0.075, 0.725, 0.7);
    group.add(shineL);
    const shineR = new THREE.Mesh(shineGeo, materials.white);
    shineR.position.set(0.085, 0.725, 0.7);
    group.add(shineR);

    // Nose
    const nose = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 6, 6),
        materials.beeBlack
    );
    nose.scale.set(1.2, 0.8, 1);
    nose.position.set(0, 0.65, 0.72);
    group.add(nose);

    // Ears
    const earGeo = new THREE.CapsuleGeometry(0.04, 0.08, 4, 6);
    const earL = new THREE.Mesh(earGeo, materials.sheepFace);
    earL.rotation.z = Math.PI / 2 + 0.3;
    earL.position.set(-0.18, 0.75, 0.52);
    group.add(earL);
    const earR = new THREE.Mesh(earGeo, materials.sheepFace);
    earR.rotation.z = -Math.PI / 2 - 0.3;
    earR.position.set(0.18, 0.75, 0.52);
    group.add(earR);

    // Tail (small wool puff)
    const tail = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        materials.sheepWhite
    );
    tail.position.set(0, 0.5, -0.5);
    group.add(tail);

    // Legs with hooves
    const legs = [];
    const legPositions = [
        [-0.18, 0.2, 0.22],
        [0.18, 0.2, 0.22],
        [-0.18, 0.2, -0.22],
        [0.18, 0.2, -0.22]
    ];

    legPositions.forEach(pos => {
        const legGroup = new THREE.Group();

        const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.04, 0.35, 8),
            materials.sheepFace
        );
        leg.position.y = 0.18;
        legGroup.add(leg);

        // Hoof
        const hoof = new THREE.Mesh(
            new THREE.CylinderGeometry(0.045, 0.05, 0.06, 8),
            materials.beeBlack
        );
        hoof.position.y = 0.03;
        legGroup.add(hoof);

        legGroup.position.set(...pos);
        legs.push(legGroup);
        group.add(legGroup);
    });

    group.position.set(x, y, z);
    group.scale.setScalar(1.3);

    group.userData = {
        type: 'sheep',
        state: 'idle',
        stateTimer: 0,
        targetX: x,
        targetZ: z,
        speed: 0.015 + Math.random() * 0.01,
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
