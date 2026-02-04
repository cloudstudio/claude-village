/**
 * Pond - Pond creation with animated water
 */

import * as THREE from 'three';
import { materials } from '../materials/index.js';

// Pond water reference for animation
export let pondWater = null;
export let pondWaterData = null;

/**
 * Create a pond at the specified position
 * @param {THREE.Scene} scene - The scene to add to
 * @param {number} x - X position
 * @param {number} z - Z position
 * @param {number} radius - Pond radius (default 6)
 * @returns {THREE.Group} The pond group
 */
export function createPond(scene, x, z, radius = 6) {
    const group = new THREE.Group();

    // Animated water material
    const animatedWaterMat = new THREE.MeshPhysicalMaterial({
        color: 0x0088cc,
        transmission: 0.7,
        opacity: 0.85,
        roughness: 0.15,
        metalness: 0.1,
        transparent: true,
        ior: 1.33, // Water IOR
        thickness: 0.5
    });

    // Water surface with subdivisions for wave animation
    const waterGeo = new THREE.CircleGeometry(radius, 48, 48);
    const water = new THREE.Mesh(waterGeo, animatedWaterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.08;
    water.receiveShadow = true;
    group.add(water);

    // Store original positions for wave animation
    const positions = water.geometry.attributes.position;
    const originalY = new Float32Array(positions.count);
    for (let i = 0; i < positions.count; i++) {
        originalY[i] = positions.getY(i);
    }

    pondWater = water;
    pondWaterData = {
        originalY,
        radius,
        centerX: x,
        centerZ: z
    };

    // Deeper center with slight transparency
    const deepWater = new THREE.Mesh(
        new THREE.CircleGeometry(radius * 0.5, 24),
        materials.waterDeep
    );
    deepWater.rotation.x = -Math.PI / 2;
    deepWater.position.y = 0.03;
    group.add(deepWater);

    // Sand/dirt edge
    const edge = new THREE.Mesh(
        new THREE.RingGeometry(radius, radius + 1.2, 32),
        materials.sand
    );
    edge.rotation.x = -Math.PI / 2;
    edge.position.y = 0.02;
    edge.receiveShadow = true;
    group.add(edge);

    // Rocks around pond
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
        const dist = radius + 0.3 + Math.random() * 0.8;
        const rockSize = 0.3 + Math.random() * 0.4;
        const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(rockSize, 0),
            Math.random() > 0.5 ? materials.stoneDark : materials.stone
        );
        rock.position.set(Math.cos(angle) * dist, rockSize * 0.3, Math.sin(angle) * dist);
        rock.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
        rock.scale.set(1, 0.6, 1);
        rock.castShadow = true;
        group.add(rock);
    }

    // Add some lily pads
    for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 1 + Math.random() * (radius - 2);
        const lilyPad = new THREE.Mesh(
            new THREE.CircleGeometry(0.3 + Math.random() * 0.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x228822, roughness: 0.8 })
        );
        lilyPad.rotation.x = -Math.PI / 2;
        lilyPad.position.set(Math.cos(angle) * dist, 0.1, Math.sin(angle) * dist);
        lilyPad.rotation.z = Math.random() * Math.PI;
        group.add(lilyPad);
    }

    group.position.set(x, 0.1, z);
    scene.add(group);
    return group;
}

/**
 * Get the pond water mesh for animation
 * @returns {THREE.Mesh|null} The water mesh
 */
export function getPondWater() {
    return pondWater;
}

/**
 * Get the pond water data for animation
 * @returns {Object|null} The water data
 */
export function getPondWaterData() {
    return pondWaterData;
}
