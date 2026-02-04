/**
 * Squirrel - Wild squirrel creation
 */

import * as THREE from 'three';
import { materials } from '../../materials/index.js';
import { getHeightAt } from '../../utils/index.js';
import { state } from '../../core/State.js';

/**
 * Create a squirrel at the specified position
 * @param {THREE.Scene} scene - The scene to add to
 * @param {number} x - X position
 * @param {number} z - Z position
 * @returns {THREE.Group} The squirrel group
 */
export function createSquirrel(scene, x, z) {
    const group = new THREE.Group();
    const y = getHeightAt(x, z);

    // Body
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.12, 6, 10), materials.squirrelBrown);
    body.rotation.x = Math.PI / 5;
    body.position.y = 0.16;
    body.castShadow = true;
    group.add(body);

    // Belly (lighter)
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), materials.squirrelLight);
    belly.scale.set(0.9, 1, 1.1);
    belly.position.set(0, 0.14, 0.04);
    group.add(belly);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), materials.squirrelBrown);
    head.position.set(0, 0.28, 0.1);
    group.add(head);

    // Cheeks (white/light)
    const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), materials.squirrelLight);
    cheekL.position.set(-0.045, 0.26, 0.12);
    group.add(cheekL);
    const cheekR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), materials.squirrelLight);
    cheekR.position.set(0.045, 0.26, 0.12);
    group.add(cheekR);

    // Snout
    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), materials.squirrelBrown);
    snout.scale.set(1, 0.8, 1.2);
    snout.position.set(0, 0.26, 0.16);
    group.add(snout);

    // Nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), materials.beeBlack);
    nose.position.set(0, 0.26, 0.19);
    group.add(nose);

    // Eyes (large and bright)
    const eyeGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const eyeL = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeL.position.set(-0.04, 0.3, 0.14);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeR.position.set(0.04, 0.3, 0.14);
    group.add(eyeR);

    // Eye shine
    const shineGeo = new THREE.SphereGeometry(0.01, 4, 4);
    const shineL = new THREE.Mesh(shineGeo, materials.white);
    shineL.position.set(-0.035, 0.305, 0.16);
    group.add(shineL);
    const shineR = new THREE.Mesh(shineGeo, materials.white);
    shineR.position.set(0.045, 0.305, 0.16);
    group.add(shineR);

    // Ears (rounded with tufts)
    const earGeo = new THREE.SphereGeometry(0.025, 6, 6);
    const ear1 = new THREE.Mesh(earGeo, materials.squirrelBrown);
    ear1.scale.set(0.8, 1.2, 0.6);
    ear1.position.set(-0.045, 0.36, 0.08);
    group.add(ear1);
    const ear2 = new THREE.Mesh(earGeo, materials.squirrelBrown);
    ear2.scale.set(0.8, 1.2, 0.6);
    ear2.position.set(0.045, 0.36, 0.08);
    group.add(ear2);

    // Ear tufts
    const tuftGeo = new THREE.ConeGeometry(0.01, 0.025, 4);
    const tuft1 = new THREE.Mesh(tuftGeo, materials.squirrelBrown);
    tuft1.position.set(-0.045, 0.39, 0.08);
    group.add(tuft1);
    const tuft2 = new THREE.Mesh(tuftGeo, materials.squirrelBrown);
    tuft2.position.set(0.045, 0.39, 0.08);
    group.add(tuft2);

    // Big fluffy tail - multiple segments
    const tailGroup = new THREE.Group();
    const tail1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.1, 6, 8), materials.squirrelBrown);
    tail1.position.y = 0.05;
    tailGroup.add(tail1);
    const tail2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.12, 6, 8), materials.squirrelBrown);
    tail2.position.y = 0.15;
    tailGroup.add(tail2);
    const tail3 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), materials.squirrelLight);
    tail3.scale.set(1, 1.3, 1);
    tail3.position.y = 0.28;
    tailGroup.add(tail3);
    tailGroup.position.set(0, 0.18, -0.12);
    tailGroup.rotation.x = -Math.PI / 2.5;
    group.add(tailGroup);

    // Legs with tiny paws
    const legs = [];

    // Front legs (holding pose)
    [-0.04, 0.04].forEach(xPos => {
        const legGroup = new THREE.Group();
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.012, 0.06, 6), materials.squirrelBrown);
        leg.position.y = 0.03;
        legGroup.add(leg);
        const paw = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), materials.squirrelBrown);
        paw.scale.set(1, 0.6, 1.2);
        paw.position.y = 0.005;
        legGroup.add(paw);
        legGroup.position.set(xPos, 0.06, 0.08);
        legs.push(legGroup);
        group.add(legGroup);
    });

    // Back legs (bigger for jumping)
    [-0.045, 0.045].forEach(xPos => {
        const legGroup = new THREE.Group();
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.015, 0.08, 6), materials.squirrelBrown);
        leg.position.y = 0.04;
        legGroup.add(leg);
        const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.03, 4, 6), materials.squirrelBrown);
        foot.rotation.x = Math.PI / 2;
        foot.position.set(0, 0.01, 0.015);
        legGroup.add(foot);
        legGroup.position.set(xPos, 0.04, -0.06);
        legs.push(legGroup);
        group.add(legGroup);
    });

    group.position.set(x, y, z);
    group.scale.setScalar(1.5);

    group.userData = {
        type: 'squirrel',
        state: 'idle',
        stateTimer: 0,
        targetX: x,
        targetZ: z,
        speed: 0.06 + Math.random() * 0.03,
        legs: legs,
        tail: tailGroup,
        walkCycle: 0,
        homeX: x,
        homeZ: z,
        confined: false,
        roamRadius: 20 + Math.random() * 15
    };

    scene.add(group);
    state.addAnimal(group);
    return group;
}
