/**
 * Butterfly - Flying butterfly creation
 */

import * as THREE from 'three';
import { materials } from '../../materials/index.js';
import { state } from '../../core/State.js';

/**
 * Create a butterfly at the specified position
 * @param {THREE.Scene} scene - The scene to add to
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} z - Z position
 * @returns {THREE.Group} The butterfly group
 */
export function createButterfly(scene, x, y, z) {
    const group = new THREE.Group();
    const colors = [materials.butterflyBlue, materials.butterflyOrange, materials.flowerPurple, materials.flowerPink];
    const wingColor = colors[Math.floor(Math.random() * colors.length)];

    // Body - segmented
    const thorax = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.02, 0.06, 4, 6),
        materials.beeBlack
    );
    thorax.rotation.x = Math.PI / 2;
    thorax.position.z = 0.02;
    group.add(thorax);

    const abdomen = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.015, 0.1, 4, 6),
        materials.beeBlack
    );
    abdomen.rotation.x = Math.PI / 2;
    abdomen.position.z = -0.08;
    group.add(abdomen);

    // Head
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 8, 8),
        materials.beeBlack
    );
    head.position.z = 0.08;
    group.add(head);

    // Eyes (compound eyes)
    const eyeGeo = new THREE.SphereGeometry(0.012, 6, 6);
    const eyeL = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeL.position.set(-0.02, 0.005, 0.09);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeR.position.set(0.02, 0.005, 0.09);
    group.add(eyeR);

    // Antennae
    const antennaGeo = new THREE.CylinderGeometry(0.003, 0.002, 0.08, 4);
    const antenna1 = new THREE.Mesh(antennaGeo, materials.beeBlack);
    antenna1.position.set(-0.015, 0.04, 0.1);
    antenna1.rotation.x = -0.3;
    antenna1.rotation.z = -0.3;
    group.add(antenna1);
    const antenna2 = new THREE.Mesh(antennaGeo, materials.beeBlack);
    antenna2.position.set(0.015, 0.04, 0.1);
    antenna2.rotation.x = -0.3;
    antenna2.rotation.z = 0.3;
    group.add(antenna2);

    // Antenna tips (clubs)
    const tipGeo = new THREE.SphereGeometry(0.008, 4, 4);
    const tip1 = new THREE.Mesh(tipGeo, materials.beeBlack);
    tip1.position.set(-0.035, 0.07, 0.12);
    group.add(tip1);
    const tip2 = new THREE.Mesh(tipGeo, materials.beeBlack);
    tip2.position.set(0.035, 0.07, 0.12);
    group.add(tip2);

    // Upper wings - more organic rounded shape
    const upperWingShape = new THREE.Shape();
    upperWingShape.moveTo(0, 0);
    upperWingShape.bezierCurveTo(0.08, 0.02, 0.15, 0.08, 0.18, 0);
    upperWingShape.bezierCurveTo(0.16, -0.06, 0.08, -0.1, 0, -0.05);
    upperWingShape.closePath();

    const upperWingGeo = new THREE.ShapeGeometry(upperWingShape);

    const wing1 = new THREE.Mesh(upperWingGeo, wingColor);
    wing1.rotation.y = Math.PI / 2;
    wing1.rotation.x = Math.PI / 2;
    wing1.position.set(-0.02, 0.01, 0.02);
    group.add(wing1);

    const wing2 = new THREE.Mesh(upperWingGeo, wingColor);
    wing2.rotation.y = -Math.PI / 2;
    wing2.rotation.x = Math.PI / 2;
    wing2.scale.x = -1;
    wing2.position.set(0.02, 0.01, 0.02);
    group.add(wing2);

    // Lower wings - smaller
    const lowerWingShape = new THREE.Shape();
    lowerWingShape.moveTo(0, 0);
    lowerWingShape.bezierCurveTo(0.05, 0.01, 0.1, 0.03, 0.12, -0.02);
    lowerWingShape.bezierCurveTo(0.1, -0.06, 0.04, -0.07, 0, -0.03);
    lowerWingShape.closePath();

    const lowerWingGeo = new THREE.ShapeGeometry(lowerWingShape);

    const wing3 = new THREE.Mesh(lowerWingGeo, wingColor);
    wing3.rotation.y = Math.PI / 2;
    wing3.rotation.x = Math.PI / 2;
    wing3.position.set(-0.02, 0.005, -0.04);
    group.add(wing3);

    const wing4 = new THREE.Mesh(lowerWingGeo, wingColor);
    wing4.rotation.y = -Math.PI / 2;
    wing4.rotation.x = Math.PI / 2;
    wing4.scale.x = -1;
    wing4.position.set(0.02, 0.005, -0.04);
    group.add(wing4);

    // Wing patterns (spots)
    const spotGeo = new THREE.CircleGeometry(0.02, 8);
    const spotMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });

    [-1, 1].forEach(side => {
        const spot = new THREE.Mesh(spotGeo, spotMat);
        spot.rotation.y = side * Math.PI / 2;
        spot.rotation.x = Math.PI / 2;
        spot.position.set(side * 0.1, 0.012, 0);
        group.add(spot);
    });

    group.position.set(x, y, z);
    group.scale.setScalar(1.2);

    group.userData = {
        type: 'butterfly',
        wings: [wing1, wing2, wing3, wing4],
        phase: Math.random() * Math.PI * 2,
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
