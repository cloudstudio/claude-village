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
        colorHex,
        state: AgentState.IDLE,
        currentTask: null,
        targetX: group.position.x,
        targetZ: group.position.z,
        speed: 0.04 + Math.random() * 0.02,
        moveTimer: Math.random() * 3,
        walkCycle: 0,
        bobCycle: 0,
        stateTimer: 0,
        particles: {
            thinking: new ParticleSystem(scene, 30, 0xffdd00, 0.12),
            success: new ParticleSystem(scene, 50, 0x00ff88, 0.1),
            error: new ParticleSystem(scene, 40, 0xff4444, 0.1)
        }
    };

    scene.add(group);
    agents.push(group);
    house.userData.agents.push(group);
    return group;
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
