/**
 * InsectSystem - Handles butterflies, bees, and birds
 */

import { state } from '../core/State.js';
import { getHeightAt } from '../utils/index.js';

/**
 * Update all insects (butterflies, bees, birds) in the scene
 * @param {number} dt - Delta time in seconds
 * @param {number} now - Current time in milliseconds
 */
export function updateInsectSystem(dt, now) {
    const insects = state.insects;
    const flowers = state.flowers;

    insects.forEach(insect => {
        const d = insect.userData;
        d.flightTimer += dt;
        d.phase += dt * 20;

        // Wing flapping animation
        if (d.wings) {
            animateWings(d);
        }

        // Type-specific flight behavior
        switch (d.type) {
            case 'butterfly':
                updateButterfly(insect, d, dt, now);
                break;
            case 'bee':
                updateBee(insect, d, dt, now, flowers);
                break;
            case 'bird':
                updateBird(insect, d, dt, now);
                break;
        }
    });
}

/**
 * Animate wing flapping based on insect type
 * @param {Object} d - userData
 */
function animateWings(d) {
    if (d.type === 'butterfly') {
        const flap = Math.sin(d.phase) * 0.8;
        d.wings[0].rotation.z = flap;
        d.wings[1].rotation.z = -flap;
        if (d.wings.length > 2) {
            d.wings[2].rotation.z = flap * 0.7;
            d.wings[3].rotation.z = -flap * 0.7;
        }
    } else if (d.type === 'bee') {
        const flap = Math.sin(d.phase * 2) * 0.3;
        d.wings[0].rotation.z = flap;
        d.wings[1].rotation.z = -flap;
    } else if (d.type === 'bird') {
        const flap = Math.sin(d.phase * 0.5) * 0.5;
        d.wings[0].rotation.z = flap;
        d.wings[1].rotation.z = -flap;
    }
}

/**
 * Update butterfly flight
 * @param {THREE.Group} insect - Butterfly group
 * @param {Object} d - userData
 * @param {number} dt - Delta time
 * @param {number} now - Current time
 */
function updateButterfly(insect, d, dt, now) {
    // Pick new target periodically
    if (d.flightTimer > 1 + Math.random() * 2) {
        d.flightTimer = 0;
        d.targetX = d.homeX + (Math.random() - 0.5) * 15;
        d.targetZ = d.homeZ + (Math.random() - 0.5) * 15;
        const groundY = getHeightAt(d.targetX, d.targetZ);
        d.targetY = groundY + 1.5 + Math.random() * 3;
    }

    // Smooth movement towards target
    insect.position.x += (d.targetX - insect.position.x) * 0.03;
    insect.position.y += (d.targetY - insect.position.y) * 0.03;
    insect.position.z += (d.targetZ - insect.position.z) * 0.03;

    // Gentle bobbing
    insect.position.y += Math.sin(now * 0.003 + d.phase) * 0.02;

    // Face movement direction
    insect.rotation.y = Math.atan2(
        d.targetX - insect.position.x,
        d.targetZ - insect.position.z
    );
}

/**
 * Update bee flight (attracted to flowers)
 * @param {THREE.Group} insect - Bee group
 * @param {Object} d - userData
 * @param {number} dt - Delta time
 * @param {number} now - Current time
 * @param {Array} flowers - Array of flower objects
 */
function updateBee(insect, d, dt, now, flowers) {
    // Pick new target periodically
    if (d.flightTimer > 2 + Math.random() * 3) {
        d.flightTimer = 0;

        // Bees are attracted to flowers
        if (flowers.length > 0 && Math.random() > 0.3) {
            const flower = flowers[Math.floor(Math.random() * flowers.length)];
            d.targetX = flower.position.x + (Math.random() - 0.5) * 2;
            d.targetY = 0.5 + Math.random() * 1;
            d.targetZ = flower.position.z + (Math.random() - 0.5) * 2;
        } else {
            d.targetX = d.homeX + (Math.random() - 0.5) * 15;
            d.targetY = 0.5 + Math.random() * 2;
            d.targetZ = d.homeZ + (Math.random() - 0.5) * 15;
        }
    }

    // Smooth movement towards target
    insect.position.x += (d.targetX - insect.position.x) * 0.03;
    insect.position.y += (d.targetY - insect.position.y) * 0.03;
    insect.position.z += (d.targetZ - insect.position.z) * 0.03;

    // Faster bobbing for bees
    insect.position.y += Math.sin(now * 0.008 + d.phase) * 0.02;

    // Face movement direction
    insect.rotation.y = Math.atan2(
        d.targetX - insect.position.x,
        d.targetZ - insect.position.z
    );
}

/**
 * Update bird flight (circular soaring)
 * @param {THREE.Group} insect - Bird group
 * @param {Object} d - userData
 * @param {number} dt - Delta time
 * @param {number} now - Current time
 */
function updateBird(insect, d, dt, now) {
    // Birds fly in circles
    d.circleAngle += dt * 0.3;

    d.targetX = d.homeX + Math.cos(d.circleAngle) * d.circleRadius;
    d.targetZ = d.homeZ + Math.sin(d.circleAngle) * d.circleRadius;
    d.targetY = 10 + Math.sin(d.circleAngle * 0.5) * 3;

    // Faster interpolation for birds
    insect.position.x += (d.targetX - insect.position.x) * 0.05;
    insect.position.y += (d.targetY - insect.position.y) * 0.05;
    insect.position.z += (d.targetZ - insect.position.z) * 0.05;

    // Face flight direction with banking
    insect.rotation.y = d.circleAngle + Math.PI / 2;
    insect.rotation.z = Math.sin(d.circleAngle) * 0.2;
}
