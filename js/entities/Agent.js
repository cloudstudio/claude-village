/**
 * Agent - Agent creation and management
 */

import * as THREE from 'three';
import { agentColors, AgentState } from '../config/index.js';
import { getHeightAt } from '../utils/index.js';
import { state } from '../core/State.js';
import { ParticleSystem } from './ParticleSystem.js';

/**
 * Create an agent at a house
 * @param {THREE.Scene} scene - The scene to add to
 * @param {THREE.Group} house - The house the agent belongs to
 * @returns {THREE.Group} The agent group
 */
export function createAgent(scene, house) {
    const colorHex = agentColors[Math.floor(Math.random() * agentColors.length)];

    const mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.3,
        metalness: 0.6,
        envMapIntensity: 1.0
    });

    const legMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.8,
        metalness: 0.2
    });

    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.7, 0.3);
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.y = 0.85;
    body.castShadow = true;
    group.add(body);

    // Backpack
    const pack = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.4, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    pack.position.set(0, 0.9, -0.2);
    group.add(pack);

    // Head
    const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.35, 0.35),
        new THREE.MeshStandardMaterial({ color: 0xffdcb1, roughness: 0.7 })
    );
    head.position.y = 1.4;
    head.castShadow = true;
    group.add(head);

    // Hat
    const hat = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.05, 8),
        mat
    );
    hat.position.y = 1.6;
    group.add(hat);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.04, 0.02);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
    eye1.position.set(-0.1, 1.45, 0.18);
    group.add(eye1);
    const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
    eye2.position.set(0.1, 1.45, 0.18);
    group.add(eye2);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.15, 0.5, 0.15);
    const leg1 = new THREE.Mesh(legGeo, legMat);
    leg1.position.set(-0.12, 0.25, 0);
    group.add(leg1);
    const leg2 = new THREE.Mesh(legGeo, legMat);
    leg2.position.set(0.12, 0.25, 0);
    group.add(leg2);

    // Arms
    const armMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3 });
    const armGeo = new THREE.BoxGeometry(0.12, 0.45, 0.12);
    const arm1 = new THREE.Mesh(armGeo, armMat);
    arm1.position.set(-0.35, 0.85, 0);
    group.add(arm1);
    const arm2 = new THREE.Mesh(armGeo, armMat);
    arm2.position.set(0.35, 0.85, 0);
    group.add(arm2);

    // Tool (hoe/azada) - held in right hand
    const toolGroup = new THREE.Group();

    // Handle (wooden stick)
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
    const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6),
        handleMat
    );
    handle.position.y = 0.4;
    toolGroup.add(handle);

    // Tool head (metal part)
    const toolHeadMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8, roughness: 0.3 });
    const toolHead = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.06, 0.08),
        toolHeadMat
    );
    toolHead.position.set(0.08, 0.8, 0);
    toolGroup.add(toolHead);

    // Position tool at right hand
    toolGroup.position.set(0.4, 0.6, 0.15);
    toolGroup.rotation.z = -0.3;  // Slight angle
    group.add(toolGroup);

    // Carry basket/sack for harvesting
    const carryGeo = new THREE.BoxGeometry(0.3, 0.2, 0.3);
    const carryMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
    const carryMesh = new THREE.Mesh(carryGeo, carryMat);
    carryMesh.position.set(0, 1.0, -0.25);  // On the back
    carryMesh.visible = false;  // Hidden by default
    group.add(carryMesh);

    // Position
    const door = house.userData.doorPosition;
    const agentY = getHeightAt(door.x, door.z);
    group.position.set(door.x, agentY, door.z);
    group.scale.setScalar(1.3);

    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const agentCount = state.agents.length;

    group.userData = {
        id: agentId,
        name: `Agent ${agentCount + 1}`,
        house,
        head,
        legs: [leg1, leg2],
        arms: [arm1, arm2],
        tool: toolGroup,
        carryMesh,
        colorHex,
        state: AgentState.IDLE,
        currentTask: null,
        targetX: group.position.x,
        targetZ: group.position.z,
        speed: (0.04 + Math.random() * 0.02) * 2.6,  // 130% faster
        moveTimer: Math.random() * 3,
        walkCycle: 0,
        bobCycle: 0,
        stateTimer: 0,
        // Field work properties
        assignedField: null,
        fieldWorkTimer: 0,
        fieldWorkPosition: null,
        workAnimationPhase: 0,
        // Harvesting state
        harvestPhase: 'idle',        // 'idle' | 'going_to_field' | 'collecting' | 'returning' | 'unloading'
        harvestField: null,          // Field assigned for harvesting
        harvestTimer: 0,             // Timer for harvest phases
        harvestTargetSet: false,     // Flag to set target only once per phase
        collectDuration: 3,          // Random duration for collecting
        unloadDuration: 1,           // Random duration for unloading
        carrying: false,             // If carrying harvested goods
        particles: {
            thinking: new ParticleSystem(scene, 30, 0xffdd00, 0.12),
            success: new ParticleSystem(scene, 50, 0x00ff88, 0.1),
            error: new ParticleSystem(scene, 40, 0xff4444, 0.1),
            work: new ParticleSystem(scene, 20, 0x8bc34a, 0.08)  // Green particles for work
        }
    };

    scene.add(group);
    state.addAgent(group);
    house.userData.agents.push(group);
    return group;
}
