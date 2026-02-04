/**
 * Engine - Public API for the Agent Village
 * Provides functions to add houses, agents, fields, etc.
 */

import { state } from './State.js';
import { AgentState, FieldTypes, farmZone } from '../config/index.js';
import { createHouse } from '../buildings/index.js';
import { createAgent } from '../entities/index.js';
import { createField, updateFieldProgress, assignAgentToField, releaseAgentFromField, getFieldWorkPosition } from '../fields/index.js';
import { addSmokeToHouse } from '../atmosphere.js';

// References set during initialization
let sceneRef = null;
let smokeSystemRef = null;
let updateStatsCallback = null;

/**
 * Initialize the engine with required references
 * @param {Object} refs - Object containing scene, smokeSystem
 * @param {Function} updateStats - Callback to update stats UI
 */
export function initEngine(refs, updateStats) {
    sceneRef = refs.scene;
    smokeSystemRef = refs.smokeSystem;
    updateStatsCallback = updateStats;
}

/**
 * Find a valid position for placing objects
 * @param {number} minSpacing - Minimum spacing from other objects
 * @returns {{x: number, z: number}} Position
 */
export function findPosition(minSpacing) {
    for (let attempt = 0; attempt < 50; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 25 + Math.random() * 60;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;

        // Skip if inside farm
        if (x > farmZone.minX && x < farmZone.maxX &&
            z > farmZone.minZ && z < farmZone.maxZ) {
            continue;
        }

        // Check collision with houses
        if (!state.collidesWithHouses(x, z, minSpacing)) {
            return { x, z };
        }
    }
    return { x: 30, z: 30 };
}

/**
 * Add a new house to the scene
 * @returns {THREE.Group} The created house
 */
export function addHouse() {
    const pos = findPosition(8);
    const house = createHouse(sceneRef, pos.x, pos.z);

    // Add smoke only to houses that have chimneys
    if (house.userData.hasChimney && smokeSystemRef) {
        addSmokeToHouse(smokeSystemRef, house);
    }

    if (updateStatsCallback) updateStatsCallback();
    return house;
}

/**
 * Add a new agent to the scene
 * @returns {THREE.Group} The created agent
 */
export function addAgent() {
    const hq = state.headquarters;
    if (!hq) return null;

    const agent = createAgent(sceneRef, hq);
    if (updateStatsCallback) updateStatsCallback();
    return agent;
}

/**
 * Add a new field with an assigned agent
 * @param {string} [fieldType=FieldTypes.VEGETABLE] - Type of field
 * @param {number|null} [x=null] - X position (auto if null)
 * @param {number|null} [z=null] - Z position (auto if null)
 * @param {string|null} [taskName=null] - Task name for the agent
 * @returns {{field: THREE.Group, agent: THREE.Group}|null}
 */
export function addField(fieldType = FieldTypes.VEGETABLE, x = null, z = null, taskName = null) {
    const field = createField(sceneRef, fieldType, x, z);
    if (!field) {
        console.warn('Could not create field (collision or other issue)');
        return null;
    }

    // Auto-create an agent for this field
    const agent = createAgent(sceneRef, state.headquarters);
    const task = taskName || `Cultivate ${fieldType}`;

    // Assign agent to field and start working
    assignAgentToField(agent, field, task);
    agent.userData.state = AgentState.WORKING;
    agent.userData.stateTimer = 0;

    console.log(`Created field #${field.userData.id} with agent #${agent.userData.id}`);

    if (updateStatsCallback) updateStatsCallback();
    return { field, agent };
}

/**
 * Start a field task for an existing agent
 * @param {number} agentId - Agent ID
 * @param {number} fieldId - Field ID
 * @param {string} taskName - Task name
 * @returns {{agent: THREE.Group, field: THREE.Group}|null}
 */
export function startFieldTask(agentId, fieldId, taskName) {
    const agents = state.agents;
    const fields = state.fields;

    const agent = agents.find(a => a.userData.id === agentId) || agents[agentId - 1];
    const field = fields.find(f => f.userData.id === fieldId) || fields[fieldId - 1];

    if (!agent || !field) {
        console.error('Agent or field not found:', agentId, fieldId);
        return null;
    }

    assignAgentToField(agent, field, taskName);
    agent.userData.state = AgentState.WORKING;
    agent.userData.stateTimer = 0;

    return { agent, field };
}

/**
 * Set field progress and potentially start harvesting
 * @param {number} fieldId - Field ID
 * @param {number} progress - Progress percentage (0-100)
 * @param {number|null} [agentId=null] - Agent ID for harvesting
 */
export function setFieldProgress(fieldId, progress, agentId = null) {
    const fields = state.fields;
    const agents = state.agents;

    const field = fields.find(f => f.userData.id === fieldId) || fields[fieldId - 1];
    if (!field) {
        console.error('Field not found:', fieldId);
        return;
    }

    updateFieldProgress(field, progress);

    // If progress is 100%, start harvesting loop
    if (progress >= 100) {
        let agent = field.userData.assignedAgent;
        if (!agent && agentId) {
            agent = agents.find(a => a.userData.id === agentId) || agents[agentId - 1];
            if (agent) {
                field.userData.assignedAgent = agent;
                agent.userData.assignedField = field;
            }
        }
        if (agent) {
            startHarvesting(agent, field);
        } else {
            console.error('No agent found for harvesting!');
        }
    }
}

/**
 * Start harvesting loop for an agent on a mature field
 * @param {THREE.Group} agent - The agent
 * @param {THREE.Group} field - The field
 */
export function startHarvesting(agent, field) {
    const d = agent.userData;
    d.state = AgentState.HARVESTING;
    d.harvestField = field;
    d.harvestPhase = 'going_to_field';
    d.harvestTimer = 0;
    d.carrying = false;
    d.stateTimer = 0;
    d.assignedField = field;
}

/**
 * Stop harvesting and release agent
 * @param {number} agentId - Agent ID
 */
export function stopHarvesting(agentId) {
    const agents = state.agents;
    const agent = agents.find(a => a.userData.id === agentId) || agents[agentId - 1];
    if (!agent) return;

    const d = agent.userData;
    d.state = AgentState.SUCCESS;
    d.stateTimer = 3;
    d.harvestField = null;
    d.harvestPhase = 'idle';
    d.harvestTimer = 0;
    d.carrying = false;

    if (d.assignedField) {
        releaseAgentFromField(agent);
    }
}

/**
 * End a field task
 * @param {number} agentId - Agent ID
 * @param {boolean} [success=true] - Whether task succeeded
 */
export function endFieldTask(agentId, success = true) {
    const agents = state.agents;
    const agent = agents.find(a => a.userData.id === agentId) || agents[agentId - 1];
    if (!agent) return;

    if (agent.userData.assignedField) {
        releaseAgentFromField(agent);
    }

    agent.userData.state = success ? AgentState.SUCCESS : AgentState.ERROR;
    agent.userData.stateTimer = 3;
}

/**
 * Debug function: mature all fields to 100%
 */
export function matureAllFields() {
    const fields = state.fields;
    fields.forEach(field => {
        setFieldProgress(field.userData.id, 100);
    });
    console.log(`Matured ${fields.length} fields to 100%`);
}

/**
 * Toggle UI visibility
 */
export function toggleUI() {
    document.body.classList.toggle('ui-hidden');
}

/**
 * Expose public functions to window for UI buttons
 */
export function exposeToWindow() {
    window.addHouse = addHouse;
    window.addAgent = addAgent;
    window.addField = addField;
    window.startFieldTask = startFieldTask;
    window.setFieldProgress = setFieldProgress;
    window.endFieldTask = endFieldTask;
    window.matureAllFields = matureAllFields;
    window.startHarvesting = startHarvesting;
    window.stopHarvesting = stopHarvesting;
    window.toggleUI = toggleUI;
}
