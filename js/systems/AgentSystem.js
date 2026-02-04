/**
 * AgentSystem - Handles agent states, movement, animation, and harvesting
 */

import { state } from '../core/State.js';
import { AgentState } from '../config/index.js';
import { getHeightAt } from '../utils/index.js';
import { getFieldWorkPosition } from '../fields/index.js';

/**
 * Get avoidance force from nearby houses
 * @param {number} x - Agent X position
 * @param {number} z - Agent Z position
 * @returns {{x: number, z: number}} Avoidance force
 */
function getHouseAvoidance(x, z) {
    const houses = state.houses;
    const hq = state.headquarters;
    let avoidX = 0;
    let avoidZ = 0;
    const avoidDist = 5;

    // Avoid houses
    houses.forEach(house => {
        const dx = x - house.userData.x;
        const dz = z - house.userData.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < avoidDist && dist > 0.1) {
            const force = (avoidDist - dist) / avoidDist;
            avoidX += (dx / dist) * force * 1.5;
            avoidZ += (dz / dist) * force * 1.5;
        }
    });

    // Avoid headquarters
    if (hq) {
        const dx = x - hq.position.x;
        const dz = z - hq.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < avoidDist * 1.5 && dist > 0.1) {
            const force = (avoidDist * 1.5 - dist) / (avoidDist * 1.5);
            avoidX += (dx / dist) * force * 2;
            avoidZ += (dz / dist) * force * 2;
        }
    }

    return { x: avoidX, z: avoidZ };
}

/**
 * Get separation force from other agents
 * @param {THREE.Group} agent - The agent to check
 * @returns {{x: number, z: number}} Separation force
 */
function getAgentSeparation(agent) {
    const agents = state.agents;
    let sepX = 0;
    let sepZ = 0;
    const sepDist = 2;

    agents.forEach(other => {
        if (other === agent) return;

        const dx = agent.position.x - other.position.x;
        const dz = agent.position.z - other.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < sepDist && dist > 0.1) {
            const force = (sepDist - dist) / sepDist;
            sepX += (dx / dist) * force;
            sepZ += (dz / dist) * force;
        }
    });

    return { x: sepX, z: sepZ };
}

/**
 * Update all agents in the scene
 * @param {number} dt - Delta time in seconds
 * @param {number} now - Current time in milliseconds
 */
export function updateAgentSystem(dt, now) {
    const agents = state.agents;

    agents.forEach(agent => {
        const d = agent.userData;
        d.moveTimer += dt;

        // State timer countdown
        if (d.stateTimer > 0) {
            d.stateTimer -= dt;
            if (d.stateTimer <= 0) {
                d.state = AgentState.IDLE;
                d.currentTask = null;
            }
        }

        // Update particles
        Object.values(d.particles).forEach(p => p.update(dt));

        // Handle particle effects based on state
        updateParticles(agent, d);

        // Handle working in field
        if (d.state === AgentState.WORKING && d.assignedField) {
            updateWorkingState(agent, d, dt);
        } else {
            d.particles.work.stop();
            // Reset tool position when not working
            if (d.tool && d.state !== AgentState.HARVESTING) {
                d.tool.rotation.x = 0;
            }
            if (d.arms && d.state !== AgentState.HARVESTING) {
                d.arms.forEach(arm => arm.rotation.x = 0);
            }
        }

        // Handle harvesting
        if (d.state === AgentState.HARVESTING && d.harvestField) {
            updateHarvestingState(agent, d, dt);
        } else {
            // Reset carry mesh when not harvesting
            if (d.carryMesh) {
                d.carryMesh.visible = false;
            }
        }

        // Random movement when idle
        if (d.state === AgentState.IDLE && !d.assignedField && !d.harvestField && d.moveTimer > 3 + Math.random() * 4) {
            d.moveTimer = 0;
            const house = d.house;
            const range = 8;
            d.targetX = house.userData.x + (Math.random() - 0.5) * range * 2;
            d.targetZ = house.userData.z + (Math.random() - 0.5) * range * 2;
        }

        // Move towards target with collision avoidance
        updateMovement(agent, d, dt);
    });
}

/**
 * Update particle effects based on agent state
 * @param {THREE.Group} agent - The agent
 * @param {Object} d - userData
 */
function updateParticles(agent, d) {
    if (d.state === AgentState.THINKING) {
        d.particles.thinking.start(agent.position.x, agent.position.y, agent.position.z, 15);
    } else {
        d.particles.thinking.stop();
    }

    if (d.state === AgentState.SUCCESS) {
        d.particles.success.start(agent.position.x, agent.position.y, agent.position.z, 25);
    } else {
        d.particles.success.stop();
    }

    if (d.state === AgentState.ERROR) {
        d.particles.error.start(agent.position.x, agent.position.y, agent.position.z, 20);
    } else {
        d.particles.error.stop();
    }
}

/**
 * Update agent working in field animation
 * @param {THREE.Group} agent - The agent
 * @param {Object} d - userData
 * @param {number} dt - Delta time
 */
function updateWorkingState(agent, d, dt) {
    d.fieldWorkTimer += dt;
    d.workAnimationPhase += dt * 4;

    // Emit work particles
    d.particles.work.start(agent.position.x, agent.position.y, agent.position.z, 8);

    // Move between work positions periodically
    if (d.fieldWorkTimer > 2 + Math.random() * 2) {
        d.fieldWorkTimer = 0;
        const newPos = getFieldWorkPosition(d.assignedField);
        d.targetX = newPos.x;
        d.targetZ = newPos.z;
    }

    // Work animation: bobbing motion
    const workBob = Math.sin(d.workAnimationPhase) * 0.1;
    d.head.position.y = 1.4 + workBob;

    // Tool animation: swinging motion
    if (d.tool) {
        const swing = Math.sin(d.workAnimationPhase * 1.5) * 0.6;
        d.tool.rotation.x = swing;
    }

    // Arms animation while working
    if (d.arms && d.arms.length >= 2) {
        const armSwing = Math.sin(d.workAnimationPhase * 1.5) * 0.3;
        d.arms[1].rotation.x = armSwing;
    }
}

/**
 * Update agent harvesting loop
 * @param {THREE.Group} agent - The agent
 * @param {Object} d - userData
 * @param {number} dt - Delta time
 */
function updateHarvestingState(agent, d, dt) {
    const field = d.harvestField;
    const homePos = d.house
        ? { x: d.house.userData.x, z: d.house.userData.z }
        : { x: -35, z: 0 };

    d.harvestTimer += dt;

    // Update carry mesh visibility
    if (d.carryMesh) {
        d.carryMesh.visible = d.carrying;
    }

    // Distance to current target
    const distToTarget = Math.hypot(
        agent.position.x - d.targetX,
        agent.position.z - d.targetZ
    );

    switch (d.harvestPhase) {
        case 'going_to_field':
            if (!d.harvestTargetSet) {
                const workPos = getFieldWorkPosition(field);
                d.targetX = workPos.x;
                d.targetZ = workPos.z;
                d.harvestTargetSet = true;
                d.collectDuration = 2 + Math.random() * 4;
            }
            if (distToTarget < 1.5) {
                d.harvestPhase = 'collecting';
                d.harvestTimer = 0;
                d.workAnimationPhase = 0;
                d.harvestTargetSet = false;
            }
            break;

        case 'collecting':
            d.workAnimationPhase += dt * 4;

            // Work animation
            const workBob = Math.sin(d.workAnimationPhase) * 0.1;
            d.head.position.y = 1.4 + workBob;
            if (d.tool) d.tool.rotation.x = Math.sin(d.workAnimationPhase * 1.5) * 0.6;
            if (d.arms && d.arms.length >= 2) {
                d.arms[1].rotation.x = Math.sin(d.workAnimationPhase * 1.5) * 0.3;
            }

            // Emit work particles
            d.particles.work.start(agent.position.x, agent.position.y, agent.position.z, 8);

            if (d.harvestTimer > d.collectDuration) {
                d.harvestPhase = 'returning';
                d.carrying = true;
                d.harvestTimer = 0;
                d.harvestTargetSet = false;
                d.particles.work.stop();
            }
            break;

        case 'returning':
            if (!d.harvestTargetSet) {
                d.targetX = homePos.x + (Math.random() - 0.5) * 4;
                d.targetZ = homePos.z + (Math.random() - 0.5) * 4;
                d.harvestTargetSet = true;
                d.unloadDuration = 0.5 + Math.random() * 1.5;
            }
            if (distToTarget < 2) {
                d.harvestPhase = 'unloading';
                d.harvestTimer = 0;
                d.harvestTargetSet = false;
            }
            break;

        case 'unloading':
            if (d.harvestTimer > d.unloadDuration) {
                d.carrying = false;
                d.harvestPhase = 'going_to_field';
                d.harvestTimer = 0;
                d.harvestTargetSet = false;
            }
            break;
    }
}

/**
 * Update agent movement with collision avoidance
 * @param {THREE.Group} agent - The agent
 * @param {Object} d - userData
 * @param {number} dt - Delta time
 */
function updateMovement(agent, d, dt) {
    let dx = d.targetX - agent.position.x;
    let dz = d.targetZ - agent.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 0.2) {
        // Normalize direction to target
        const dirX = dx / dist;
        const dirZ = dz / dist;

        // Get avoidance forces
        const avoidance = getHouseAvoidance(agent.position.x, agent.position.z);
        const separation = getAgentSeparation(agent);

        // Combine forces
        let moveX = dirX + avoidance.x + separation.x;
        let moveZ = dirZ + avoidance.z + separation.z;

        // Normalize combined movement
        const moveMag = Math.sqrt(moveX * moveX + moveZ * moveZ);
        if (moveMag > 0.01) {
            moveX /= moveMag;
            moveZ /= moveMag;
        }

        // Apply movement
        agent.position.x += moveX * d.speed;
        agent.position.z += moveZ * d.speed;
        agent.position.y = getHeightAt(agent.position.x, agent.position.z);

        // Face movement direction
        if (moveMag > 0.01) {
            agent.rotation.y = Math.atan2(moveX, moveZ);
        }

        // Walking animation
        d.walkCycle += dt * 12;
        const legSwing = Math.sin(d.walkCycle) * 0.4;
        d.legs[0].rotation.x = legSwing;
        d.legs[1].rotation.x = -legSwing;

        d.bobCycle += dt * 15;
        d.head.position.y = 1.4 + Math.sin(d.bobCycle) * 0.03;
    } else {
        // Stop walking animation
        d.legs.forEach(leg => leg.rotation.x = 0);
    }
}
