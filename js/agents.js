import * as THREE from 'three';
import { agentColors, AgentState } from './config.js';
import { materials } from './materials.js';
import { getHeightAt, agents, files } from './terrain.js';

// ==================== PARTICLE SYSTEM ====================
export class ParticleSystem {
    constructor(scene, count, color, size = 0.1) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            velocities.push({ x: 0, y: 0, z: 0, life: 0 });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: color,
            size: size,
            transparent: true,
            opacity: 0.8
        });

        this.mesh = new THREE.Points(geometry, material);
        this.velocities = velocities;
        this.positions = positions;
        this.active = false;
        this.emitRate = 0;
        this.emitTimer = 0;
        this.basePosition = new THREE.Vector3();
        scene.add(this.mesh);
    }

    emit(x, y, z, vx, vy, vz) {
        for (let i = 0; i < this.velocities.length; i++) {
            if (this.velocities[i].life <= 0) {
                this.positions[i * 3] = x + (Math.random() - 0.5) * 0.3;
                this.positions[i * 3 + 1] = y;
                this.positions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.3;

                this.velocities[i] = {
                    x: vx + (Math.random() - 0.5) * 0.5,
                    y: vy + Math.random() * 0.5,
                    z: vz + (Math.random() - 0.5) * 0.5,
                    life: 1
                };
                break;
            }
        }
    }

    update(dt) {
        for (let i = 0; i < this.velocities.length; i++) {
            const v = this.velocities[i];
            if (v.life > 0) {
                this.positions[i * 3] += v.x * dt;
                this.positions[i * 3 + 1] += v.y * dt;
                this.positions[i * 3 + 2] += v.z * dt;
                v.y -= dt * 2;
                v.life -= dt * 1.5;
            } else {
                this.positions[i * 3 + 1] = -100;
            }
        }

        this.mesh.geometry.attributes.position.needsUpdate = true;

        if (this.active && this.emitRate > 0) {
            this.emitTimer += dt;
            while (this.emitTimer > 1 / this.emitRate) {
                this.emitTimer -= 1 / this.emitRate;
                this.emit(this.basePosition.x, this.basePosition.y + 1.8, this.basePosition.z, 0, 2, 0);
            }
        }
    }

    start(x, y, z, rate) {
        this.basePosition.set(x, y, z);
        this.emitRate = rate;
        this.active = true;
    }

    stop() {
        this.active = false;
        this.emitRate = 0;
    }
}

// ==================== AGENT CREATION ====================
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

    group.userData = {
        id: agentId,
        name: `Agent ${agents.length + 1}`,
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
        speed: (0.04 + Math.random() * 0.02) * 2,  // 100% faster
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
    agents.push(group);
    house.userData.agents.push(group);
    return group;
}

// ==================== FLOATING TEXT SPRITE ====================
function createTextCanvas(text, fontSize = 48, fontFamily = 'Arial', color = '#ffffff', bgColor = 'rgba(0,0,0,0.7)') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Measure text
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;

    // Set canvas size with padding
    const padding = 20;
    canvas.width = textWidth + padding * 2;
    canvas.height = fontSize + padding * 2;

    // Draw background
    ctx.fillStyle = bgColor;
    const radius = 10;
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, radius);
    ctx.fill();

    // Draw text
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    return canvas;
}

export function showAgentText(agent, text) {
    // Remove existing text if any
    hideAgentText(agent);

    const canvas = createTextCanvas(text, 24);  // Smaller font
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
    });

    const sprite = new THREE.Sprite(material);

    // Scale based on canvas aspect ratio - HALF SIZE
    const aspect = canvas.width / canvas.height;
    const scale = 1.25;  // Was 2.5, now half
    sprite.scale.set(scale * aspect, scale, 1);

    // Position above agent's head
    sprite.position.y = 2.5;

    agent.add(sprite);
    agent.userData.textSprite = sprite;
    agent.userData.textCanvas = canvas;

    return sprite;
}

export function hideAgentText(agent) {
    if (agent.userData.textSprite) {
        agent.remove(agent.userData.textSprite);
        if (agent.userData.textSprite.material.map) {
            agent.userData.textSprite.material.map.dispose();
        }
        agent.userData.textSprite.material.dispose();
        agent.userData.textSprite = null;
        agent.userData.textCanvas = null;
    }
}

export function updateAgentText(agent, text) {
    if (agent.userData.textSprite) {
        const canvas = createTextCanvas(text, 32);
        agent.userData.textSprite.material.map.dispose();
        agent.userData.textSprite.material.map = new THREE.CanvasTexture(canvas);
        agent.userData.textSprite.material.map.needsUpdate = true;

        const aspect = canvas.width / canvas.height;
        const scale = 2.5;
        agent.userData.textSprite.scale.set(scale * aspect, scale, 1);
        agent.userData.textCanvas = canvas;
    }
}

// ==================== FILE BLOCK ====================
export function createFileBlock(scene, house, fileName) {
    const baseX = house.userData.x + house.userData.width + 1;
    const baseZ = house.userData.z;

    let x = baseX, z = baseZ;
    for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (Math.abs(f.position.x - x) < 1 && Math.abs(f.position.z - z) < 1) {
            x += 1.0;
            if (x > baseX + 4) {
                x = baseX;
                z += 1.0;
            }
        }
    }

    const geo = new THREE.BoxGeometry(0.6, 0.7, 0.1);
    const mat = materials.fileBlock.clone();
    mat.emissive = new THREE.Color(0x4a9eff);
    mat.emissiveIntensity = 0.3;

    const file = new THREE.Mesh(geo, mat);
    file.position.set(x, getHeightAt(x, z) + 0.5, z);
    file.castShadow = true;

    file.userData = {
        fileName,
        house,
        floatPhase: Math.random() * Math.PI * 2,
        baseY: file.position.y
    };

    scene.add(file);
    files.push(file);
    return file;
}
