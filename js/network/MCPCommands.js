/**
 * MCPCommands - Handle MCP protocol commands
 */

import { state } from '../core/State.js';
import { AgentState, FieldTypes } from '../config/index.js';
import { createField, updateFieldProgress, assignAgentToField, releaseAgentFromField } from '../fields/index.js';
import { createAgent } from '../entities/index.js';
import { createFileBlock, showAgentText, hideAgentText } from '../entities/index.js';
import { createHouse } from '../buildings/index.js';
import { addSmokeToHouse } from '../atmosphere.js';

// Store references that need to be set from main
let sceneRef = null;
let controlsRef = null;
let smokeSystemRef = null;
let updateStatsRef = null;
let fieldSignsRef = [];

/**
 * Initialize MCP commands with required references
 * @param {Object} refs - Object containing scene, controls, smokeSystem, updateStats
 */
export function initMCPCommands(refs) {
    sceneRef = refs.scene;
    controlsRef = refs.controls;
    smokeSystemRef = refs.smokeSystem;
    updateStatsRef = refs.updateStats;
    fieldSignsRef = refs.fieldSigns || [];
}

/**
 * Start harvesting loop for an agent on a mature field
 * @param {THREE.Group} agent - The agent
 * @param {THREE.Group} field - The field
 */
function startHarvesting(agent, field) {
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
 * Handle an MCP command
 * @param {string} type - Command type
 * @param {Object} payload - Command payload
 */
export function handleMCPCommand(type, payload) {
    console.log('MCP Command:', type, payload);

    const agents = state.agents;
    const fields = state.fields;
    const houses = state.houses;

    switch (type) {
        case 'create_house': {
            const house = addHouseInternal();
            break;
        }

        case 'create_agent': {
            const hq = state.headquarters;
            if (!hq) break;
            const newAgent = createAgent(sceneRef, hq);
            if (newAgent && payload.id) {
                newAgent.userData.id = payload.id;
                newAgent.userData.name = payload.name || newAgent.userData.name;
            }
            if (updateStatsRef) updateStatsRef();
            break;
        }

        case 'create_field': {
            const fieldType = payload.type || payload.fieldType || FieldTypes.VEGETABLE;
            const newField = createField(sceneRef, fieldType, payload.x, payload.z);
            if (newField) {
                if (payload.id) {
                    newField.userData.id = payload.id;
                }
                console.log(`MCP created field #${newField.userData.id} type ${fieldType}`);
                if (updateStatsRef) updateStatsRef();
            }
            break;
        }

        case 'start_task': {
            const taskAgent = agents.find(a => a.userData.id === payload.agentId);
            const taskField = payload.fieldId ? fields.find(f => f.userData.id === payload.fieldId) : null;

            if (taskAgent) {
                if (taskField) {
                    assignAgentToField(taskAgent, taskField, payload.taskName);
                    taskAgent.userData.state = AgentState.WORKING;
                    taskAgent.userData.stateTimer = 0;
                    console.log(`Agent ${payload.agentId} assigned to field ${payload.fieldId}`);
                } else {
                    taskAgent.userData.state = AgentState.WORKING;
                    taskAgent.userData.currentTask = payload.taskName;
                    taskAgent.userData.stateTimer = 0;
                }
            } else {
                console.warn('Agent not found for start_task:', payload.agentId);
            }
            break;
        }

        case 'end_task': {
            const agent = agents.find(a => a.userData.id === payload.agentId) || agents[payload.agentId - 1];
            if (agent) {
                if (agent.userData.assignedField) {
                    releaseAgentFromField(agent);
                }
                agent.userData.state = payload.success !== false ? AgentState.SUCCESS : AgentState.ERROR;
                agent.userData.stateTimer = 3;
            }
            if (updateStatsRef) updateStatsRef();
            break;
        }

        case 'set_field_progress': {
            setFieldProgressInternal(payload.fieldId, payload.progress, payload.agentId);
            break;
        }

        case 'create_field_sign': {
            createFieldSignInternal(payload.fieldId, payload.summary);
            break;
        }

        case 'set_agent_state': {
            const agent = agents.find(a => a.userData.id === payload.agentId) || agents[payload.agentId - 1];
            if (agent) {
                agent.userData.state = payload.state;
                if (payload.taskName) {
                    agent.userData.currentTask = payload.taskName;
                }
                agent.userData.stateTimer = 3;
            }
            break;
        }

        case 'create_file': {
            if (payload.agentId) {
                const fileAgent = agents.find(a => a.userData.id === payload.agentId) || agents[payload.agentId - 1];
                if (fileAgent && fileAgent.userData.house) {
                    createFileBlock(sceneRef, fileAgent.userData.house, payload.fileName);
                }
            } else if (houses.length > 0) {
                const randomHouse = houses[Math.floor(Math.random() * houses.length)];
                createFileBlock(sceneRef, randomHouse, payload.fileName);
            }
            break;
        }

        case 'move_camera': {
            if (!controlsRef) break;
            if (payload.agentId) {
                const targetAgent = agents.find(a => a.userData.id === payload.agentId) || agents[payload.agentId - 1];
                if (targetAgent) {
                    controlsRef.target.set(targetAgent.position.x, targetAgent.position.y, targetAgent.position.z);
                }
            } else if (payload.fieldId) {
                const targetField = fields.find(f => f.userData.id === payload.fieldId) || fields[payload.fieldId - 1];
                if (targetField) {
                    controlsRef.target.set(targetField.position.x, targetField.position.y, targetField.position.z);
                }
            } else if (payload.x !== undefined && payload.z !== undefined) {
                controlsRef.target.set(payload.x, 0, payload.z);
            }
            break;
        }

        case 'sync':
            console.log('Received state sync:', payload);
            break;

        case 'show_agent_text': {
            const textAgent = agents.find(a => a.userData.id === payload.agentId);
            if (textAgent) {
                showAgentText(textAgent, payload.text);
                console.log(`Showing text "${payload.text}" for agent`, textAgent.userData.id);
            } else {
                console.warn('Agent not found for show_agent_text:', payload.agentId);
            }
            break;
        }

        case 'hide_agent_text': {
            const textAgent = agents.find(a => a.userData.id === payload.agentId);
            if (textAgent) {
                hideAgentText(textAgent);
                console.log('Hiding text for agent', textAgent.userData.id);
            }
            break;
        }
    }

    if (updateStatsRef) updateStatsRef();
}

/**
 * Internal helper to add a house
 */
function addHouseInternal() {
    // Import findPosition from world or use state
    const pos = findPositionInternal(8);
    const house = createHouse(sceneRef, pos.x, pos.z);
    if (house.userData.hasChimney && smokeSystemRef) {
        addSmokeToHouse(smokeSystemRef, house);
    }
    if (updateStatsRef) updateStatsRef();
    return house;
}

/**
 * Find a valid position (simplified version)
 */
function findPositionInternal(minDist) {
    const farmZone = { minX: -20, maxX: 20, minZ: -20, maxZ: 20 };
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
        if (!state.collidesWithHouses(x, z, minDist)) {
            return { x, z };
        }
    }
    return { x: 30, z: 30 };
}

/**
 * Set field progress and potentially start harvesting
 */
function setFieldProgressInternal(fieldId, progress, agentId = null) {
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
 * Create a sign in front of a field
 */
function createFieldSignInternal(fieldId, summaryText) {
    const fields = state.fields;
    const field = fields.find(f => f.userData.id === fieldId) || fields[fieldId - 1];
    if (!field) {
        console.error('Field not found for sign:', fieldId);
        return;
    }

    // Import THREE dynamically or pass it
    import('three').then(THREE => {
        const signX = field.userData.x;
        const signZ = field.userData.z + 4;

        // Create sign post
        const postGeometry = new THREE.CylinderGeometry(0.08, 0.1, 1.2, 8);
        const postMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.set(signX, 0.6, signZ);
        post.castShadow = true;

        // Create sign board
        const boardGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.08);
        const boardMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
        const board = new THREE.Mesh(boardGeometry, boardMaterial);
        board.position.set(0, 0.45, 0);
        board.castShadow = true;
        post.add(board);

        // Create text
        const textCanvas = document.createElement('canvas');
        textCanvas.width = 256;
        textCanvas.height = 128;
        const ctx = textCanvas.getContext('2d');

        ctx.fillStyle = '#DEB887';
        ctx.fillRect(0, 0, 256, 128);

        ctx.fillStyle = '#228B22';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('\u2713', 128, 45);

        const shortText = (summaryText || 'Done').substring(0, 20) + (summaryText && summaryText.length > 20 ? '...' : '');
        ctx.fillStyle = '#4a3728';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(shortText, 128, 90);

        const textTexture = new THREE.CanvasTexture(textCanvas);
        const textGeometry = new THREE.PlaneGeometry(0.75, 0.4);
        const textMaterial = new THREE.MeshBasicMaterial({ map: textTexture });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(0, 0, 0.05);
        board.add(textMesh);

        post.userData = {
            isFieldSign: true,
            fieldId: fieldId,
            summary: summaryText || 'Task completed',
            field: field
        };

        sceneRef.add(post);
        state.addFieldSign(post);
        console.log(`Created sign for field #${fieldId}: "${summaryText}"`);
    });
}
