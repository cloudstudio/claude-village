import * as THREE from 'three';
import { materials } from './materials.js';
import { housePositions, pondPosition, farmZone, grid, houseLayout } from './config.js';
import { getHeightAt, trees, flowers, bushes, rocks, registerPosition, isPositionFree, snapToGrid } from './terrain.js';

const GRID_STEP = grid?.size ?? 6;
const WORLD_BOUNDS = { minX: -120, maxX: 120, minZ: -120, maxZ: 120 };
const HOUSE_RING_MIN = houseLayout?.ringMin ?? 36;
const HOUSE_RING_MAX = houseLayout?.ringMax ?? 90;
const HOUSE_RING_PAD = houseLayout?.reservePadding ?? 6;
let gridCellsCache = null;

function isInsideFarm(x, z, padding = 0) {
    return (
        x > farmZone.minX - padding &&
        x < farmZone.maxX + padding &&
        z > farmZone.minZ - padding &&
        z < farmZone.maxZ + padding
    );
}

function gridIndex(value) {
    return Math.round(value / GRID_STEP);
}

function shouldUseCell(x, z, pattern = 2, offset = 0) {
    return (gridIndex(x) + gridIndex(z) + offset) % pattern === 0;
}

// Seeded pseudo-random for consistent shuffling
function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function getGridCells() {
    if (gridCellsCache) return gridCellsCache;
    const cells = [];

    // Generate all grid cells across the entire map
    for (let x = WORLD_BOUNDS.minX; x <= WORLD_BOUNDS.maxX; x += GRID_STEP) {
        for (let z = WORLD_BOUNDS.minZ; z <= WORLD_BOUNDS.maxZ; z += GRID_STEP) {
            const { x: gx, z: gz } = snapToGrid(x, z, GRID_STEP);
            cells.push({ x: gx, z: gz, ix: gridIndex(gx), iz: gridIndex(gz) });
        }
    }

    // Shuffle with seeded random for consistent but varied distribution
    for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(i * 12345) * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    gridCellsCache = cells;
    return cells;
}

function placeOnGrid(scene, options) {
    const {
        count,
        radius,
        pattern = 2,
        offset = 0,
        minDist = 0,
        maxDist = Infinity,
        avoidFarm = true,
        excludeMinDist = null,
        excludeMaxDist = null,
        minHouseDist = 8,
        creator
    } = options;

    let placed = 0;
    const cells = getGridCells();
    for (let i = 0; i < cells.length && placed < count; i++) {
        const { x: gx, z: gz } = cells[i];
        if (!shouldUseCell(gx, gz, pattern, offset)) continue;
        if (avoidFarm && isInsideFarm(gx, gz, 2)) continue;
        const dist = Math.hypot(gx, gz);
        if (excludeMinDist !== null && excludeMaxDist !== null) {
            if (dist >= excludeMinDist && dist <= excludeMaxDist) continue;
        }
        if (isNearHousePosition(gx, gz, minHouseDist)) continue;
        if (dist < minDist || dist > maxDist) continue;

        if (!isPositionFree(gx, gz, radius, true)) continue;

        const created = creator(scene, gx, gz);
        if (created) {
            registerPosition(gx, gz, radius);
            placed++;
        }
    }
}

// Check if position is too close to any predefined house position or pond
function isNearHousePosition(x, z, minDist = 8) {
    // Check houses
    for (const pos of housePositions) {
        const dx = pos.x - x;
        const dz = pos.z - z;
        if (Math.sqrt(dx * dx + dz * dz) < minDist) {
            return true;
        }
    }
    // Check pond
    const pondDx = pondPosition.x - x;
    const pondDz = pondPosition.z - z;
    if (Math.sqrt(pondDx * pondDx + pondDz * pondDz) < pondPosition.radius + 3) {
        return true;
    }
    return false;
}

// ==================== PINE TREE ====================
export function createPineTree(scene, x, z) {
    const group = new THREE.Group();
    const height = 6 + Math.random() * 4;

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, height / 3, 8);
    const trunk = new THREE.Mesh(trunkGeo, materials.wood);
    trunk.position.y = height / 6;
    trunk.castShadow = true;
    group.add(trunk);

    // Layers of leaves
    const levels = 3;
    for (let i = 0; i < levels; i++) {
        const size = 3 - i * 0.8;
        const yPos = height / 3 + i * (height * 0.2);
        const coneGeo = new THREE.ConeGeometry(size, height / 2.5, 8);
        const leaves = new THREE.Mesh(coneGeo, materials.leaves);
        leaves.position.y = yPos;
        leaves.castShadow = true;
        group.add(leaves);
    }

    group.position.set(x, getHeightAt(x, z), z);
    scene.add(group);
    trees.push(group);
    return group;
}

// ==================== OAK TREE ====================
export function createOakTree(scene, x, z) {
    const group = new THREE.Group();
    const height = 3.5 + Math.random() * 2;

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.7, height, 8);
    const trunk = new THREE.Mesh(trunkGeo, materials.woodBirch);
    trunk.position.y = height / 2;
    trunk.castShadow = true;
    group.add(trunk);

    // Foliage
    const foliageCount = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < foliageCount; i++) {
        const size = 1 + Math.random();
        const sphere = new THREE.Mesh(
            new THREE.IcosahedronGeometry(size, 0),
            materials.leavesBright
        );
        sphere.position.set(
            (Math.random() - 0.5) * 2.5,
            height + (Math.random()) * 2,
            (Math.random() - 0.5) * 2.5
        );
        sphere.castShadow = true;
        group.add(sphere);
    }

    group.position.set(x, getHeightAt(x, z), z);
    scene.add(group);
    trees.push(group);
    return group;
}

// ==================== GENERIC TREE ====================
export function createTree(scene, x, z) {
    const rand = Math.random();
    if (rand < 0.4) {
        return createPineTree(scene, x, z);
    } else {
        return createOakTree(scene, x, z);
    }
}

// ==================== FLOWER ====================
export function createFlower(scene, x, z, type = 0) {
    const group = new THREE.Group();
    const stemHeight = 0.3 + Math.random() * 0.3;

    // Stem
    const stem = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, stemHeight, 0.05),
        materials.flowerStem
    );
    stem.position.y = stemHeight / 2;
    group.add(stem);

    const flowerColors = [
        materials.flowerPink,
        materials.flowerYellow,
        materials.flowerRed,
        materials.flowerPurple,
        materials.flowerWhite,
        materials.flowerOrange
    ];
    const color = flowerColors[type % flowerColors.length];

    // Petals
    const petalCount = 5;
    for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
        const petal = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 8, 8),
            color
        );
        petal.position.set(
            Math.cos(angle) * 0.1,
            stemHeight + 0.05,
            Math.sin(angle) * 0.1
        );
        petal.scale.set(1, 0.5, 1);
        group.add(petal);
    }

    // Center
    const center = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        materials.flowerYellow
    );
    center.position.y = stemHeight + 0.05;
    group.add(center);

    group.position.set(x, getHeightAt(x, z), z);
    scene.add(group);
    flowers.push(group);
    return group;
}

// ==================== BUSH ====================
export function createBush(scene, x, z) {
    const group = new THREE.Group();
    const bushCount = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < bushCount; i++) {
        const size = 0.4 + Math.random() * 0.4;
        const bush = new THREE.Mesh(
            new THREE.IcosahedronGeometry(size, 1),
            Math.random() > 0.5 ? materials.leaves : materials.leavesBright
        );
        bush.position.set(
            (Math.random() - 0.5) * 0.8,
            size * 0.7,
            (Math.random() - 0.5) * 0.8
        );
        bush.castShadow = true;
        group.add(bush);
    }

    group.position.set(x, getHeightAt(x, z), z);
    scene.add(group);
    bushes.push(group);
    return group;
}

// ==================== ROCK ====================
export function createRock(scene, x, z) {
    const group = new THREE.Group();
    const baseSize = 0.5 + Math.random() * 1;

    for (let i = 0; i < 3; i++) {
        const s = baseSize * (0.5 + Math.random() * 0.5);
        const rock = new THREE.Mesh(
            new THREE.BoxGeometry(s, s * 0.6, s * 0.8),
            [materials.stone, materials.stoneDark, materials.stoneLight][Math.floor(Math.random() * 3)]
        );
        rock.position.set(
            (Math.random() - 0.5) * baseSize * 0.3,
            s * 0.3,
            (Math.random() - 0.5) * baseSize * 0.3
        );
        rock.rotation.y = Math.random() * Math.PI;
        rock.castShadow = true;
        rock.receiveShadow = true;
        group.add(rock);
    }

    group.position.set(x, getHeightAt(x, z), z);
    scene.add(group);
    rocks.push(group);
    return group;
}

// ==================== SPAWN VEGETATION ====================
export function spawnVegetation(scene) {
    // Trees - uniform grid across entire map (every other cell for spacing)
    placeOnGrid(scene, {
        count: 300,
        radius: 3,
        pattern: 2,        // Use every 2nd cell
        offset: 0,
        minDist: 25,       // Avoid center/farm area
        maxDist: 150,      // Cover entire map
        avoidFarm: true,
        minHouseDist: 12,
        creator: createTree
    });

    // Flowers - uniform grid (denser pattern)
    placeOnGrid(scene, {
        count: 200,
        radius: 0.5,
        pattern: 2,
        offset: 1,         // Offset from trees
        minDist: 20,
        maxDist: 140,
        avoidFarm: true,
        minHouseDist: 5,
        creator: (s, x, z) => createFlower(s, x, z, Math.floor(Math.random() * 6))
    });

    // Bushes - uniform grid
    placeOnGrid(scene, {
        count: 120,
        radius: 1,
        pattern: 3,
        offset: 1,
        minDist: 20,
        maxDist: 140,
        avoidFarm: true,
        minHouseDist: 6,
        creator: createBush
    });

    // Rocks - uniform grid (sparser)
    placeOnGrid(scene, {
        count: 80,
        radius: 1.5,
        pattern: 4,
        offset: 2,
        minDist: 22,
        maxDist: 140,
        avoidFarm: true,
        minHouseDist: 6,
        creator: createRock
    });
}

// ==================== SMALL STONES ====================
export function createSmallStones(scene) {
    const stoneCount = 150;
    const stoneGeo = new THREE.BoxGeometry(0.3, 0.2, 0.3);
    const stoneMesh = new THREE.InstancedMesh(stoneGeo, materials.stone, stoneCount);
    stoneMesh.castShadow = true;
    stoneMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let stonesPlaced = 0;

    const cells = getGridCells();
    for (let i = 0; i < cells.length && stonesPlaced < stoneCount; i++) {
        const { x: gx, z: gz } = cells[i];

        if (!shouldUseCell(gx, gz, 2, 0)) continue;
        if (isInsideFarm(gx, gz, 2)) continue;
        if (isNearHousePosition(gx, gz, 4)) continue;
        if (!isPositionFree(gx, gz, 0.4, true)) continue;

        const y = getHeightAt(gx, gz);
        const scale = 0.5 + Math.random() * 1;
        dummy.position.set(gx, y + 0.1 * scale, gz);
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        dummy.scale.set(scale, scale * (0.5 + Math.random() * 0.5), scale);
        dummy.updateMatrix();
        stoneMesh.setMatrixAt(stonesPlaced, dummy.matrix);
        stonesPlaced++;
    }

    stoneMesh.instanceMatrix.needsUpdate = true;
    scene.add(stoneMesh);
    return stoneMesh;
}

// ==================== DIRT PATCHES ====================
export function createDirtPatches(scene, getRandomPositionInFarm) {
    const dirtPatchCount = 12;

    let placed = 0;
    for (let x = farmZone.minX + GRID_STEP; x <= farmZone.maxX - GRID_STEP && placed < dirtPatchCount; x += GRID_STEP) {
        for (let z = farmZone.minZ + GRID_STEP; z <= farmZone.maxZ - GRID_STEP && placed < dirtPatchCount; z += GRID_STEP) {
            const { x: gx, z: gz } = snapToGrid(x, z, GRID_STEP);
            if (!shouldUseCell(gx, gz, 2, 1)) continue;

            const size = 1.5 + Math.random() * 2.5;
            const patch = new THREE.Mesh(
                new THREE.CircleGeometry(size, 8),
                Math.random() > 0.5 ? materials.dirt : materials.dirtDark
            );
            patch.rotation.x = -Math.PI / 2;
            patch.position.set(gx, 0.01, gz);
            patch.receiveShadow = true;
            scene.add(patch);
            placed++;
        }
    }
}
