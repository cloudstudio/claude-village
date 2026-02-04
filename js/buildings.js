import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { materials } from './materials.js';
import { getHeightAt, houses } from './terrain.js';

// Headquarters reference
export let headquarters = null;

// ==================== HOUSE STYLES ====================
const wallColors = [
    'wallWhite', 'wallCream', 'wallYellow', 'wallPink',
    'wallBlue', 'wallGreen', 'wallOrange', 'wallBrick',
    'woodLight', 'woodBirch'
];

const roofColors = [
    'roofRed', 'roofBrown', 'roofBlue', 'roofGreen',
    'roofOrange', 'roofPurple'
];

const doorColors = ['doorDark', 'doorRed', 'doorBlue', 'doorGreen'];

function placeOnBase(geo, baseY) {
    geo.computeBoundingBox();
    const minY = geo.boundingBox.min.y;
    geo.translate(0, baseY - minY, 0);
}

// Place roof correctly on top of walls - handles rotated geometries properly
function placeRoofOnWalls(geo, wallTopY) {
    geo.computeBoundingBox();
    const minY = geo.boundingBox.min.y;
    // Move so the bottom of the roof sits exactly on the wall top
    geo.translate(0, wallTopY - minY, 0);
}

function getMaxY(geometries) {
    let maxY = -Infinity;
    geometries.forEach(geo => {
        geo.computeBoundingBox();
        maxY = Math.max(maxY, geo.boundingBox.max.y);
    });
    return maxY;
}

// ==================== HOUSE CREATION ====================
export function createHouse(scene, x, z) {
    const y = getHeightAt(x, z);
    const geometries = [];
    const roofGeos = [];

    // Random dimensions
    const width = 3.5 + Math.random() * 2.5;
    const depth = 3.5 + Math.random() * 2;
    const height = 2.5 + Math.random() * 1.5;
    const hasSecondFloor = Math.random() > 0.7;
    const totalHeight = hasSecondFloor ? height * 1.8 : height;

    // Random materials
    const wallMat = materials[wallColors[Math.floor(Math.random() * wallColors.length)]];
    const roofMat = materials[roofColors[Math.floor(Math.random() * roofColors.length)]];
    const doorMat = materials[doorColors[Math.floor(Math.random() * doorColors.length)]];
    const trimMat = Math.random() > 0.5 ? materials.white : materials.woodBirch;

    // Floor/Foundation
    const floorGeo = new THREE.BoxGeometry(width + 0.4, 0.35, depth + 0.4);
    floorGeo.translate(0, 0.175, 0);
    geometries.push({ geo: floorGeo, mat: materials.stone });

    // Walls
    const frontGeo = new THREE.BoxGeometry(width, totalHeight, 0.25);
    frontGeo.translate(0, totalHeight / 2 + 0.35, depth / 2);
    geometries.push({ geo: frontGeo, mat: wallMat });

    const backGeo = new THREE.BoxGeometry(width, totalHeight, 0.25);
    backGeo.translate(0, totalHeight / 2 + 0.35, -depth / 2);
    geometries.push({ geo: backGeo, mat: wallMat });

    const leftGeo = new THREE.BoxGeometry(0.25, totalHeight, depth);
    leftGeo.translate(-width / 2, totalHeight / 2 + 0.35, 0);
    geometries.push({ geo: leftGeo, mat: wallMat });

    const rightGeo = new THREE.BoxGeometry(0.25, totalHeight, depth);
    rightGeo.translate(width / 2, totalHeight / 2 + 0.35, 0);
    geometries.push({ geo: rightGeo, mat: wallMat });

    // Roof - ALL FLAT for simplicity and reliability
    const wallTopY = totalHeight + 0.35;
    const roofWidth = width + 0.8;
    const roofDepth = depth + 0.6;

    const addRoof = (geo) => {
        roofGeos.push(geo);
        geometries.push({ geo, mat: roofMat });
    };

    // Simple flat roof with slight overhang
    const flatRoof = new THREE.BoxGeometry(roofWidth, 0.25, roofDepth);
    flatRoof.translate(0, wallTopY + 0.125, 0);
    addRoof(flatRoof);

    // Decorative border/trim around the roof edge
    const borderH = 0.2;
    const borderThick = 0.12;

    // Front border
    const b1 = new THREE.BoxGeometry(roofWidth, borderH, borderThick);
    b1.translate(0, wallTopY + 0.25 + borderH / 2, roofDepth / 2 - borderThick / 2);
    geometries.push({ geo: b1, mat: trimMat });

    // Back border
    const b2 = new THREE.BoxGeometry(roofWidth, borderH, borderThick);
    b2.translate(0, wallTopY + 0.25 + borderH / 2, -roofDepth / 2 + borderThick / 2);
    geometries.push({ geo: b2, mat: trimMat });

    // Left border
    const b3 = new THREE.BoxGeometry(borderThick, borderH, roofDepth);
    b3.translate(-roofWidth / 2 + borderThick / 2, wallTopY + 0.25 + borderH / 2, 0);
    geometries.push({ geo: b3, mat: trimMat });

    // Right border
    const b4 = new THREE.BoxGeometry(borderThick, borderH, roofDepth);
    b4.translate(roofWidth / 2 - borderThick / 2, wallTopY + 0.25 + borderH / 2, 0);
    geometries.push({ geo: b4, mat: trimMat });

    const roofTopY = roofGeos.length > 0 ? getMaxY(roofGeos) : wallTopY + 0.25;

    // Chimney (50% chance) - track position for smoke
    let hasChimney = false;
    let chimneyPos = null;

    if (Math.random() > 0.5) {
        hasChimney = true;
        const chimneyX = (Math.random() - 0.5) * width * 0.4;
        const chimneyZ = (Math.random() - 0.5) * depth * 0.4;
        const chimneyHeight = 1.0 + Math.random() * 0.4;

        chimneyPos = {
            localX: chimneyX,
            localZ: chimneyZ,
            topY: roofTopY + chimneyHeight
        };

        const chimneyGeo = new THREE.BoxGeometry(0.45, chimneyHeight, 0.45);
        chimneyGeo.translate(chimneyX, roofTopY + chimneyHeight / 2, chimneyZ);
        geometries.push({ geo: chimneyGeo, mat: materials.stoneDark });

        // Chimney top cap
        const capGeo = new THREE.BoxGeometry(0.55, 0.1, 0.55);
        capGeo.translate(chimneyX, roofTopY + chimneyHeight + 0.05, chimneyZ);
        geometries.push({ geo: capGeo, mat: materials.stone });
    }

    // Door
    const doorHeight = 1.6 + Math.random() * 0.4;
    const doorWidth = 0.7 + Math.random() * 0.3;
    const doorGeo = new THREE.BoxGeometry(doorWidth, doorHeight, 0.12);
    doorGeo.translate(0, doorHeight / 2 + 0.35, depth / 2 + 0.15);
    geometries.push({ geo: doorGeo, mat: doorMat });

    // Door frame
    const frameGeo = new THREE.BoxGeometry(doorWidth + 0.2, doorHeight + 0.15, 0.08);
    frameGeo.translate(0, doorHeight / 2 + 0.4, depth / 2 + 0.18);
    geometries.push({ geo: frameGeo, mat: trimMat });

    // Windows - Front
    const windowsPerSide = hasSecondFloor ? 2 : 1;
    const winWidth = 0.6 + Math.random() * 0.3;
    const winHeight = 0.7 + Math.random() * 0.3;

    for (let floor = 0; floor < windowsPerSide; floor++) {
        const winY = floor === 0 ? height * 0.5 + 0.35 : height * 1.3 + 0.35;

        // Left window
        if (Math.random() > 0.2) {
            const winL = new THREE.BoxGeometry(winWidth, winHeight, 0.12);
            winL.translate(-width * 0.3, winY, depth / 2 + 0.15);
            geometries.push({ geo: winL, mat: materials.glass });
            // Frame
            const frameL = new THREE.BoxGeometry(winWidth + 0.15, winHeight + 0.15, 0.08);
            frameL.translate(-width * 0.3, winY, depth / 2 + 0.18);
            geometries.push({ geo: frameL, mat: trimMat });
        }

        // Right window
        if (Math.random() > 0.2) {
            const winR = new THREE.BoxGeometry(winWidth, winHeight, 0.12);
            winR.translate(width * 0.3, winY, depth / 2 + 0.15);
            geometries.push({ geo: winR, mat: materials.glass });
            const frameR = new THREE.BoxGeometry(winWidth + 0.15, winHeight + 0.15, 0.08);
            frameR.translate(width * 0.3, winY, depth / 2 + 0.18);
            geometries.push({ geo: frameR, mat: trimMat });
        }
    }

    // Side windows
    const sideWinY = height * 0.5 + 0.35;
    if (Math.random() > 0.3) {
        const sideWin1 = new THREE.BoxGeometry(0.12, winHeight, winWidth);
        sideWin1.translate(-width / 2 - 0.1, sideWinY, 0);
        geometries.push({ geo: sideWin1, mat: materials.glass });
    }
    if (Math.random() > 0.3) {
        const sideWin2 = new THREE.BoxGeometry(0.12, winHeight, winWidth);
        sideWin2.translate(width / 2 + 0.1, sideWinY, 0);
        geometries.push({ geo: sideWin2, mat: materials.glass });
    }

    // Back windows
    if (Math.random() > 0.4) {
        const backWin = new THREE.BoxGeometry(winWidth, winHeight, 0.12);
        backWin.translate(0, sideWinY, -depth / 2 - 0.1);
        geometries.push({ geo: backWin, mat: materials.glass });
    }

    // Porch (30% chance)
    if (Math.random() > 0.7) {
        const porchDepth = 1 + Math.random() * 0.5;
        const porchGeo = new THREE.BoxGeometry(width * 0.8, 0.15, porchDepth);
        porchGeo.translate(0, 0.25, depth / 2 + porchDepth / 2);
        geometries.push({ geo: porchGeo, mat: materials.wood });

        // Porch posts
        const postGeo = new THREE.BoxGeometry(0.15, 2, 0.15);
        const post1 = postGeo.clone();
        post1.translate(-width * 0.35, 1.1, depth / 2 + porchDepth - 0.2);
        geometries.push({ geo: post1, mat: materials.wood });
        const post2 = postGeo.clone();
        post2.translate(width * 0.35, 1.1, depth / 2 + porchDepth - 0.2);
        geometries.push({ geo: post2, mat: materials.wood });

        // Porch roof
        const porchRoof = new THREE.BoxGeometry(width * 0.9, 0.1, porchDepth + 0.3);
        porchRoof.translate(0, 2.2, depth / 2 + porchDepth / 2);
        geometries.push({ geo: porchRoof, mat: roofMat });
    }

    // Flower boxes (40% chance)
    if (Math.random() > 0.6) {
        const boxGeo = new THREE.BoxGeometry(winWidth + 0.1, 0.15, 0.2);
        const boxY = height * 0.5 - winHeight / 2 + 0.2;
        if (Math.random() > 0.5) {
            const box1 = boxGeo.clone();
            box1.translate(-width * 0.3, boxY, depth / 2 + 0.25);
            geometries.push({ geo: box1, mat: materials.wood });
        }
        if (Math.random() > 0.5) {
            const box2 = boxGeo.clone();
            box2.translate(width * 0.3, boxY, depth / 2 + 0.25);
            geometries.push({ geo: box2, mat: materials.wood });
        }
    }

    // Group by material
    const byMaterial = new Map();
    geometries.forEach(({ geo, mat }) => {
        if (!byMaterial.has(mat)) byMaterial.set(mat, []);
        // Ensure all geometries are non-indexed for compatibility
        const finalGeo = geo.index ? geo.toNonIndexed() : geo;
        byMaterial.get(mat).push(finalGeo);
    });

    const group = new THREE.Group();
    byMaterial.forEach((geos, mat) => {
        const merged = mergeGeometries(geos);
        if (merged) {
            const mesh = new THREE.Mesh(merged, mat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
        }
    });

    // Align to grid orientation
    group.rotation.y = 0;

    group.position.set(x, y, z);
    group.userData = {
        x, z, width, depth, height: totalHeight, agents: [],
        doorPosition: { x: x, y: y, z: z + depth / 2 + 1 },
        // Collision bounds - actual footprint for collision detection
        bounds: {
            width: width + 0.8,
            depth: depth + 0.8,
            radius: Math.max(width, depth) / 2 + 1.5
        },
        // Chimney info for smoke
        hasChimney: hasChimney,
        chimneyPos: chimneyPos
    };

    scene.add(group);
    houses.push(group);
    return group;
}

// ==================== HEADQUARTERS (BARN/FARMHOUSE) ====================
export function createHeadquarters(scene) {
    const x = -35;  // Positioned away from farm but not too far
    const z = 0;
    const y = getHeightAt(x, z);
    const geometries = [];
    const width = 12;
    const depth = 8;
    const wallHeight = 5;

    // Use existing materials
    const wallMat = materials.roofRed;  // Red barn walls
    const roofMat = materials.roofBrown;
    const trimMat = materials.white;

    // Foundation
    const foundGeo = new THREE.BoxGeometry(width + 1, 0.6, depth + 1);
    foundGeo.translate(0, 0.3, 0);
    geometries.push({ geo: foundGeo, mat: materials.stone });

    // SOLID WALLS - Front
    const frontGeo = new THREE.BoxGeometry(width, wallHeight, 0.5);
    frontGeo.translate(0, wallHeight / 2 + 0.6, depth / 2);
    geometries.push({ geo: frontGeo, mat: wallMat });

    // Back wall
    const backGeo = new THREE.BoxGeometry(width, wallHeight, 0.5);
    backGeo.translate(0, wallHeight / 2 + 0.6, -depth / 2);
    geometries.push({ geo: backGeo, mat: wallMat });

    // Left wall
    const leftGeo = new THREE.BoxGeometry(0.5, wallHeight, depth);
    leftGeo.translate(-width / 2, wallHeight / 2 + 0.6, 0);
    geometries.push({ geo: leftGeo, mat: wallMat });

    // Right wall (with door opening simulated by color)
    const rightGeo = new THREE.BoxGeometry(0.5, wallHeight, depth);
    rightGeo.translate(width / 2, wallHeight / 2 + 0.6, 0);
    geometries.push({ geo: rightGeo, mat: wallMat });

    // Roof - Simple flat roof with slight overhang
    const roofOverhang = 2;
    const roofThickness = 0.5;

    const roofGeo = new THREE.BoxGeometry(width + roofOverhang, roofThickness, depth + roofOverhang);
    roofGeo.translate(0, wallHeight + 0.6 + roofThickness / 2, 0);
    geometries.push({ geo: roofGeo, mat: roofMat });

    // Big barn door (facing farm - on RIGHT side, +X direction)
    const barnDoorH = 3.5;
    const barnDoorW = 3;
    const doorGeo = new THREE.BoxGeometry(0.3, barnDoorH, barnDoorW);
    doorGeo.translate(width / 2 + 0.2, barnDoorH / 2 + 0.6, 0);
    geometries.push({ geo: doorGeo, mat: materials.wood });

    // Door frame
    const doorFrameGeo = new THREE.BoxGeometry(0.2, barnDoorH + 0.4, barnDoorW + 0.5);
    doorFrameGeo.translate(width / 2 + 0.35, barnDoorH / 2 + 0.8, 0);
    geometries.push({ geo: doorFrameGeo, mat: trimMat });

    // Cross beams on door
    const crossH = new THREE.BoxGeometry(0.1, 0.2, barnDoorW - 0.2);
    crossH.translate(width / 2 + 0.35, barnDoorH / 2 + 0.6, 0);
    geometries.push({ geo: crossH, mat: materials.woodLight });

    // Hay loft door (front)
    const loftDoorGeo = new THREE.BoxGeometry(2, 1.8, 0.2);
    loftDoorGeo.translate(0, wallHeight + 1.5, depth / 2 + 0.3);
    geometries.push({ geo: loftDoorGeo, mat: materials.wood });

    // Windows on left side
    for (let i = -1; i <= 1; i += 2) {
        const winGeo = new THREE.BoxGeometry(0.2, 1.2, 1.2);
        winGeo.translate(-width / 2 - 0.15, wallHeight / 2 + 1, i * 2.5);
        geometries.push({ geo: winGeo, mat: materials.glass });
    }

    // White trim lines
    const trim1 = new THREE.BoxGeometry(width + 0.4, 0.2, 0.6);
    trim1.translate(0, wallHeight + 0.6, depth / 2 + 0.1);
    geometries.push({ geo: trim1, mat: trimMat });

    const trim2 = new THREE.BoxGeometry(width + 0.4, 0.2, 0.6);
    trim2.translate(0, wallHeight + 0.6, -depth / 2 - 0.1);
    geometries.push({ geo: trim2, mat: trimMat });

    // Silo
    const siloRadius = 2;
    const siloHeight = 9;
    const siloGeo = new THREE.CylinderGeometry(siloRadius, siloRadius, siloHeight, 16);
    siloGeo.translate(-width / 2 - siloRadius - 2, siloHeight / 2 + 0.3, -depth / 4);
    geometries.push({ geo: siloGeo, mat: materials.stoneDark });

    // Silo roof
    const siloRoofGeo = new THREE.ConeGeometry(siloRadius + 0.4, 2.5, 16);
    siloRoofGeo.translate(-width / 2 - siloRadius - 2, siloHeight + 1.5, -depth / 4);
    geometries.push({ geo: siloRoofGeo, mat: roofMat });

    // Silo rings (decorative)
    for (let i = 0; i < 3; i++) {
        const ringGeo = new THREE.TorusGeometry(siloRadius + 0.05, 0.1, 8, 16);
        ringGeo.rotateX(Math.PI / 2);
        ringGeo.translate(-width / 2 - siloRadius - 2, 2 + i * 3, -depth / 4);
        geometries.push({ geo: ringGeo, mat: materials.stone });
    }

    // Group by material
    const byMaterial = new Map();
    geometries.forEach(({ geo, mat }) => {
        if (!byMaterial.has(mat)) byMaterial.set(mat, []);
        const finalGeo = geo.index ? geo.toNonIndexed() : geo;
        byMaterial.get(mat).push(finalGeo);
    });

    const group = new THREE.Group();
    byMaterial.forEach((geos, mat) => {
        const merged = mergeGeometries(geos);
        if (merged) {
            const mesh = new THREE.Mesh(merged, mat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
        }
    });

    group.position.set(x, y, z);
    group.userData = {
        x, z, width, depth, height: wallHeight + 0.5, agents: [],
        doorPosition: { x: x + width / 2 + 2, y: y, z: z },  // Door faces +X (toward farm)
        isHQ: true,
        bounds: {
            width: width + 6,
            depth: depth + 4,
            radius: Math.max(width, depth) / 2 + 5
        }
    };

    scene.add(group);
    houses.push(group);
    headquarters = group;
    return group;
}

// ==================== FENCE ====================
export function createFence(scene, x1, z1, x2, z2) {
    const group = new THREE.Group();
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dz, dx);
    const postCount = Math.ceil(length / 2);

    for (let i = 0; i <= postCount; i++) {
        const t = i / postCount;
        const px = x1 + dx * t;
        const pz = z1 + dz * t;

        const post = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.8, 0.15),
            materials.fence
        );
        post.position.set(px, 0.4, pz);
        post.castShadow = true;
        group.add(post);
    }

    // Rails
    const railGeo = new THREE.BoxGeometry(length, 0.08, 0.08);
    const rail1 = new THREE.Mesh(railGeo, materials.fence);
    rail1.position.set((x1 + x2) / 2, 0.25, (z1 + z2) / 2);
    rail1.rotation.y = angle;
    rail1.castShadow = true;
    group.add(rail1);

    const rail2 = new THREE.Mesh(railGeo, materials.fence);
    rail2.position.set((x1 + x2) / 2, 0.55, (z1 + z2) / 2);
    rail2.rotation.y = angle;
    rail2.castShadow = true;
    group.add(rail2);

    scene.add(group);
    return group;
}

// ==================== POND ====================
export let pondWater = null;
export let pondWaterData = null;

export function createPond(scene, x, z, radius = 6) {
    const group = new THREE.Group();

    // Animated water material
    const animatedWaterMat = new THREE.MeshPhysicalMaterial({
        color: 0x0088cc,
        transmission: 0.7,
        opacity: 0.85,
        roughness: 0.15,
        metalness: 0.1,
        transparent: true,
        ior: 1.33, // Water IOR
        thickness: 0.5
    });

    // Water surface with subdivisions for wave animation
    const waterGeo = new THREE.CircleGeometry(radius, 48, 48);
    // Convert to position-based vertices for animation
    const water = new THREE.Mesh(waterGeo, animatedWaterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.08;
    water.receiveShadow = true;
    group.add(water);

    // Store original positions for wave animation
    const positions = water.geometry.attributes.position;
    const originalY = new Float32Array(positions.count);
    for (let i = 0; i < positions.count; i++) {
        originalY[i] = positions.getY(i);
    }

    pondWater = water;
    pondWaterData = {
        originalY,
        radius,
        centerX: x,
        centerZ: z
    };

    // Deeper center with slight transparency
    const deepWater = new THREE.Mesh(
        new THREE.CircleGeometry(radius * 0.5, 24),
        materials.waterDeep
    );
    deepWater.rotation.x = -Math.PI / 2;
    deepWater.position.y = 0.03;
    group.add(deepWater);

    // Sand/dirt edge
    const edge = new THREE.Mesh(
        new THREE.RingGeometry(radius, radius + 1.2, 32),
        materials.sand
    );
    edge.rotation.x = -Math.PI / 2;
    edge.position.y = 0.02;
    edge.receiveShadow = true;
    group.add(edge);

    // Rocks around pond
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
        const dist = radius + 0.3 + Math.random() * 0.8;
        const rockSize = 0.3 + Math.random() * 0.4;
        const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(rockSize, 0),
            Math.random() > 0.5 ? materials.stoneDark : materials.stone
        );
        rock.position.set(Math.cos(angle) * dist, rockSize * 0.3, Math.sin(angle) * dist);
        rock.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
        rock.scale.set(1, 0.6, 1);
        rock.castShadow = true;
        group.add(rock);
    }

    // Add some lily pads
    for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 1 + Math.random() * (radius - 2);
        const lilyPad = new THREE.Mesh(
            new THREE.CircleGeometry(0.3 + Math.random() * 0.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x228822, roughness: 0.8 })
        );
        lilyPad.rotation.x = -Math.PI / 2;
        lilyPad.position.set(Math.cos(angle) * dist, 0.1, Math.sin(angle) * dist);
        lilyPad.rotation.z = Math.random() * Math.PI;
        group.add(lilyPad);
    }

    group.position.set(x, 0.1, z);
    scene.add(group);
    return group;
}
