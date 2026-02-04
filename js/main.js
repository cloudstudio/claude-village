import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { skyColor, farmZone, grid, AgentState, taskNames, fileNames, FieldTypes, fieldConfig } from './config.js';
import { createGround, houses, agents, trees, files, flowers, bushes, animals, insects, fields, findPosition, getHeightAt, getRandomPositionInFarm, snapToGrid, rocks } from './terrain.js';
import { createHouse, createHeadquarters, createFence, createPond, headquarters, pondWater, pondWaterData } from './buildings.js';
import { createField, updateFieldProgress, getFieldWorkPosition, assignAgentToField, releaseAgentFromField } from './fields.js';
import { createTree, spawnVegetation, createSmallStones, createDirtPatches } from './vegetation.js';
import { spawnAnimals } from './animals.js';
import { createAgent, createFileBlock, showAgentText, hideAgentText } from './agents.js';
import { createClouds, createInstancedClouds, createPollen, createFallingLeaves, updateClouds, updateInstancedClouds, updatePollen, updateLeaves, createChimneySmoke, addSmokeToHouse, updateChimneySmoke } from './atmosphere.js';
import { setupControls, initDrone, updateControls, droneMode } from './controls.js';

// ==================== SCENE SETUP ====================
const scene = new THREE.Scene();
scene.background = new THREE.Color(skyColor);
scene.fog = new THREE.FogExp2(0xdfe9f3, 0.001);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 25, 40);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// ==================== POST PROCESSING ====================
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5, 0.4, 0.85
);
bloomPass.threshold = 0.2;
bloomPass.strength = 0.4;
bloomPass.radius = 0.5;
composer.addPass(bloomPass);

// ==================== CONTROLS ====================
const controls = setupControls(camera, renderer);

// ==================== LIGHTING ====================
const ambientLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
scene.add(ambientLight);

const sun = new THREE.DirectionalLight(0xfff5e0, 1.5);
sun.position.set(50, 80, 50);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near = 10;
sun.shadow.camera.far = 200;
const d = 60;
sun.shadow.camera.left = -d;
sun.shadow.camera.right = d;
sun.shadow.camera.top = d;
sun.shadow.camera.bottom = -d;
sun.shadow.bias = -0.0005;
scene.add(sun);

// Visible Sun
const sunGeo = new THREE.SphereGeometry(4, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
sunMesh.position.copy(sun.position);
scene.add(sunMesh);

// ==================== GROUND ====================
createGround(scene);

// ==================== ATMOSPHERE ====================
const clouds = createClouds(scene);
const { cloudMesh, cloudData, dummy } = createInstancedClouds(scene);
const cloudCount = 70;
const { pollenMesh, pollenData, pollenCount } = createPollen(scene);
const { leafMeshes, leafDataArr, leafCount } = createFallingLeaves(scene);

// Chimney smoke system
const smokeSystem = createChimneySmoke(scene);

const GRID_SIZE = grid?.size ?? 4;
const farmBounds = {
    minX: farmZone.minX + 1,
    maxX: farmZone.maxX - 1,
    minZ: farmZone.minZ + 1,
    maxZ: farmZone.maxZ - 1
};
const mapBounds = { minX: -130, maxX: 130, minZ: -130, maxZ: 130 };

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function isInsideFarm(x, z) {
    return x > farmZone.minX && x < farmZone.maxX && z > farmZone.minZ && z < farmZone.maxZ;
}

function pickGridStepTarget(currentX, currentZ, bounds, step = GRID_SIZE) {
    const dirs = [-1, 0, 1];
    let dx = 0;
    let dz = 0;
    while (dx === 0 && dz === 0) {
        dx = dirs[Math.floor(Math.random() * dirs.length)];
        dz = dirs[Math.floor(Math.random() * dirs.length)];
    }

    let targetX = currentX + dx * step;
    let targetZ = currentZ + dz * step;
    const snapped = snapToGrid(targetX, targetZ, step);
    targetX = snapped.x;
    targetZ = snapped.z;

    if (bounds) {
        targetX = clamp(targetX, bounds.minX, bounds.maxX);
        targetZ = clamp(targetZ, bounds.minZ, bounds.maxZ);
    }

    return { x: targetX, z: targetZ };
}

function pickGridTargetAround(homeX, homeZ, radius, step = GRID_SIZE, bounds = null) {
    const offsetX = (Math.random() * 2 - 1) * radius;
    const offsetZ = (Math.random() * 2 - 1) * radius;
    const snapped = snapToGrid(homeX + offsetX, homeZ + offsetZ, step);
    let x = snapped.x;
    let z = snapped.z;

    if (bounds) {
        x = clamp(x, bounds.minX, bounds.maxX);
        z = clamp(z, bounds.minZ, bounds.maxZ);
    }

    return { x, z };
}

function pickWildTarget(d) {
    const roamRadius = d.roamRadius || 30;
    for (let i = 0; i < 6; i++) {
        const target = pickGridTargetAround(d.homeX, d.homeZ, roamRadius, GRID_SIZE, mapBounds);
        if (!isInsideFarm(target.x, target.z)) return target;
    }
    return pickGridTargetAround(d.homeX, d.homeZ, roamRadius, GRID_SIZE, mapBounds);
}

// ==================== HARVEST PRODUCE SYSTEM ====================
function createHarvestProduce(house, fieldType) {
    if (!house.userData.produce) {
        house.userData.produce = [];
    }

    const produceCount = house.userData.produce.length;
    const maxProduce = 20;

    if (produceCount >= maxProduce) {
        const oldProduce = house.userData.produce.shift();
        scene.remove(oldProduce);
    }

    const group = new THREE.Group();
    const houseX = house.userData.x;
    const houseZ = house.userData.z;
    const houseWidth = house.userData.width || 4;

    // Position in grid next to house
    const col = produceCount % 5;
    const row = Math.floor(produceCount / 5);
    const spacing = 0.5;
    const baseX = houseX + houseWidth / 2 + 1.5 + col * spacing;
    const baseZ = houseZ - 1 + row * spacing;
    const baseY = getHeightAt(baseX, baseZ);

    // Create produce based on field type
    switch (fieldType) {
        case 'orchard': {
            // Pile of fruits (apples/oranges)
            for (let i = 0; i < 3; i++) {
                const fruitGeo = new THREE.SphereGeometry(0.1, 6, 4);
                const color = Math.random() > 0.5 ? 0xff6b35 : 0xc62828;
                const fruitMat = new THREE.MeshLambertMaterial({ color });
                const fruit = new THREE.Mesh(fruitGeo, fruitMat);
                fruit.position.set(
                    (Math.random() - 0.5) * 0.15,
                    0.1 + i * 0.08,
                    (Math.random() - 0.5) * 0.15
                );
                fruit.castShadow = true;
                group.add(fruit);
            }
            break;
        }
        case 'vineyard': {
            // Bunch of grapes
            for (let i = 0; i < 5; i++) {
                const grapeGeo = new THREE.SphereGeometry(0.06, 5, 4);
                const grapeMat = new THREE.MeshLambertMaterial({ color: 0x6a1b9a });
                const grape = new THREE.Mesh(grapeGeo, grapeMat);
                grape.position.set(
                    (Math.random() - 0.5) * 0.12,
                    0.06 + (Math.random() * 0.1),
                    (Math.random() - 0.5) * 0.12
                );
                grape.castShadow = true;
                group.add(grape);
            }
            break;
        }
        case 'wheat': {
            // Wheat bundle
            const bundleGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.3, 6);
            const bundleMat = new THREE.MeshLambertMaterial({ color: 0xffd54f });
            const bundle = new THREE.Mesh(bundleGeo, bundleMat);
            bundle.position.y = 0.15;
            bundle.rotation.z = Math.random() * 0.3;
            bundle.castShadow = true;
            group.add(bundle);
            // Top wheat heads
            const headGeo = new THREE.ConeGeometry(0.06, 0.12, 5);
            const head = new THREE.Mesh(headGeo, bundleMat);
            head.position.y = 0.35;
            group.add(head);
            break;
        }
        case 'rice': {
            // Rice sack
            const sackGeo = new THREE.SphereGeometry(0.12, 6, 5);
            sackGeo.scale(1, 0.7, 1);
            const sackMat = new THREE.MeshLambertMaterial({ color: 0xf5f5dc });
            const sack = new THREE.Mesh(sackGeo, sackMat);
            sack.position.y = 0.1;
            sack.castShadow = true;
            group.add(sack);
            break;
        }
        case 'vegetable':
        default: {
            // Vegetables (tomatoes, cabbages)
            for (let i = 0; i < 2; i++) {
                const vegGeo = new THREE.SphereGeometry(0.09, 6, 5);
                const color = Math.random() > 0.5 ? 0x4caf50 : 0xf44336;
                const vegMat = new THREE.MeshLambertMaterial({ color });
                const veg = new THREE.Mesh(vegGeo, vegMat);
                veg.position.set(
                    (Math.random() - 0.5) * 0.12,
                    0.09,
                    (Math.random() - 0.5) * 0.12 + i * 0.1
                );
                veg.castShadow = true;
                group.add(veg);
            }
            break;
        }
    }

    group.position.set(baseX, baseY, baseZ);
    scene.add(group);
    house.userData.produce.push(group);

    return group;
}

// ==================== AGENT COLLISION SYSTEM ====================
const AGENT_AVOIDANCE_RADIUS = 6; // Distance to start avoiding obstacles
const AGENT_SEPARATION_RADIUS = 1.5; // Distance between agents
const AVOIDANCE_STRENGTH = 2.0;
const SEPARATION_STRENGTH = 1.5;

function getHouseAvoidance(agentX, agentZ, excludeHouse = null) {
    let avoidX = 0;
    let avoidZ = 0;

    for (const house of houses) {
        // Skip the agent's own house when returning home
        if (excludeHouse && house === excludeHouse) continue;

        const hd = house.userData;
        const houseRadius = hd.bounds?.radius || Math.max(hd.width || 4, hd.depth || 4) / 2 + 1;
        const dx = agentX - hd.x;
        const dz = agentZ - hd.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const minDist = houseRadius + AGENT_AVOIDANCE_RADIUS;

        if (dist < minDist && dist > 0.1) {
            // Push away from house center
            const strength = (minDist - dist) / minDist * AVOIDANCE_STRENGTH;
            avoidX += (dx / dist) * strength;
            avoidZ += (dz / dist) * strength;
        }
    }

    // Also avoid trees
    for (const tree of trees) {
        const dx = agentX - tree.position.x;
        const dz = agentZ - tree.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const minDist = 2.5; // Tree collision radius

        if (dist < minDist && dist > 0.1) {
            const strength = (minDist - dist) / minDist * AVOIDANCE_STRENGTH * 0.5;
            avoidX += (dx / dist) * strength;
            avoidZ += (dz / dist) * strength;
        }
    }

    return { x: avoidX, z: avoidZ };
}

function getAgentSeparation(currentAgent) {
    let sepX = 0;
    let sepZ = 0;

    for (const other of agents) {
        if (other === currentAgent) continue;

        const dx = currentAgent.position.x - other.position.x;
        const dz = currentAgent.position.z - other.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < AGENT_SEPARATION_RADIUS && dist > 0.01) {
            const strength = (AGENT_SEPARATION_RADIUS - dist) / AGENT_SEPARATION_RADIUS * SEPARATION_STRENGTH;
            sepX += (dx / dist) * strength;
            sepZ += (dz / dist) * strength;
        }
    }

    return { x: sepX, z: sepZ };
}

// ==================== WATER WAVE ANIMATION ====================
function updatePondWaves(time) {
    if (!pondWater || !pondWaterData) return;

    const positions = pondWater.geometry.attributes.position;
    const { originalY, radius } = pondWaterData;

    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const dist = Math.sqrt(x * x + z * z);

        // Create concentric waves from center
        const wave1 = Math.sin(dist * 1.5 - time * 2) * 0.08;
        // Add secondary wave pattern
        const wave2 = Math.sin(x * 0.8 + time * 1.5) * Math.cos(z * 0.8 + time * 1.2) * 0.04;
        // Reduce amplitude near edges
        const edgeFade = 1 - Math.pow(dist / radius, 2);

        positions.setY(i, originalY[i] + (wave1 + wave2) * Math.max(0, edgeFade));
    }

    positions.needsUpdate = true;
    pondWater.geometry.computeVertexNormals();
}

function animateAnimalLegs(legs, phase, speedRatio) {
    if (!legs || legs.length === 0) return;
    const ratio = Math.max(0.55, speedRatio);
    const swing = Math.sin(phase) * 0.75 * ratio;

    if (legs.length === 2) {
        legs[0].rotation.x = swing;
        legs[1].rotation.x = -swing;
        return;
    }

    if (legs.length >= 4) {
        // Diagonal gait: front-left + back-right together, front-right + back-left together.
        legs[0].rotation.x = swing;
        legs[3].rotation.x = swing;
        legs[1].rotation.x = -swing;
        legs[2].rotation.x = -swing;
        return;
    }

    legs.forEach((leg, i) => {
        leg.rotation.x = swing * (i % 2 === 0 ? 1 : -1);
    });
}

// ==================== FPS COUNTER ====================
let frameCount = 0;
let lastFpsUpdate = performance.now();
let currentFps = 60;


// ==================== UPDATE STATS ====================
function updateStats() {
    const houseCount = document.getElementById('houseCount');
    const agentCount = document.getElementById('agentCount');
    const fileCount = document.getElementById('fileCount');
    const treeCount = document.getElementById('treeCount');
    const animalCount = document.getElementById('animalCount');
    const floraCount = document.getElementById('floraCount');
    const fieldCount = document.getElementById('fieldCount');

    if (houseCount) houseCount.textContent = houses.length;
    if (agentCount) agentCount.textContent = agents.length;
    if (fileCount) fileCount.textContent = files.length;
    if (treeCount) treeCount.textContent = trees.length;
    if (animalCount) animalCount.textContent = animals.length;
    if (floraCount) floraCount.textContent = flowers.length + bushes.length;
    if (fieldCount) fieldCount.textContent = fields.length;
}

// ==================== UPDATE AGENTS PANEL ====================
function updateAgentsPanel() {
    const list = document.getElementById('agents-list');
    if (!list) return;

    list.innerHTML = agents.map(agent => {
        const d = agent.userData;
        const color = `#${d.colorHex.toString(16).padStart(6, '0')}`;
        return `
            <div class="agent-row">
                <div class="agent-color" style="color: ${color}; background: ${color}"></div>
                <div class="agent-name">${d.name}</div>
                <div class="agent-state ${d.state}">${d.state}</div>
            </div>
        `;
    }).join('');
}

// ==================== ANIMATION LOOP ====================
let lastTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // FPS counter
    frameCount++;
    if (now - lastFpsUpdate >= 1000) {
        currentFps = frameCount;
        frameCount = 0;
        lastFpsUpdate = now;
        const fpsEl = document.getElementById('fpsCount');
        if (fpsEl) fpsEl.textContent = currentFps;
    }

    // Update controls
    updateControls(camera, controls);

    // Update atmosphere
    updateClouds(clouds);
    updateInstancedClouds(cloudMesh, cloudData, cloudCount, dummy);
    updatePollen(pollenMesh, pollenData, pollenCount, dt);
    updateLeaves(leafMeshes, leafDataArr, leafCount, dt);

    // Update water waves
    updatePondWaves(now * 0.001);

    // Update chimney smoke
    updateChimneySmoke(smokeSystem, dt);

    // Update animals
    animals.forEach(animal => {
        const d = animal.userData;
        d.stateTimer += dt;

        // Special handling for frogs
        if (d.type === 'frog') {
            if (!d.jumpTimer) d.jumpTimer = 0;
            d.jumpTimer += dt;

            if (d.state === 'idle' && d.jumpTimer > 2 + Math.random() * 4) {
                // Start a jump
                d.state = 'jumping';
                d.jumpTimer = 0;
                d.jumpProgress = 0;

                // Pick a target near the pond
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * d.roamRadius;
                d.targetX = d.homeX + Math.cos(angle) * dist;
                d.targetZ = d.homeZ + Math.sin(angle) * dist;
                d.jumpStartX = animal.position.x;
                d.jumpStartZ = animal.position.z;
                d.jumpStartY = animal.position.y;
            }

            if (d.state === 'jumping') {
                d.jumpProgress += dt * 2; // Jump takes 0.5 seconds

                if (d.jumpProgress < 1) {
                    // Parabolic jump
                    const t = d.jumpProgress;
                    animal.position.x = d.jumpStartX + (d.targetX - d.jumpStartX) * t;
                    animal.position.z = d.jumpStartZ + (d.targetZ - d.jumpStartZ) * t;
                    // Arc height
                    const jumpHeight = 0.5 * Math.sin(t * Math.PI);
                    animal.position.y = getHeightAt(animal.position.x, animal.position.z) + jumpHeight;

                    // Face direction
                    const dx = d.targetX - d.jumpStartX;
                    const dz = d.targetZ - d.jumpStartZ;
                    if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
                        animal.rotation.y = Math.atan2(dx, dz);
                    }

                    // Animate legs during jump
                    if (d.legs && d.legs.length >= 2) {
                        const stretch = Math.sin(t * Math.PI);
                        d.legs[0].rotation.z = -0.8 - stretch * 0.5;
                        d.legs[1].rotation.z = 0.8 + stretch * 0.5;
                    }
                } else {
                    // Land
                    animal.position.x = d.targetX;
                    animal.position.z = d.targetZ;
                    animal.position.y = getHeightAt(d.targetX, d.targetZ);
                    d.state = 'idle';
                    d.jumpTimer = 0;

                    // Reset legs
                    if (d.legs) {
                        d.legs[0].rotation.z = -0.8;
                        d.legs[1].rotation.z = 0.8;
                    }
                }
            }
            return; // Skip normal animal movement for frogs
        }

        if (!d.velocity) {
            d.velocity = new THREE.Vector3();
            d.maxSpeed = (d.speed || 0.02) * 60;
            d.accel = d.maxSpeed * 3;
            d.damping = 6;
            d.turnRate = 10;
            d.separationRadius = d.confined ? 1.2 : 1.6;
            d.separationStrength = 2.5;
        }

        if (d.state === 'idle' && d.stateTimer > 1 + Math.random() * 1.5) {
            d.state = 'walking';
            d.stateTimer = 0;
            const target = d.confined
                ? pickGridStepTarget(animal.position.x, animal.position.z, farmBounds, GRID_SIZE)
                : pickWildTarget(d);

            d.targetX = target.x;
            d.targetZ = target.z;
        }

        if (d.state === 'walking') {
            const dx = d.targetX - animal.position.x;
            const dz = d.targetZ - animal.position.z;
            const dist = Math.hypot(dx, dz);

            if (dist > 0.05) {
                const desiredX = (dx / dist) * d.maxSpeed;
                const desiredZ = (dz / dist) * d.maxSpeed;
                let steerX = desiredX - d.velocity.x;
                let steerZ = desiredZ - d.velocity.z;
                const steerMag = Math.hypot(steerX, steerZ);

                if (steerMag > d.accel) {
                    const scale = d.accel / steerMag;
                    steerX *= scale;
                    steerZ *= scale;
                }

                d.velocity.x += steerX * dt;
                d.velocity.z += steerZ * dt;

                const damping = Math.exp(-d.damping * dt);
                d.velocity.x *= damping;
                d.velocity.z *= damping;

                animal.position.x += d.velocity.x * dt;
                animal.position.z += d.velocity.z * dt;

                if (d.separationStrength > 0) {
                    let sepX = 0;
                    let sepZ = 0;
                    const minDist = d.separationRadius;

                    for (let i = 0; i < animals.length; i++) {
                        const other = animals[i];
                        if (other === animal) continue;
                        const ox = animal.position.x - other.position.x;
                        const oz = animal.position.z - other.position.z;
                        const distSq = ox * ox + oz * oz;

                        if (distSq > 0 && distSq < minDist * minDist) {
                            const od = Math.sqrt(distSq);
                            const strength = (minDist - od) / minDist;
                            sepX += (ox / od) * strength;
                            sepZ += (oz / od) * strength;
                        }
                    }

                    animal.position.x += sepX * d.separationStrength * dt;
                    animal.position.z += sepZ * d.separationStrength * dt;
                }

                animal.position.y = getHeightAt(animal.position.x, animal.position.z);

                const speed = Math.hypot(d.velocity.x, d.velocity.z);
                if (speed > 0.001) {
                    const desiredRot = Math.atan2(d.velocity.x, d.velocity.z);
                    const delta = Math.atan2(Math.sin(desiredRot - animal.rotation.y), Math.cos(desiredRot - animal.rotation.y));
                    animal.rotation.y += delta * Math.min(1, d.turnRate * dt);
                }

                d.walkCycle += dt * (6 + speed * 6);
                const speedRatio = Math.min(1, Math.max(0.55, speed / (d.maxSpeed * 0.4)));
                animateAnimalLegs(d.legs, d.walkCycle, speedRatio);
            } else {
                d.state = 'idle';
                d.stateTimer = 0;
                d.velocity.x *= 0.2;
                d.velocity.z *= 0.2;
                animal.position.x = d.targetX;
                animal.position.z = d.targetZ;
                animal.position.y = getHeightAt(animal.position.x, animal.position.z);
                if (d.legs) {
                    d.legs.forEach(leg => leg.rotation.x = 0);
                }
            }
        }
    });

    // Update insects
    insects.forEach(insect => {
        const d = insect.userData;
        d.flightTimer += dt;
        d.phase += dt * 20;

        if (d.wings) {
            if (d.type === 'butterfly') {
                const flap = Math.sin(d.phase) * 0.8;
                d.wings[0].rotation.z = flap;
                d.wings[1].rotation.z = -flap;
                d.wings[2].rotation.z = flap * 0.7;
                d.wings[3].rotation.z = -flap * 0.7;
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

        if (d.type === 'butterfly') {
            if (d.flightTimer > 1 + Math.random() * 2) {
                d.flightTimer = 0;
                d.targetX = d.homeX + (Math.random() - 0.5) * 15;
                d.targetZ = d.homeZ + (Math.random() - 0.5) * 15;
                const groundY = getHeightAt(d.targetX, d.targetZ);
                d.targetY = groundY + 1.5 + Math.random() * 3;
            }
            insect.position.x += (d.targetX - insect.position.x) * 0.03;
            insect.position.y += (d.targetY - insect.position.y) * 0.03;
            insect.position.z += (d.targetZ - insect.position.z) * 0.03;
            insect.position.y += Math.sin(now * 0.003 + d.phase) * 0.02;
            insect.rotation.y = Math.atan2(d.targetX - insect.position.x, d.targetZ - insect.position.z);
        } else if (d.type === 'bee') {
            if (d.flightTimer > 2 + Math.random() * 3) {
                d.flightTimer = 0;
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
            insect.position.x += (d.targetX - insect.position.x) * 0.03;
            insect.position.y += (d.targetY - insect.position.y) * 0.03;
            insect.position.z += (d.targetZ - insect.position.z) * 0.03;
            insect.position.y += Math.sin(now * 0.008 + d.phase) * 0.02;
            insect.rotation.y = Math.atan2(d.targetX - insect.position.x, d.targetZ - insect.position.z);
        } else if (d.type === 'bird') {
            d.circleAngle += dt * 0.3;
            d.targetX = d.homeX + Math.cos(d.circleAngle) * d.circleRadius;
            d.targetZ = d.homeZ + Math.sin(d.circleAngle) * d.circleRadius;
            d.targetY = 10 + Math.sin(d.circleAngle * 0.5) * 3;
            insect.position.x += (d.targetX - insect.position.x) * 0.05;
            insect.position.y += (d.targetY - insect.position.y) * 0.05;
            insect.position.z += (d.targetZ - insect.position.z) * 0.05;
            insect.rotation.y = d.circleAngle + Math.PI / 2;
            insect.rotation.z = Math.sin(d.circleAngle) * 0.2;
        }
    });

    // Update agents
    agents.forEach(agent => {
        const d = agent.userData;
        d.moveTimer += dt;

        // State timer
        if (d.stateTimer > 0) {
            d.stateTimer -= dt;
            if (d.stateTimer <= 0) {
                d.state = AgentState.IDLE;
                d.currentTask = null;
            }
        }

        // Particles
        Object.values(d.particles).forEach(p => p.update(dt));

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

        // Working in field animation
        if (d.state === AgentState.WORKING && d.assignedField) {
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

            // Work animation: bobbing motion while working
            const workBob = Math.sin(d.workAnimationPhase) * 0.1;
            d.head.position.y = 1.4 + workBob;

            // Tool animation: swinging motion (like hoeing)
            if (d.tool) {
                const swing = Math.sin(d.workAnimationPhase * 1.5) * 0.6;
                d.tool.rotation.x = swing;
            }

            // Arms animation while working
            if (d.arms && d.arms.length >= 2) {
                const armSwing = Math.sin(d.workAnimationPhase * 1.5) * 0.3;
                d.arms[1].rotation.x = armSwing;  // Right arm follows tool
            }
        } else {
            d.particles.work.stop();
            // Reset tool position when not working (except during harvesting)
            if (d.tool && d.state !== AgentState.HARVESTING) {
                d.tool.rotation.x = 0;
            }
            if (d.arms && d.state !== AgentState.HARVESTING) {
                d.arms.forEach(arm => arm.rotation.x = 0);
            }
        }

        // Harvesting loop for mature fields
        if (d.state === AgentState.HARVESTING && d.harvestField) {
            const field = d.harvestField;
            // Use agent's house instead of hardcoded HQ
            const homePos = d.house ? { x: d.house.userData.x, z: d.house.userData.z } : { x: -35, z: 0 };

            d.harvestTimer += dt;

            // Update carry mesh visibility
            if (d.carryMesh) {
                d.carryMesh.visible = d.carrying;
            }

            // Distance to current target
            const distToTarget = Math.hypot(agent.position.x - d.targetX, agent.position.z - d.targetZ);

            switch (d.harvestPhase) {
                case 'going_to_field': {
                    // Set target once when entering phase
                    if (!d.harvestTargetSet) {
                        const workPos = getFieldWorkPosition(field);
                        d.targetX = workPos.x;
                        d.targetZ = workPos.z;
                        d.harvestTargetSet = true;
                        d.collectDuration = 2 + Math.random() * 4;
                    }

                    // Recalculate distance to field target
                    const distToField = Math.hypot(agent.position.x - d.targetX, agent.position.z - d.targetZ);

                    // Check if arrived at field
                    if (distToField < 1.5) {
                        d.harvestPhase = 'collecting';
                        d.harvestTimer = 0;
                        d.workAnimationPhase = 0;
                        d.harvestTargetSet = false;
                    }
                    break;
                }

                case 'collecting': {
                    // Collect fruits (random duration set above)
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
                        console.log(`[HARVEST] Agent ${d.id} finished collecting, now returning. House: ${d.house ? 'yes' : 'NO!'}`);
                        d.harvestPhase = 'returning';
                        d.carrying = true;
                        d.harvestTimer = 0;
                        d.harvestTargetSet = false;
                        d.particles.work.stop();
                    }
                    break;
                }

                case 'returning': {
                    // Set target once when entering phase
                    if (!d.harvestTargetSet) {
                        // Target the side of the house where crates are placed
                        const houseWidth = d.house?.userData?.width || 4;
                        const houseDepth = d.house?.userData?.depth || 4;
                        // Go to the right side of the house (where crates stack)
                        d.targetX = homePos.x + houseWidth / 2 + 2 + Math.random();
                        d.targetZ = homePos.z + (Math.random() - 0.5) * 2;
                        d.harvestTargetSet = true;
                        d.unloadDuration = 0.5 + Math.random() * 1.5;
                        console.log(`[HARVEST] Agent ${d.id} returning to house side at (${d.targetX.toFixed(1)}, ${d.targetZ.toFixed(1)})`);
                    }

                    // Recalculate distance to NEW target (house)
                    const distToHome = Math.hypot(agent.position.x - d.targetX, agent.position.z - d.targetZ);

                    // Check if arrived at home
                    if (distToHome < 3) {
                        console.log(`[HARVEST] Agent ${d.id} arrived at home, dist: ${distToHome.toFixed(2)}`);
                        d.harvestPhase = 'unloading';
                        d.harvestTimer = 0;
                        d.harvestTargetSet = false;
                    }
                    break;
                }

                case 'unloading': {
                    // Unload (random duration set above)
                    if (d.harvestTimer > d.unloadDuration) {
                        // Create produce at the house
                        if (d.house && field) {
                            const fieldType = field.userData.type || 'vegetable';
                            createHarvestProduce(d.house, fieldType);
                        }
                        d.carrying = false;
                        d.harvestPhase = 'going_to_field';
                        d.harvestTimer = 0;
                        d.harvestTargetSet = false;
                    }
                    break;
                }
            }
        } else {
            // Reset carry mesh when not harvesting
            if (d.carryMesh) {
                d.carryMesh.visible = false;
            }
        }

        // Random movement when idle (and not working in a field and not harvesting)
        if (d.state === AgentState.IDLE && !d.assignedField && !d.harvestField && d.moveTimer > 3 + Math.random() * 4) {
            d.moveTimer = 0;
            const house = d.house;
            const range = 8;
            d.targetX = house.userData.x + (Math.random() - 0.5) * range * 2;
            d.targetZ = house.userData.z + (Math.random() - 0.5) * range * 2;
        }

        // Move towards target with collision avoidance
        let dx = d.targetX - agent.position.x;
        let dz = d.targetZ - agent.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0.2) {
            // Normalize direction to target
            const dirX = dx / dist;
            const dirZ = dz / dist;

            // Get avoidance forces (exclude own house when returning home)
            const isReturningHome = d.state === AgentState.HARVESTING &&
                                   (d.harvestPhase === 'returning' || d.harvestPhase === 'unloading');
            const avoidance = getHouseAvoidance(agent.position.x, agent.position.z, isReturningHome ? d.house : null);
            const separation = getAgentSeparation(agent);

            // Combine forces: target direction + avoidance + separation
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

            // Face movement direction (not target)
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
            d.legs.forEach(leg => leg.rotation.x = 0);
        }
    });

    // Update files (floating)
    files.forEach(file => {
        file.userData.floatPhase += dt * 2;
        file.position.y = file.userData.baseY + Math.sin(file.userData.floatPhase) * 0.1;
        file.rotation.y += dt * 0.5;
    });

    // Update UI
    updateAgentsPanel();

    composer.render();
}

// ==================== PUBLIC FUNCTIONS ====================
function addHouse() {
    const pos = findPosition(8);
    const house = createHouse(scene, pos.x, pos.z);
    // Add smoke only to houses that have chimneys
    if (house.userData.hasChimney) {
        addSmokeToHouse(smokeSystem, house);
    }
    updateStats();
    return house;
}

function addAgent() {
    const hq = headquarters;
    if (!hq) return;
    const agent = createAgent(scene, hq);
    updateStats();
    return agent;
}

function addField(fieldType = FieldTypes.VEGETABLE, x = null, z = null, taskName = null) {
    // createField will auto-position from farm if x,z are null
    const field = createField(scene, fieldType, x, z);
    if (!field) {
        console.warn('Could not create field (collision or other issue)');
        return null;
    }

    // Auto-create an agent for this field
    const agent = createAgent(scene, headquarters);
    const task = taskName || `Cultivate ${fieldType}`;

    // Assign agent to field and start working
    assignAgentToField(agent, field, task);
    agent.userData.state = AgentState.WORKING;
    agent.userData.stateTimer = 0;

    console.log(`Created field #${field.userData.id} with agent #${agent.userData.id}`);

    updateStats();
    return { field, agent };
}

function startFieldTask(agentId, fieldId, taskName) {
    const agent = agents.find(a => a.userData.id === agentId) || agents[agentId - 1];
    const field = fields.find(f => f.userData.id === fieldId) || fields[fieldId - 1];

    if (!agent || !field) {
        console.error('Agent or field not found:', agentId, fieldId);
        return null;
    }

    // Assign agent to field and start working
    assignAgentToField(agent, field, taskName);
    agent.userData.state = AgentState.WORKING;
    agent.userData.stateTimer = 0;  // Don't auto-reset state

    return { agent, field };
}

function setFieldProgress(fieldId, progress, agentId = null) {
    console.log(`setFieldProgress called: fieldId=${fieldId}, progress=${progress}, agentId=${agentId}`);
    console.log(`Available fields:`, fields.map(f => f.userData.id));
    console.log(`Available agents:`, agents.map(a => a.userData.id));

    const field = fields.find(f => f.userData.id === fieldId) || fields[fieldId - 1];
    if (!field) {
        console.error('Field not found:', fieldId);
        return;
    }
    console.log(`Found field:`, field.userData.id);
    updateFieldProgress(field, progress);

    // If progress is 100%, start harvesting loop
    if (progress >= 100) {
        console.log(`Progress 100%, looking for agent. field.assignedAgent:`, field.userData.assignedAgent);
        // Try to find agent: first from field, then by agentId
        let agent = field.userData.assignedAgent;
        if (!agent && agentId) {
            console.log(`Searching agent by ID: ${agentId}`);
            agent = agents.find(a => a.userData.id === agentId) || agents[agentId - 1];
            console.log(`Found agent:`, agent ? agent.userData.id : 'null');
            if (agent) {
                // Assign agent to field if not already
                field.userData.assignedAgent = agent;
                agent.userData.assignedField = field;
            }
        }
        if (agent) {
            console.log(`Starting harvesting for agent ${agent.userData.id}`);
            startHarvesting(agent, field);
        } else {
            console.error('No agent found for harvesting!');
        }
    }
}

// Start harvesting loop for an agent on a mature field
function startHarvesting(agent, field) {
    const d = agent.userData;
    d.state = AgentState.HARVESTING;
    d.harvestField = field;
    d.harvestPhase = 'going_to_field';
    d.harvestTimer = 0;
    d.carrying = false;
    d.stateTimer = 0;  // Don't auto-reset state

    // Keep agent assigned to field
    d.assignedField = field;
}

// Stop harvesting and release agent
function stopHarvesting(agentId) {
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

function endFieldTask(agentId, success = true) {
    const agent = agents.find(a => a.userData.id === agentId) || agents[agentId - 1];
    if (!agent) return;

    if (agent.userData.assignedField) {
        releaseAgentFromField(agent);
    }

    agent.userData.state = success ? AgentState.SUCCESS : AgentState.ERROR;
    agent.userData.stateTimer = 3;
}

// Store signs for raycasting
const fieldSigns = [];

// Create a sign in front of a field with summary text (shown on hover)
function createFieldSign(fieldId, summaryText) {
    console.log('createFieldSign called:', fieldId, summaryText);
    console.log('Available fields:', fields.map(f => f.userData.id));

    const field = fields.find(f => f.userData.id === fieldId) || fields[fieldId - 1];
    if (!field) {
        console.error('Field not found for sign:', fieldId);
        return;
    }
    console.log('Found field at:', field.userData.x, field.userData.z);

    // Position in front of the field (offset in Z)
    const signX = field.userData.x;
    const signZ = field.userData.z + 4;  // In front of field

    // Create sign post (wooden pole)
    const postGeometry = new THREE.CylinderGeometry(0.08, 0.1, 1.2, 8);
    const postMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });  // Brown
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(signX, 0.6, signZ);
    post.castShadow = true;

    // Create sign board
    const boardGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.08);
    const boardMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 });  // Burlywood
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.set(0, 0.45, 0);
    board.castShadow = true;
    post.add(board);

    // Create text on the board with checkmark and first words
    const textCanvas = document.createElement('canvas');
    textCanvas.width = 256;
    textCanvas.height = 128;
    const ctx = textCanvas.getContext('2d');

    // Background
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, 0, 256, 128);

    // Checkmark
    ctx.fillStyle = '#228B22';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('✓', 128, 45);

    // First words of summary (truncated)
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

    // Store summary for hover tooltip
    post.userData = {
        isFieldSign: true,
        fieldId: fieldId,
        summary: summaryText || 'Task completed',
        field: field
    };

    scene.add(post);
    fieldSigns.push(post);

    console.log(`Created sign for field #${fieldId}: "${summaryText}"`);
    return post;
}

// Debug function: mature all fields to 100%
function matureAllFields() {
    fields.forEach(field => {
        setFieldProgress(field.userData.id, 100);
    });
    console.log(`Matured ${fields.length} fields to 100%`);
}

// Expose to window (for UI buttons and MCP API)
window.addHouse = addHouse;
window.addAgent = addAgent;
window.addField = addField;
window.startFieldTask = startFieldTask;
window.setFieldProgress = setFieldProgress;
window.endFieldTask = endFieldTask;
window.matureAllFields = matureAllFields;
window.startHarvesting = startHarvesting;
window.stopHarvesting = stopHarvesting;
window.createFieldSign = createFieldSign;
window.showAgentText = showAgentText;
window.hideAgentText = hideAgentText;
window.agents = agents;

// Toggle UI visibility
window.toggleUI = function() {
    document.body.classList.toggle('ui-hidden');
};

// ==================== RESIZE ====================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// ==================== HOVER TOOLTIP FOR SIGNS ====================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Create tooltip element
const tooltip = document.createElement('div');
tooltip.id = 'sign-tooltip';
tooltip.style.cssText = `
    position: fixed;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    border-radius: 6px;
    font-size: 13px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
    max-width: 300px;
    z-index: 1000;
    border: 1px solid rgba(255,255,255,0.2);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
`;
document.body.appendChild(tooltip);

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Check intersections with signs
    if (fieldSigns.length > 0) {
        const intersects = raycaster.intersectObjects(fieldSigns, true);

        if (intersects.length > 0) {
            // Find the sign (parent object with userData)
            let sign = intersects[0].object;
            while (sign && !sign.userData?.isFieldSign) {
                sign = sign.parent;
            }

            if (sign && sign.userData?.summary) {
                tooltip.textContent = sign.userData.summary;
                tooltip.style.opacity = '1';
                tooltip.style.left = (event.clientX + 15) + 'px';
                tooltip.style.top = (event.clientY + 15) + 'px';
                document.body.style.cursor = 'pointer';
                return;
            }
        }
    }

    // Hide tooltip if not hovering sign
    tooltip.style.opacity = '0';
    document.body.style.cursor = 'default';
});

// ==================== INITIAL SCENE ====================
// Create HQ
createHeadquarters(scene);

// Create fences
createFence(scene, farmZone.minX, farmZone.minZ, farmZone.maxX, farmZone.minZ);
createFence(scene, farmZone.maxX, farmZone.minZ, farmZone.maxX, farmZone.maxZ);
createFence(scene, farmZone.maxX, farmZone.maxZ, farmZone.minX, farmZone.maxZ);
createFence(scene, farmZone.minX, farmZone.maxZ, farmZone.minX, farmZone.minZ);

// Spawn animals
spawnAnimals(scene);

// Create pond
createPond(scene, 35, 0, 5);

// Spawn vegetation
spawnVegetation(scene);
createSmallStones(scene);
createDirtPatches(scene, getRandomPositionInFarm);

// Initial trees (scenery) - use larger spacing to prevent trees from clumping
for (let i = 0; i < 8; i++) {
    const pos = findPosition(12);  // Minimum 12 units between trees (was 4)
    createTree(scene, pos.x, pos.z);
}

// No initial houses or agents - controlled via MCP

// Activate drone (always active)
initDrone(scene, controls);

// Start animation
animate();

// Update stats
updateStats();

// ==================== MCP SERVER CONNECTION ====================
const MCP_WS_URL = 'ws://localhost:8765';
let mcpSocket = null;
let mcpReconnectTimer = null;

function connectToMCP() {
    if (mcpSocket && mcpSocket.readyState === WebSocket.OPEN) return;

    mcpSocket = new WebSocket(MCP_WS_URL);

    mcpSocket.onopen = () => {
        console.log('Connected to MCP server');
        updateConnectionStatus(true);
    };

    mcpSocket.onclose = () => {
        console.log('Disconnected from MCP server');
        updateConnectionStatus(false);
        // Reconnect after 3 seconds
        mcpReconnectTimer = setTimeout(connectToMCP, 3000);
    };

    mcpSocket.onerror = (err) => {
        console.log('MCP connection error (server may not be running)');
    };

    mcpSocket.onmessage = (event) => {
        try {
            const { type, payload } = JSON.parse(event.data);
            handleMCPCommand(type, payload);
        } catch (e) {
            console.error('Failed to parse MCP message:', e);
        }
    };
}

function updateConnectionStatus(connected) {
    const connEl = document.getElementById('connection');
    if (connEl) {
        const dot = connEl.querySelector('.conn-dot');
        const text = connEl.querySelector('span');
        if (dot) {
            dot.classList.toggle('connected', connected);
        }
        if (text) text.textContent = connected ? 'MCP Connected' : 'Demo Mode';
    }
}

function handleMCPCommand(type, payload) {
    console.log('MCP Command:', type, payload);

    switch (type) {
        case 'create_house': {
            const newHouse = addHouse();
            if (newHouse && payload.id) {
                newHouse.userData.id = payload.id;
            }
            break;
        }

        case 'create_agent': {
            // Find the house for this agent (use houseId from payload, or last created house)
            let agentHouse = headquarters;
            if (payload.houseId) {
                const foundHouse = houses.find(h => h.userData.id === payload.houseId);
                if (foundHouse) {
                    agentHouse = foundHouse;
                } else if (houses.length > 0) {
                    // Use the most recently created house
                    agentHouse = houses[houses.length - 1];
                }
            } else if (houses.length > 0) {
                // Use the most recently created house if no houseId specified
                agentHouse = houses[houses.length - 1];
            }

            const newAgent = createAgent(scene, agentHouse);
            if (newAgent && payload.id) {
                // Use server's ID for synchronization
                newAgent.userData.id = payload.id;
                newAgent.userData.name = payload.name || newAgent.userData.name;
            }
            updateStats();
            break;
        }

        case 'create_field': {
            // Use createField directly (not addField) to avoid auto-creating agents
            // The MCP server will handle agent creation separately
            const fieldType = payload.type || payload.fieldType || FieldTypes.VEGETABLE;
            const newField = createField(scene, fieldType, payload.x, payload.z);
            if (newField) {
                if (payload.id) {
                    newField.userData.id = payload.id;
                }
                console.log(`MCP created field #${newField.userData.id} type ${fieldType}`);
                updateStats();
            }
            break;
        }

        case 'start_task': {
            // Find agent and field by server IDs
            const taskAgent = agents.find(a => a.userData.id === payload.agentId);
            const taskField = payload.fieldId ? fields.find(f => f.userData.id === payload.fieldId) : null;

            if (taskAgent) {
                if (taskField) {
                    // Assign agent to field
                    assignAgentToField(taskAgent, taskField, payload.taskName);
                    taskAgent.userData.state = AgentState.WORKING;
                    taskAgent.userData.stateTimer = 0;
                    console.log(`Agent ${payload.agentId} assigned to field ${payload.fieldId}`);
                } else {
                    // Working without specific field
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
            endFieldTask(payload.agentId, payload.success !== false);
            break;
        }

        case 'set_field_progress': {
            setFieldProgress(payload.fieldId, payload.progress, payload.agentId);
            break;
        }

        case 'create_field_sign': {
            createFieldSign(payload.fieldId, payload.summary);
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

        case 'create_file':
            if (payload.agentId) {
                const fileAgent = agents.find(a => a.userData.id === payload.agentId) || agents[payload.agentId - 1];
                if (fileAgent && fileAgent.userData.house) {
                    createFileBlock(scene, fileAgent.userData.house, payload.fileName);
                }
            } else if (houses.length > 0) {
                const randomHouse = houses[Math.floor(Math.random() * houses.length)];
                createFileBlock(scene, randomHouse, payload.fileName);
            }
            break;

        case 'move_camera':
            if (payload.agentId) {
                const targetAgent = agents.find(a => a.userData.id === payload.agentId) || agents[payload.agentId - 1];
                if (targetAgent) {
                    controls.target.set(targetAgent.position.x, targetAgent.position.y, targetAgent.position.z);
                }
            } else if (payload.fieldId) {
                const targetField = fields.find(f => f.userData.id === payload.fieldId) || fields[payload.fieldId - 1];
                if (targetField) {
                    controls.target.set(targetField.position.x, targetField.position.y, targetField.position.z);
                }
            } else if (payload.x !== undefined && payload.z !== undefined) {
                controls.target.set(payload.x, 0, payload.z);
            }
            break;

        case 'sync':
            console.log('Received state sync:', payload);
            break;

        case 'show_agent_text': {
            // Find agent by server ID (number) or by index
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

    updateStats();
}

// Try to connect to MCP server
connectToMCP();

console.log('Agent Village - Modular Version loaded!');
