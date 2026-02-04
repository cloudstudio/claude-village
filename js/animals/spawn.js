/**
 * Animal spawning - Spawns all animals in the scene
 */

import { farmZone, grid } from '../config/index.js';
import { getHeightAt, snapToGrid } from '../utils/index.js';
import { getRandomPositionInFarm, getRandomPositionOutsideFarm } from '../world/index.js';
import { state } from '../core/State.js';

// Farm animals
import { createChicken } from './farm/Chicken.js';
import { createSheep } from './farm/Sheep.js';
import { createPig } from './farm/Pig.js';

// Flying animals
import { createButterfly } from './flying/Butterfly.js';
import { createBird } from './flying/Bird.js';
import { createBee } from './flying/Bee.js';

// Wild animals
import { createFox } from './wild/Fox.js';
import { createRabbit } from './wild/Rabbit.js';
import { createDeer } from './wild/Deer.js';
import { createSquirrel } from './wild/Squirrel.js';
import { createFrog } from './wild/Frog.js';

const GRID_STEP = grid?.size ?? 6;

/**
 * Get farm grid cells for animal placement
 * @param {number} step - Grid step size
 * @returns {Array} Array of cell positions
 */
function getFarmGridCells(step = GRID_STEP) {
    const cells = [];
    for (let x = farmZone.minX + step; x <= farmZone.maxX - step; x += step) {
        for (let z = farmZone.minZ + step; z <= farmZone.maxZ - step; z += step) {
            cells.push({ x, z });
        }
    }
    return cells;
}

/**
 * Spawn all animals in the scene
 * @param {THREE.Scene} scene - The scene to add animals to
 */
export function spawnAnimals(scene) {
    const farmCells = getFarmGridCells();
    let farmIndex = 0;
    const nextFarmPos = (radius) => {
        if (farmIndex < farmCells.length) {
            return farmCells[farmIndex++];
        }
        return getRandomPositionInFarm(radius);
    };

    // Chickens
    for (let i = 0; i < 6; i++) {
        const pos = nextFarmPos(1);
        state.registerPosition(pos.x, pos.z, 0.5);
        createChicken(scene, pos.x, pos.z);
    }

    // Sheep
    for (let i = 0; i < 4; i++) {
        const pos = nextFarmPos(1.5);
        state.registerPosition(pos.x, pos.z, 1);
        createSheep(scene, pos.x, pos.z);
    }

    // Pigs
    for (let i = 0; i < 3; i++) {
        const pos = nextFarmPos(1.2);
        state.registerPosition(pos.x, pos.z, 0.8);
        createPig(scene, pos.x, pos.z);
    }

    // Butterflies
    for (let i = 0; i < 8; i++) {
        const pos = getRandomPositionOutsideFarm(20, 50, 1);
        const terrainY = getHeightAt(pos.x, pos.z);
        createButterfly(scene, pos.x, terrainY + 1 + Math.random() * 2, pos.z);
    }

    // Birds
    for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 15 + Math.random() * 35;
        const rawX = Math.cos(angle) * dist;
        const rawZ = Math.sin(angle) * dist;
        const { x, z } = snapToGrid(rawX, rawZ);
        const terrainY = getHeightAt(x, z);
        createBird(scene, x, terrainY + 10 + Math.random() * 8, z);
    }

    // Bees
    for (let i = 0; i < 12; i++) {
        const pos = getRandomPositionOutsideFarm(22, 60, 1);
        const terrainY = getHeightAt(pos.x, pos.z);
        createBee(scene, pos.x, terrainY + 0.5 + Math.random() * 1.2, pos.z);
    }

    // ===== WILD FAUNA =====

    // Foxes (roaming the outskirts)
    for (let i = 0; i < 4; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 45 + Math.random() * 40;
        const rawX = Math.cos(angle) * dist;
        const rawZ = Math.sin(angle) * dist;
        const { x, z } = snapToGrid(rawX, rawZ);
        createFox(scene, x, z);
    }

    // Rabbits (scattered around)
    for (let i = 0; i < 10; i++) {
        const pos = getRandomPositionOutsideFarm(25, 70, 2);
        createRabbit(scene, pos.x, pos.z);
    }

    // Deer (in wooded areas, further out)
    for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 55 + Math.random() * 50;
        const rawX = Math.cos(angle) * dist;
        const rawZ = Math.sin(angle) * dist;
        const { x, z } = snapToGrid(rawX, rawZ);
        createDeer(scene, x, z);
    }

    // Squirrels (near trees)
    for (let i = 0; i < 8; i++) {
        const pos = getRandomPositionOutsideFarm(30, 75, 1.5);
        createSquirrel(scene, pos.x, pos.z);
    }

    // More butterflies spread across the map
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 70;
        const rawX = Math.cos(angle) * dist;
        const rawZ = Math.sin(angle) * dist;
        const { x, z } = snapToGrid(rawX, rawZ);
        const terrainY = getHeightAt(x, z);
        createButterfly(scene, x, terrainY + 1 + Math.random() * 3, z);
    }

    // More birds across the sky
    for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 80;
        const rawX = Math.cos(angle) * dist;
        const rawZ = Math.sin(angle) * dist;
        const { x, z } = snapToGrid(rawX, rawZ);
        const terrainY = getHeightAt(x, z);
        createBird(scene, x, terrainY + 12 + Math.random() * 15, z);
    }

    // Frogs around the pond (pond is at x=35, z=0)
    const pondX = 35;
    const pondZ = 0;
    const pondRadius = 6;
    for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = pondRadius + 0.5 + Math.random() * 3;
        const frogX = pondX + Math.cos(angle) * dist;
        const frogZ = pondZ + Math.sin(angle) * dist;
        createFrog(scene, frogX, frogZ);
    }
}
