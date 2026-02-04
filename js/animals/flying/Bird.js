/**
 * Bird - Flying bird creation
 */

import * as THREE from 'three';
import { materials } from '../../materials/index.js';
import { state } from '../../core/State.js';

/**
 * Create a bird at the specified position
 * @param {THREE.Scene} scene - The scene to add to
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} z - Z position
 * @returns {THREE.Group} The bird group
 */
export function createBird(scene, x, y, z) {
    const group = new THREE.Group();
    const isBlueBird = Math.random() > 0.5;
    const bodyColor = isBlueBird ? materials.birdBlue : materials.birdBrown;
    const bellyColor = isBlueBird ? materials.white : materials.squirrelLight;

    // Body - round and plump
    const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 10),
        bodyColor
    );
    body.scale.set(0.9, 0.85, 1.2);
    group.add(body);

    // Belly
    const belly = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 8, 8),
        bellyColor
    );
    belly.position.set(0, -0.03, 0.02);
    group.add(belly);

    // Head
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 10, 10),
        bodyColor
    );
    head.position.set(0, 0.06, 0.12);
    group.add(head);

    // Eyes (with shine)
    const eyeGeo = new THREE.SphereGeometry(0.018, 6, 6);
    const eyeL = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeL.position.set(-0.045, 0.07, 0.17);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeR.position.set(0.045, 0.07, 0.17);
    group.add(eyeR);

    // Eye shine
    const shineGeo = new THREE.SphereGeometry(0.006, 4, 4);
    const shineL = new THREE.Mesh(shineGeo, materials.white);
    shineL.position.set(-0.042, 0.073, 0.185);
    group.add(shineL);
    const shineR = new THREE.Mesh(shineGeo, materials.white);
    shineR.position.set(0.048, 0.073, 0.185);
    group.add(shineR);

    // Beak - two parts
    const beakTop = new THREE.Mesh(
        new THREE.ConeGeometry(0.025, 0.07, 6),
        materials.chickenYellow
    );
    beakTop.rotation.x = -Math.PI / 2;
    beakTop.position.set(0, 0.05, 0.22);
    group.add(beakTop);

    const beakBottom = new THREE.Mesh(
        new THREE.ConeGeometry(0.015, 0.04, 6),
        materials.chickenYellow
    );
    beakBottom.rotation.x = -Math.PI / 2 + 0.3;
    beakBottom.position.set(0, 0.035, 0.2);
    group.add(beakBottom);

    // Wings - more detailed shape
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.bezierCurveTo(0.1, 0.02, 0.2, 0, 0.25, -0.05);
    wingShape.bezierCurveTo(0.22, -0.08, 0.1, -0.06, 0, -0.03);
    wingShape.closePath();

    const wingGeo = new THREE.ShapeGeometry(wingShape);

    const wing1 = new THREE.Mesh(wingGeo, bodyColor);
    wing1.rotation.y = Math.PI / 2;
    wing1.position.set(-0.1, 0.02, 0);
    group.add(wing1);

    const wing2 = new THREE.Mesh(wingGeo, bodyColor);
    wing2.rotation.y = -Math.PI / 2;
    wing2.scale.x = -1;
    wing2.position.set(0.1, 0.02, 0);
    group.add(wing2);

    // Tail feathers
    const tailGroup = new THREE.Group();
    for (let i = -1; i <= 1; i++) {
        const feather = new THREE.Mesh(
            new THREE.ConeGeometry(0.02, 0.12, 4),
            bodyColor
        );
        feather.rotation.x = Math.PI / 2 + 0.3;
        feather.position.set(i * 0.025, 0, 0);
        feather.rotation.z = i * 0.15;
        tailGroup.add(feather);
    }
    tailGroup.position.set(0, 0, -0.15);
    group.add(tailGroup);

    // Feet (small when flying)
    const footGeo = new THREE.CylinderGeometry(0.008, 0.005, 0.04, 4);
    const foot1 = new THREE.Mesh(footGeo, materials.chickenYellow);
    foot1.position.set(-0.04, -0.1, 0);
    group.add(foot1);
    const foot2 = new THREE.Mesh(footGeo, materials.chickenYellow);
    foot2.position.set(0.04, -0.1, 0);
    group.add(foot2);

    group.position.set(x, y, z);
    group.scale.setScalar(1.1);

    group.userData = {
        type: 'bird',
        wings: [wing1, wing2],
        tail: tailGroup,
        phase: Math.random() * Math.PI * 2,
        circleAngle: Math.random() * Math.PI * 2,
        circleRadius: 10 + Math.random() * 15,
        targetX: x,
        targetY: y,
        targetZ: z,
        homeX: x,
        homeZ: z,
        flightTimer: 0
    };

    scene.add(group);
    state.addInsect(group);
    return group;
}
