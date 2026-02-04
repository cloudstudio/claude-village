import * as THREE from 'three';
import { farmZone, housePositions, pondPosition, grid, houseLayout, FIELD_GRID } from './config.js';

// ==================== STORAGE ====================
export const houses = [];
export const agents = [];
export const trees = [];
export const files = [];
export const flowers = [];
export const bushes = [];
export const tallGrass = [];
export const mushrooms = [];
export const rocks = [];
export const animals = [];
export const insects = [];
export const fields = [];  // Work fields (orchard, rice, wheat, etc.)

// Occupied positions tracker
const occupiedPositions = [];

// House position index
let nextHouseIndex = 0;
let houseSlots = null;

const HOUSE_MIN_RADIUS = houseLayout?.ringMin ?? 36;
const HOUSE_MAX_RADIUS = houseLayout?.ringMax ?? 90;
const HOUSE_GRID_STEP = houseLayout?.gridStep ?? (grid?.size ?? 6) * 2;
const HOUSE_EXCLUDE_PADDING = houseLayout?.reservePadding ?? 6;

// ==================== GRID HELPERS ====================
const GRID_SIZE = grid?.size ?? 4;
const GRID_JITTER = grid?.jitter ?? 0;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export function snapToGrid(x, z, size = GRID_SIZE) {
    return {
        x: Math.round(x / size) * size,
        z: Math.round(z / size) * size
    };
}

function applyGridJitter(x, z, size = GRID_SIZE, jitter = GRID_JITTER) {
    if (!jitter) return { x, z };
    const range = size * jitter;
    return {
        x: x + (Math.random() - 0.5) * range,
        z: z + (Math.random() - 0.5) * range
    };
}

export function gridifyPosition(x, z, bounds = null, size = GRID_SIZE, jitter = GRID_JITTER) {
    const snapped = snapToGrid(x, z, size);
    const jittered = applyGridJitter(snapped.x, snapped.z, size, jitter);
    let gx = jittered.x;
    let gz = jittered.z;

    if (bounds) {
        gx = clamp(gx, bounds.minX, bounds.maxX);
        gz = clamp(gz, bounds.minZ, bounds.maxZ);
    }

    return { x: gx, z: gz };
}

function cellHash(ix, iz) {
    return ((ix * 73856093) ^ (iz * 19349663)) >>> 0;
}

function isInPond(x, z, padding = 0) {
    const dx = x - pondPosition.x;
    const dz = z - pondPosition.z;
    const r = pondPosition.radius + padding;
    return dx * dx + dz * dz < r * r;
}

function isInHQArea(x, z) {
    // HQ (barn) is at x=-35, z=0 with silo
    const hqX = -35;
    const hqZ = 0;
    const dx = x - hqX;
    const dz = z - hqZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    return dist < 20;  // 20 unit radius around HQ
}

function isInFarm(x, z, padding = 0) {
    return (
        x > farmZone.minX - padding &&
        x < farmZone.maxX + padding &&
        z > farmZone.minZ - padding &&
        z < farmZone.maxZ + padding
    );
}

// Check if position is inside the field grid area
function isInFieldArea(x, z, padding = 6) {
    const grid = FIELD_GRID;
    const endX = grid.startX + grid.columns * (grid.fieldSize + grid.gap);
    const endZ = grid.startZ + grid.rows * (grid.fieldSize + grid.gap);

    return (
        x > grid.startX - padding &&
        x < endX + padding &&
        z > grid.startZ - padding &&
        z < endZ + padding
    );
}

function getHouseSlots() {
    if (houseSlots) return houseSlots;

    const seen = new Set();
    const slots = [];

    const addSlot = (x, z) => {
        const key = `${x},${z}`;
        if (seen.has(key)) return;
        seen.add(key);
        slots.push({ x, z, ix: Math.round(x / GRID_SIZE), iz: Math.round(z / GRID_SIZE) });
    };

    // Start with curated positions (snapped to grid)
    for (const pos of housePositions) {
        const snapped = snapToGrid(pos.x, pos.z, HOUSE_GRID_STEP);
        if (isInPond(snapped.x, snapped.z, HOUSE_EXCLUDE_PADDING)) continue;
        if (isInHQArea(snapped.x, snapped.z)) continue;
        if (isInFarm(snapped.x, snapped.z, HOUSE_EXCLUDE_PADDING)) continue;
        addSlot(snapped.x, snapped.z);
    }

    // Fill with grid slots around the village ring
    for (let x = -100; x <= 100; x += HOUSE_GRID_STEP) {
        for (let z = -100; z <= 100; z += HOUSE_GRID_STEP) {
            const { x: gx, z: gz } = snapToGrid(x, z, HOUSE_GRID_STEP);
            const dist = Math.hypot(gx, gz);
            if (dist < HOUSE_MIN_RADIUS || dist > HOUSE_MAX_RADIUS) continue;
            if (isInFarm(gx, gz, HOUSE_EXCLUDE_PADDING)) continue;
            if (isInPond(gx, gz, HOUSE_EXCLUDE_PADDING)) continue;
            if (isInHQArea(gx, gz)) continue;
            if (isInFieldArea(gx, gz, HOUSE_EXCLUDE_PADDING)) continue;
            addSlot(gx, gz);
        }
    }

    // Deterministic distribution across map
    slots.sort((a, b) => cellHash(a.ix, a.iz) - cellHash(b.ix, b.iz));
    houseSlots = slots;
    return houseSlots;
}

// ==================== GRASS TEXTURE ====================
export function createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#4e9a25');
    grad.addColorStop(1, '#6ab03d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 20000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        ctx.fillStyle = Math.random() > 0.5 ? '#4a8a2f' : '#7dbb5a';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 2, y - 4);
        ctx.lineTo(x + 4, y);
        ctx.fill();
    }

    ctx.globalAlpha = 1.0;

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(80, 80);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

// ==================== SNOW TEXTURE ====================
export function createSnowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base white with subtle blue tint
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#f0f5ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Add sparkle/texture
    for (let i = 0; i < 3000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#e8f0ff';
        ctx.globalAlpha = 0.4 + Math.random() * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, 0.5 + Math.random(), 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.globalAlpha = 1.0;

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(40, 40);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

// ==================== GROUND CREATION ====================
export function createGround(scene) {
    const grassTexture = createGrassTexture();
    const snowTexture = createSnowTexture();

    // Ground material with vertex colors for snow blend
    const groundMat = new THREE.MeshStandardMaterial({
        map: grassTexture,
        roughness: 1,
        vertexColors: true
    });

    const groundGeo = new THREE.PlaneGeometry(600, 600, 192, 192);
    const posAttribute = groundGeo.attributes.position;
    const vertex = new THREE.Vector3();

    // Create vertex colors array
    const colors = new Float32Array(posAttribute.count * 3);
    const snowStartHeight = 25; // Height where snow starts blending
    const fullSnowHeight = 40;  // Height where it's fully snow

    for (let i = 0; i < posAttribute.count; i++) {
        vertex.fromBufferAttribute(posAttribute, i);
        const x = vertex.x;
        const y = vertex.y;
        const dist = Math.sqrt(x * x + y * y);

        let height = 0;
        if (dist > 150) {
            height = Math.pow((dist - 150) / 100, 2) * 50;
            const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 3;
            height += noise;
        } else if (dist > 80) {
            const t = (dist - 80) / 70;
            height = Math.sin(x * 0.15) * Math.cos(y * 0.15) * t * 2;
        }

        posAttribute.setZ(i, height);

        // Calculate snow blend based on height
        let snowBlend = 0;
        if (height > snowStartHeight) {
            snowBlend = Math.min(1, (height - snowStartHeight) / (fullSnowHeight - snowStartHeight));
        }

        // Green grass color: rgb(0.36, 0.6, 0.23)
        // Snow color: rgb(1, 1, 1)
        const grassR = 0.36, grassG = 0.6, grassB = 0.23;
        colors[i * 3] = grassR + (1 - grassR) * snowBlend;
        colors[i * 3 + 1] = grassG + (1 - grassG) * snowBlend;
        colors[i * 3 + 2] = grassB + (1 - grassB) * snowBlend;
    }

    groundGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    groundGeo.computeVertexNormals();

    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    return ground;
}

// ==================== HEIGHT HELPER ====================
export function getHeightAt(x, z) {
    const dist = Math.sqrt(x * x + z * z);
    if (dist > 150) {
        return Math.pow((dist - 150) / 100, 2) * 50 + Math.sin(x * 0.1) * Math.cos(z * 0.1) * 3;
    } else if (dist > 80) {
        const t = (dist - 80) / 70;
        return Math.sin(x * 0.15) * Math.cos(z * 0.15) * t * 2;
    }
    return 0;
}

// ==================== POSITION HELPERS ====================
export function isPositionFree(x, z, radius, excludeFarm = false) {
    if (excludeFarm && x > farmZone.minX && x < farmZone.maxX && z > farmZone.minZ && z < farmZone.maxZ) {
        return false;
    }

    for (const pos of occupiedPositions) {
        const dx = pos.x - x;
        const dz = pos.z - z;
        const minDist = radius + pos.radius;

        if (dx * dx + dz * dz < minDist * minDist) {
            return false;
        }
    }

    return true;
}

export function registerPosition(x, z, radius) {
    occupiedPositions.push({ x, z, radius });
}

export function getRandomPositionInFarm(radius = 1) {
    const bounds = {
        minX: farmZone.minX + 1,
        maxX: farmZone.maxX - 1,
        minZ: farmZone.minZ + 1,
        maxZ: farmZone.maxZ - 1
    };

    for (let attempts = 0; attempts < 50; attempts++) {
        const rawX = farmZone.minX + 2 + Math.random() * (farmZone.maxX - farmZone.minX - 4);
        const rawZ = farmZone.minZ + 2 + Math.random() * (farmZone.maxZ - farmZone.minZ - 4);
        const { x, z } = gridifyPosition(rawX, rawZ, bounds);

        if (isPositionFree(x, z, radius)) {
            return { x, z };
        }
    }

    return {
        ...gridifyPosition(
            farmZone.minX + 2 + Math.random() * (farmZone.maxX - farmZone.minX - 4),
            farmZone.minZ + 2 + Math.random() * (farmZone.maxZ - farmZone.minZ - 4),
            bounds
        )
    };
}

export function getRandomPositionOutsideFarm(minDist, maxDist, radius = 1) {
    for (let attempts = 0; attempts < 100; attempts++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = minDist + Math.random() * (maxDist - minDist);
        const rawX = Math.cos(angle) * dist;
        const rawZ = Math.sin(angle) * dist;
        const { x, z } = gridifyPosition(rawX, rawZ);

        if (isPositionFree(x, z, radius, true)) {
            return { x, z };
        }
    }

    const angle = Math.random() * Math.PI * 2;
    const dist = minDist + Math.random() * (maxDist - minDist);
    return gridifyPosition(Math.cos(angle) * dist, Math.sin(angle) * dist);
}

// Minimum distance between house centers
const MIN_HOUSE_SPACING = 16;

// Check if position collides with existing houses (exported for use by fields.js)
export function collidesWithHouses(x, z, minSpacing = MIN_HOUSE_SPACING) {
    for (const house of houses) {
        const hd = house.userData;
        const dx = hd.x - x;
        const dz = hd.z - z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < minSpacing) {
            return true;
        }
    }
    return false;
}

// Check if position collides with existing fields
export function collidesWithFields(x, z, padding = 2) {
    for (const field of fields) {
        const fd = field.userData;
        const halfW = (fd.width || 10) / 2 + padding;
        const halfD = (fd.depth || 10) / 2 + padding;

        // AABB collision check
        if (x > fd.x - halfW && x < fd.x + halfW &&
            z > fd.z - halfD && z < fd.z + halfD) {
            return true;
        }
    }
    return false;
}

export function findPosition(minDist = 12) {
    const spacing = Math.max(minDist, MIN_HOUSE_SPACING);

    // Try random positions in a ring around the village
    for (let attempts = 0; attempts < 100; attempts++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = HOUSE_MIN_RADIUS + Math.random() * (HOUSE_MAX_RADIUS - HOUSE_MIN_RADIUS);
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;

        // Snap to grid
        const snapped = snapToGrid(x, z, HOUSE_GRID_STEP);

        // Skip if in excluded areas
        if (isInPond(snapped.x, snapped.z, HOUSE_EXCLUDE_PADDING)) continue;
        if (isInHQArea(snapped.x, snapped.z)) continue;
        if (isInFarm(snapped.x, snapped.z, HOUSE_EXCLUDE_PADDING)) continue;
        if (isInFieldArea(snapped.x, snapped.z, HOUSE_EXCLUDE_PADDING)) continue;

        // Skip if too close to existing houses
        if (collidesWithHouses(snapped.x, snapped.z, spacing)) continue;

        // Skip if collides with existing fields
        if (collidesWithFields(snapped.x, snapped.z, HOUSE_EXCLUDE_PADDING)) continue;

        // Skip if position already occupied
        if (!isPositionFree(snapped.x, snapped.z, spacing / 2)) continue;

        // Found a valid position
        registerPosition(snapped.x, snapped.z, spacing / 2);
        return { x: snapped.x, z: snapped.z };
    }

    // Fallback: find ANY valid position with larger search
    for (let attempts = 0; attempts < 50; attempts++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 80;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;

        // Check ALL exclusion zones in fallback too
        if (isInPond(x, z, HOUSE_EXCLUDE_PADDING)) continue;
        if (isInHQArea(x, z)) continue;
        if (isInFarm(x, z, HOUSE_EXCLUDE_PADDING)) continue;
        if (isInFieldArea(x, z, HOUSE_EXCLUDE_PADDING)) continue;
        if (collidesWithHouses(x, z, spacing)) continue;
        if (collidesWithFields(x, z, HOUSE_EXCLUDE_PADDING)) continue;

        registerPosition(x, z, spacing / 2);
        return { x, z };
    }

    // Last resort
    const fallbackX = 50 + Math.random() * 30;
    const fallbackZ = (Math.random() - 0.5) * 60;
    registerPosition(fallbackX, fallbackZ, spacing / 2);
    return { x: fallbackX, z: fallbackZ };
}
