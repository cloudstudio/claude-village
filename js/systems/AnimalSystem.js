/**
 * AnimalSystem - Handles animal movement and animation
 */

import { state } from '../core/State.js';
import { getHeightAt, snapToGrid } from '../utils/index.js';
import { farmZone } from '../config/index.js';

/**
 * Animate animal legs during walking
 * @param {THREE.Group} animal - The animal group
 * @param {number} dt - Delta time
 */
function animateAnimalLegs(animal, dt) {
    const d = animal.userData;
    if (!d.legs || d.legs.length === 0) return;

    d.walkCycle += dt * 8;
    const swing = Math.sin(d.walkCycle) * 0.4;

    // Front legs swing opposite to back legs
    if (d.legs.length >= 4) {
        d.legs[0].rotation.x = swing;
        d.legs[1].rotation.x = swing;
        d.legs[2].rotation.x = -swing;
        d.legs[3].rotation.x = -swing;
    } else if (d.legs.length >= 2) {
        d.legs[0].rotation.x = swing;
        d.legs[1].rotation.x = -swing;
    }
}

/**
 * Reset animal legs to neutral position
 * @param {THREE.Group} animal - The animal group
 */
function resetAnimalLegs(animal) {
    const d = animal.userData;
    if (!d.legs) return;
    d.legs.forEach(leg => {
        if (leg && leg.rotation) leg.rotation.x = 0;
    });
}

/**
 * Check if animal is inside farm zone
 * @param {number} x - X position
 * @param {number} z - Z position
 * @returns {boolean}
 */
function isAnimalInFarm(x, z) {
    return x > farmZone.minX && x < farmZone.maxX &&
           z > farmZone.minZ && z < farmZone.maxZ;
}

/**
 * Update all animals in the scene
 * @param {number} dt - Delta time in seconds
 * @param {number} now - Current time in milliseconds
 */
export function updateAnimalSystem(dt, now) {
    const animals = state.animals;

    animals.forEach(animal => {
        const d = animal.userData;
        d.stateTimer += dt;

        // State machine for animal behavior
        switch (d.state) {
            case 'idle':
                if (d.stateTimer > 2 + Math.random() * 4) {
                    d.state = 'walking';
                    d.stateTimer = 0;

                    // Pick new target based on confinement
                    if (d.confined) {
                        // Stay within home radius
                        const angle = Math.random() * Math.PI * 2;
                        const dist = Math.random() * d.roamRadius;
                        d.targetX = d.homeX + Math.cos(angle) * dist;
                        d.targetZ = d.homeZ + Math.sin(angle) * dist;
                    } else {
                        // Wild animals - larger roaming area
                        const angle = Math.random() * Math.PI * 2;
                        const dist = 5 + Math.random() * d.roamRadius;
                        d.targetX = d.homeX + Math.cos(angle) * dist;
                        d.targetZ = d.homeZ + Math.sin(angle) * dist;
                    }
                }
                resetAnimalLegs(animal);
                break;

            case 'walking':
                const dx = d.targetX - animal.position.x;
                const dz = d.targetZ - animal.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                if (dist < 0.5 || d.stateTimer > 5) {
                    d.state = 'idle';
                    d.stateTimer = 0;
                    resetAnimalLegs(animal);
                } else {
                    // Move towards target
                    const moveX = (dx / dist) * d.speed;
                    const moveZ = (dz / dist) * d.speed;

                    // Velocity-based steering for smoother movement
                    d.velocityX = (d.velocityX || 0) * 0.9 + moveX * 0.1;
                    d.velocityZ = (d.velocityZ || 0) * 0.9 + moveZ * 0.1;

                    let newX = animal.position.x + d.velocityX;
                    let newZ = animal.position.z + d.velocityZ;

                    // Boundary checking for confined animals
                    if (d.confined && isAnimalInFarm(d.homeX, d.homeZ)) {
                        newX = Math.max(farmZone.minX + 1, Math.min(farmZone.maxX - 1, newX));
                        newZ = Math.max(farmZone.minZ + 1, Math.min(farmZone.maxZ - 1, newZ));
                    }

                    animal.position.x = newX;
                    animal.position.z = newZ;
                    animal.position.y = getHeightAt(newX, newZ);

                    // Face movement direction
                    animal.rotation.y = Math.atan2(d.velocityX, d.velocityZ);

                    animateAnimalLegs(animal, dt);
                }
                break;
        }

        // Special behavior: Frog jumping
        if (d.type === 'frog') {
            updateFrogBehavior(animal, d, dt, now);
        }
    });
}

/**
 * Handle frog-specific behavior (jumping)
 * @param {THREE.Group} frog - The frog group
 * @param {Object} d - userData
 * @param {number} dt - Delta time
 * @param {number} now - Current time
 */
function updateFrogBehavior(frog, d, dt, now) {
    d.jumpTimer = (d.jumpTimer || 0) + dt;

    if (d.isJumping) {
        // Continue jump arc
        d.jumpProgress += dt * 2;
        if (d.jumpProgress >= 1) {
            // Land
            d.isJumping = false;
            d.jumpProgress = 0;
            frog.position.y = getHeightAt(frog.position.x, frog.position.z);
        } else {
            // Parabolic arc
            const jumpHeight = 0.8;
            const arc = Math.sin(d.jumpProgress * Math.PI) * jumpHeight;
            const baseY = getHeightAt(frog.position.x, frog.position.z);
            frog.position.y = baseY + arc;

            // Move forward during jump
            const dx = d.targetX - frog.position.x;
            const dz = d.targetZ - frog.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist > 0.1) {
                frog.position.x += (dx / dist) * d.speed * 2;
                frog.position.z += (dz / dist) * d.speed * 2;
            }
        }
    } else if (d.jumpTimer > 3 + Math.random() * 5) {
        // Start a new jump
        d.jumpTimer = 0;
        d.isJumping = true;
        d.jumpProgress = 0;

        // Pick random jump direction
        const angle = Math.random() * Math.PI * 2;
        const dist = 1 + Math.random() * 2;
        d.targetX = frog.position.x + Math.cos(angle) * dist;
        d.targetZ = frog.position.z + Math.sin(angle) * dist;

        // Face jump direction
        frog.rotation.y = angle;
    }
}
