import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { materials, fieldMaterials } from './materials.js';
import { getHeightAt, fields, trees, registerPosition, collidesWithHouses } from './terrain.js';
import { FieldTypes, fieldConfig, farmZone, pondPosition, FIELD_GRID } from './config.js';

// ==================== FIELD POSITIONING ====================
// SIMPLE: Grid of fields, skipping blocked rows (where HQ, farm, pond are)
let nextFieldIndex = 0;

// Check if a row is blocked
function isRowBlocked(row) {
    return FIELD_GRID.blockedRows && FIELD_GRID.blockedRows.includes(row);
}

// Convert logical index to grid position, skipping blocked rows
// Returns CENTER of the cell (not corner)
function getFieldPositionByIndex(logicalIndex) {
    const cellSize = FIELD_GRID.fieldSize + FIELD_GRID.gap;
    const cols = FIELD_GRID.columns;

    // Count through valid cells until we reach logicalIndex
    let validCount = 0;
    let gridRow = 0;
    let gridCol = 0;

    for (let i = 0; i < 1000; i++) {  // Safety limit
        gridRow = Math.floor(i / cols);
        gridCol = i % cols;

        // Skip blocked rows entirely
        if (isRowBlocked(gridRow)) {
            // Jump to start of next row
            i = (gridRow + 1) * cols - 1;  // -1 because loop will add 1
            continue;
        }

        if (validCount === logicalIndex) {
            break;
        }
        validCount++;
    }

    // Return CENTER of cell, not corner
    // Cell corner + half of cell size = center
    return {
        x: FIELD_GRID.startX + gridCol * cellSize + FIELD_GRID.fieldSize / 2,
        z: FIELD_GRID.startZ + gridRow * cellSize + FIELD_GRID.fieldSize / 2,
        row: gridRow,
        col: gridCol
    };
}

// Get next field position (skipping blocked rows)
export function getNextFieldPosition() {
    const pos = getFieldPositionByIndex(nextFieldIndex);
    nextFieldIndex++;
    return pos;
}

// Reset field placement (for testing)
export function resetFieldPlacement() {
    nextFieldIndex = 0;
}

// Remove trees that overlap with a field area
function removeTreesInArea(scene, x, z, width, depth) {
    const halfW = width / 2 + 2;  // Add padding
    const halfD = depth / 2 + 2;

    const treesToRemove = [];

    for (let i = trees.length - 1; i >= 0; i--) {
        const tree = trees[i];
        const tx = tree.position.x;
        const tz = tree.position.z;

        // Check if tree is within field bounds
        if (tx > x - halfW && tx < x + halfW && tz > z - halfD && tz < z + halfD) {
            treesToRemove.push(i);
        }
    }

    // Remove trees from scene and array
    for (const idx of treesToRemove) {
        const tree = trees[idx];
        scene.remove(tree);
        trees.splice(idx, 1);
    }

    if (treesToRemove.length > 0) {
        console.log(`Removed ${treesToRemove.length} trees for field placement`);
    }

    return treesToRemove.length;
}

// ==================== FIELD CREATION ====================

// Seeded random for deterministic but varied results
function seededRandom(seed) {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
}

// Create a single plant/crop based on field type
// mature: false = young/starting plants, true = fully grown with fruits
function createPlantGeometry(type, row, col, fieldWidth, fieldDepth, rows, cols, mature = true) {
    const geometries = [];

    // Calculate plant position within field
    const spacingX = fieldWidth / (cols + 1);
    const spacingZ = fieldDepth / (rows + 1);
    const localX = -fieldWidth / 2 + spacingX * (col + 1);
    const localZ = -fieldDepth / 2 + spacingZ * (row + 1);

    // Seed for this plant (deterministic but varied)
    const plantSeed = row * 100 + col;

    // Growth factors: young plants are MUCH smaller and have fewer elements
    // Make the difference very dramatic so it's clearly visible
    const sizeFactor = mature ? 1.0 : 0.15;  // 15% size when young
    const densityFactor = mature ? 1.0 : 0.25;  // 25% density when young

    switch (type) {
        case FieldTypes.ORCHARD: {
            // Tree trunk with slight variation
            const trunkHeight = (1.4 + seededRandom(plantSeed) * 0.3) * sizeFactor;
            const trunkGeo = new THREE.CylinderGeometry(0.15 * sizeFactor, 0.22 * sizeFactor, trunkHeight, 6);
            trunkGeo.translate(localX, trunkHeight / 2, localZ);
            geometries.push({ geo: trunkGeo, mat: 'trunk' });

            // Always add branches and crown (even when young, just smaller)
            // Visible branches (3 extending from trunk)
            for (let b = 0; b < 3; b++) {
                const branchAngle = (b / 3) * Math.PI * 2 + seededRandom(plantSeed + b) * 0.5;
                const branchLen = (0.4 + seededRandom(plantSeed + b + 10) * 0.2) * sizeFactor;
                const branchGeo = new THREE.CylinderGeometry(0.04 * sizeFactor, 0.06 * sizeFactor, branchLen, 4);
                branchGeo.rotateZ(Math.PI / 3);
                branchGeo.rotateY(branchAngle);
                branchGeo.translate(
                    localX + Math.cos(branchAngle) * 0.2 * sizeFactor,
                    trunkHeight * 0.7,
                    localZ + Math.sin(branchAngle) * 0.2 * sizeFactor
                );
                geometries.push({ geo: branchGeo, mat: 'trunk' });
            }

            // Tree crown (ellipsoid with random scale)
            const crownScaleX = 0.85 + seededRandom(plantSeed + 20) * 0.35;
            const crownScaleZ = 0.85 + seededRandom(plantSeed + 21) * 0.35;
            const crownGeo = new THREE.SphereGeometry(0.85 * sizeFactor, 8, 6);
            crownGeo.scale(crownScaleX, 1, crownScaleZ);
            crownGeo.translate(localX, trunkHeight + 0.6 * sizeFactor, localZ);
            geometries.push({ geo: crownGeo, mat: 'leaves' });

            // ALWAYS add fruits - green/small when young, red/abundant when mature
            const fruitCount = mature
                ? 15 + Math.floor(seededRandom(plantSeed + 30) * 10)  // 15-25 fruits when mature
                : 4 + Math.floor(seededRandom(plantSeed + 30) * 3);   // 4-7 small fruits when young
            const fruitSize = mature ? 0.12 : 0.05;  // Smaller fruits when young
            const fruitMat = mature ? 'fruit' : 'fruitGreen';  // Green when young

            for (let i = 0; i < fruitCount; i++) {
                const angle = seededRandom(plantSeed + i + 40) * Math.PI * 2;
                const radius = (0.3 + seededRandom(plantSeed + i + 50) * 0.4) * sizeFactor;
                const heightOffset = (seededRandom(plantSeed + i + 60) * 0.6 - 0.2) * sizeFactor;
                const sizeVariation = fruitSize + seededRandom(plantSeed + i + 70) * 0.03;
                const fruitGeo = new THREE.SphereGeometry(sizeVariation, 6, 4);
                fruitGeo.translate(
                    localX + Math.cos(angle) * radius * crownScaleX,
                    trunkHeight + 0.4 * sizeFactor + heightOffset,
                    localZ + Math.sin(angle) * radius * crownScaleZ
                );
                // When mature, vary between red and dark red; when young, all green
                const matType = mature
                    ? (seededRandom(plantSeed + i + 80) > 0.5 ? 'fruit' : 'fruitDark')
                    : fruitMat;
                geometries.push({ geo: fruitGeo, mat: matType });
            }
            break;
        }

        case FieldTypes.RICE: {
            // Rice stalks - more when mature, but always visible
            const baseStalkCount = mature ? 10 : 4;  // More stalks overall
            const stalkCount = baseStalkCount + Math.floor(seededRandom(plantSeed) * (mature ? 5 : 2));
            for (let i = 0; i < stalkCount; i++) {
                const offsetX = (seededRandom(plantSeed + i * 3) - 0.5) * 0.35;
                const offsetZ = (seededRandom(plantSeed + i * 3 + 1) - 0.5) * 0.35;
                const height = (0.4 + seededRandom(plantSeed + i * 3 + 2) * 0.5) * sizeFactor;

                // Main stalk
                const stalkGeo = new THREE.CylinderGeometry(0.015, 0.025, height, 4);
                const lean = (seededRandom(plantSeed + i + 20) - 0.5) * 0.15;
                stalkGeo.translate(localX + offsetX + lean * 0.5, height / 2, localZ + offsetZ);
                geometries.push({ geo: stalkGeo, mat: 'stalk' });

                // ALWAYS add grain heads - smaller and green when young
                const grainSize = mature ? 0.04 : 0.02;
                const grainHeight = mature ? 0.12 : 0.06;
                const grainMat = mature ? 'grain' : 'stalk';  // Green when young

                const grainGeo = new THREE.ConeGeometry(grainSize, grainHeight, 5);
                grainGeo.rotateX(Math.PI);
                grainGeo.rotateZ(lean * 2);
                grainGeo.translate(localX + offsetX + lean, height + 0.02, localZ + offsetZ);
                geometries.push({ geo: grainGeo, mat: grainMat });

                // Add awns (more when mature)
                const awnCount = mature ? 3 : 1;
                for (let a = 0; a < awnCount; a++) {
                    const awnAngle = (a / 3) * Math.PI * 2;
                    const awnLen = mature ? 0.08 : 0.04;
                    const awnGeo = new THREE.CylinderGeometry(0.003, 0.003, awnLen, 3);
                    awnGeo.rotateZ(0.3 + seededRandom(plantSeed + i + a + 30) * 0.2);
                    awnGeo.rotateY(awnAngle);
                    awnGeo.translate(
                        localX + offsetX + lean + Math.cos(awnAngle) * 0.03,
                        height + 0.04,
                        localZ + offsetZ + Math.sin(awnAngle) * 0.03
                    );
                    geometries.push({ geo: awnGeo, mat: grainMat });
                }
            }
            break;
        }

        case FieldTypes.WHEAT: {
            // Wheat stalks - more abundant when mature
            const baseStalkCount = mature ? 12 : 5;  // More stalks overall
            const stalkCount = baseStalkCount + Math.floor(seededRandom(plantSeed) * (mature ? 6 : 2));
            for (let i = 0; i < stalkCount; i++) {
                const offsetX = (seededRandom(plantSeed + i * 4) - 0.5) * 0.28;
                const offsetZ = (seededRandom(plantSeed + i * 4 + 1) - 0.5) * 0.28;
                const height = (0.65 + seededRandom(plantSeed + i * 4 + 2) * 0.35) * sizeFactor;

                const leanAngle = (0.08 + seededRandom(plantSeed + i + 20) * 0.18);
                const leanDir = seededRandom(plantSeed + i + 21) * Math.PI * 2;

                const stalkGeo = new THREE.CylinderGeometry(0.012, 0.018, height, 4);
                stalkGeo.translate(0, height / 2, 0);
                stalkGeo.rotateX(leanAngle * Math.cos(leanDir));
                stalkGeo.rotateZ(leanAngle * Math.sin(leanDir));
                stalkGeo.translate(localX + offsetX, 0, localZ + offsetZ);
                geometries.push({ geo: stalkGeo, mat: 'stalk' });

                // ALWAYS add wheat heads - smaller and green when young
                const headSize = mature ? 0.035 : 0.018;
                const headHeight = mature ? 0.16 : 0.08;
                const headMat = mature ? 'grain' : 'stalk';  // Green when young

                const headGeo = new THREE.ConeGeometry(headSize, headHeight, 5);
                const headX = localX + offsetX + Math.sin(leanDir) * leanAngle * height;
                const headZ = localZ + offsetZ + Math.cos(leanDir) * leanAngle * height;
                const headY = height * Math.cos(leanAngle);
                headGeo.translate(headX, headY + 0.04 * sizeFactor, headZ);
                geometries.push({ geo: headGeo, mat: headMat });

                // Add awns (more and longer when mature)
                const awnCount = mature ? 4 : 2;
                for (let a = 0; a < awnCount; a++) {
                    const awnAngle = (a / 4) * Math.PI * 2 + seededRandom(plantSeed + i + a) * 0.3;
                    const awnLen = mature ? 0.1 : 0.04;
                    const awnGeo = new THREE.CylinderGeometry(0.002, 0.002, awnLen, 3);
                    awnGeo.rotateZ(0.4);
                    awnGeo.rotateY(awnAngle);
                    awnGeo.translate(
                        headX + Math.cos(awnAngle) * 0.025 * sizeFactor,
                        headY + 0.08 * sizeFactor,
                        headZ + Math.sin(awnAngle) * 0.025 * sizeFactor
                    );
                    geometries.push({ geo: awnGeo, mat: headMat });
                }
            }
            break;
        }

        case FieldTypes.VEGETABLE: {
            const vegType = Math.floor(seededRandom(plantSeed * 7.3) * 4);

            if (vegType === 0) {
                // Cabbage - smaller when young, with some leaves always visible
                const baseSize = (0.22 + seededRandom(plantSeed) * 0.08) * sizeFactor;
                const cabbageGeo = new THREE.SphereGeometry(baseSize, 8, 6);
                const scaleX = 0.9 + seededRandom(plantSeed + 1) * 0.25;
                const scaleZ = 0.9 + seededRandom(plantSeed + 2) * 0.25;
                cabbageGeo.scale(scaleX, 0.85, scaleZ);
                cabbageGeo.translate(localX, baseSize * 0.85, localZ);
                geometries.push({ geo: cabbageGeo, mat: 'vegGreen' });

                // Outer leaves - fewer and smaller when young
                const leafCount = mature ? 4 : 2;
                const leafScale = mature ? 1.0 : 0.6;
                for (let l = 0; l < leafCount; l++) {
                    const leafAngle = (l / leafCount) * Math.PI * 2 + seededRandom(plantSeed + l + 10) * 0.5;
                    const leafGeo = new THREE.SphereGeometry(0.12 * leafScale, 4, 3);
                    leafGeo.scale(1.5, 0.3, 1);
                    leafGeo.rotateY(leafAngle);
                    leafGeo.translate(
                        localX + Math.cos(leafAngle) * baseSize * 0.8,
                        0.08 * sizeFactor,
                        localZ + Math.sin(leafAngle) * baseSize * 0.8
                    );
                    geometries.push({ geo: leafGeo, mat: 'leaves' });
                }
            } else if (vegType === 1) {
                // Carrot - always show some part, smaller carrot tip when young
                const carrotSize = mature ? 1.0 : 0.4;
                const carrotGeo = new THREE.ConeGeometry(0.07 * carrotSize, 0.28 * carrotSize, 6);
                carrotGeo.rotateX(Math.PI);
                carrotGeo.translate(localX, 0.14 * carrotSize, localZ);
                // When young, show as light green (buried), when mature show orange
                geometries.push({ geo: carrotGeo, mat: mature ? 'vegOrange' : 'fruitGreen' });

                const frondCount = mature ? 5 : 3;  // More fronds
                const frondSize = mature ? 1.0 : 0.5;
                for (let f = 0; f < frondCount; f++) {
                    const angle = (f / frondCount) * Math.PI * 2 + seededRandom(plantSeed + f) * 0.4;
                    const frondGeo = new THREE.ConeGeometry(0.06 * frondSize, 0.18 * frondSize, 4);
                    frondGeo.translate(0, 0.09 * frondSize, 0);
                    frondGeo.rotateZ(0.3);
                    frondGeo.rotateY(angle);
                    frondGeo.translate(localX, mature ? 0.28 : 0.05, localZ);
                    geometries.push({ geo: frondGeo, mat: 'leaves' });
                }
            } else if (vegType === 2) {
                // Tomato plant - always show tomatoes, green when young
                const stemHeight = (0.45 + seededRandom(plantSeed) * 0.15) * sizeFactor;
                const stemGeo = new THREE.CylinderGeometry(0.025 * sizeFactor, 0.035 * sizeFactor, stemHeight, 4);
                stemGeo.translate(localX, stemHeight / 2, localZ);
                geometries.push({ geo: stemGeo, mat: 'stalk' });

                // Leaves on stem - more when mature
                const leafCount = mature ? 3 : 2;
                for (let l = 0; l < leafCount; l++) {
                    const leafGeo = new THREE.BoxGeometry(0.15 * sizeFactor, 0.02, 0.1 * sizeFactor);
                    leafGeo.translate(
                        localX + (l % 2 === 0 ? 0.1 : -0.1) * sizeFactor,
                        (0.15 + l * 0.12) * sizeFactor,
                        localZ
                    );
                    geometries.push({ geo: leafGeo, mat: 'leaves' });
                }

                // ALWAYS add tomatoes - green and small when young, red when mature
                const tomatoCount = mature
                    ? 5 + Math.floor(seededRandom(plantSeed + 1) * 4)  // 5-9 tomatoes
                    : 2 + Math.floor(seededRandom(plantSeed + 1) * 2); // 2-4 small green ones
                const tomatoSize = mature ? 0.08 : 0.04;
                const tomatoMat = mature ? 'vegRed' : 'fruitGreen';

                for (let t = 0; t < tomatoCount; t++) {
                    const angle = seededRandom(plantSeed + t + 10) * Math.PI * 2;
                    const radius = (0.08 + seededRandom(plantSeed + t + 20) * 0.12) * sizeFactor;
                    const heightPos = (0.15 + seededRandom(plantSeed + t + 30) * (stemHeight - 0.2));
                    const size = tomatoSize + seededRandom(plantSeed + t + 40) * 0.02;

                    const tomatoGeo = new THREE.SphereGeometry(size, 6, 4);
                    tomatoGeo.translate(
                        localX + Math.cos(angle) * radius,
                        heightPos,
                        localZ + Math.sin(angle) * radius
                    );
                    geometries.push({ geo: tomatoGeo, mat: tomatoMat });
                }
            } else {
                // Lettuce - always show leaves, fewer when young
                const baseGeo = new THREE.SphereGeometry(0.18 * sizeFactor, 8, 4);
                baseGeo.scale(1, 0.5, 1);
                baseGeo.translate(localX, 0.09 * sizeFactor, localZ);
                geometries.push({ geo: baseGeo, mat: 'vegGreen' });

                // Outer leaves - more when mature
                const leafCount = mature ? 6 : 3;
                const leafScale = mature ? 1.0 : 0.5;
                for (let l = 0; l < leafCount; l++) {
                    const angle = (l / leafCount) * Math.PI * 2;
                    const leafGeo = new THREE.SphereGeometry(0.08 * leafScale, 4, 3);
                    leafGeo.scale(1.8, 0.25, 1);
                    leafGeo.rotateY(angle + seededRandom(plantSeed + l) * 0.3);
                    leafGeo.translate(
                        localX + Math.cos(angle) * 0.15 * sizeFactor,
                        0.05 * sizeFactor,
                        localZ + Math.sin(angle) * 0.15 * sizeFactor
                    );
                    geometries.push({ geo: leafGeo, mat: 'leaves' });
                }
            }
            break;
        }

        case FieldTypes.VINEYARD: {
            // Vine post - always present
            const postGeo = new THREE.BoxGeometry(0.1, 1.3 * sizeFactor, 0.1);
            postGeo.translate(localX, 0.65 * sizeFactor, localZ);
            geometries.push({ geo: postGeo, mat: 'trunk' });

            // Wires - always present
            const wireGeo = new THREE.CylinderGeometry(0.015, 0.015, spacingX * 0.9, 4);
            wireGeo.rotateZ(Math.PI / 2);
            wireGeo.translate(localX, 1.05 * sizeFactor, localZ);
            geometries.push({ geo: wireGeo, mat: 'trunk' });

            const wire2Geo = new THREE.CylinderGeometry(0.015, 0.015, spacingX * 0.9, 4);
            wire2Geo.rotateZ(Math.PI / 2);
            wire2Geo.translate(localX, 0.75 * sizeFactor, localZ);
            geometries.push({ geo: wire2Geo, mat: 'trunk' });

            // ALWAYS add grapes - green and smaller when young, purple when mature
            const clusterCount = mature
                ? 4 + Math.floor(seededRandom(plantSeed) * 3)  // 4-7 clusters when mature
                : 2 + Math.floor(seededRandom(plantSeed) * 1); // 2-3 small clusters when young
            const grapeSize = mature ? 0.04 : 0.02;
            const grapeMat = mature ? 'grape' : 'grapeGreen';

            for (let c = 0; c < clusterCount; c++) {
                const clusterX = localX + (seededRandom(plantSeed + c * 10) - 0.5) * 0.5 * sizeFactor;
                const clusterBaseY = (0.5 + seededRandom(plantSeed + c * 10 + 1) * 0.3) * sizeFactor;

                const grapeCount = mature
                    ? 15 + Math.floor(seededRandom(plantSeed + c * 10 + 2) * 8)  // 15-23 grapes per cluster
                    : 5 + Math.floor(seededRandom(plantSeed + c * 10 + 2) * 3);  // 5-8 small grapes

                for (let g = 0; g < grapeCount; g++) {
                    const phi = seededRandom(plantSeed + c * 100 + g) * Math.PI;
                    const theta = seededRandom(plantSeed + c * 100 + g + 50) * Math.PI * 2;
                    const r = (0.06 + seededRandom(plantSeed + c * 100 + g + 100) * 0.04) * sizeFactor;

                    const gx = Math.sin(phi) * Math.cos(theta) * r;
                    const gy = -Math.cos(phi) * r * 1.5;
                    const gz = Math.sin(phi) * Math.sin(theta) * r;

                    const grapeGeo = new THREE.SphereGeometry(grapeSize, 4, 3);
                    grapeGeo.translate(
                        clusterX + gx,
                        clusterBaseY + gy,
                        localZ + gz
                    );
                    geometries.push({ geo: grapeGeo, mat: grapeMat });
                }
            }

            // Leaves - more when mature
            const leafCount = mature ? 5 + Math.floor(seededRandom(plantSeed + 5) * 3) : 2;
            for (let l = 0; l < leafCount; l++) {
                const leafX = localX + (seededRandom(plantSeed + l + 20) - 0.5) * 0.4 * sizeFactor;
                const leafY = (0.7 + seededRandom(plantSeed + l + 21) * 0.35) * sizeFactor;
                const leafAngle = seededRandom(plantSeed + l + 22) * Math.PI * 2;

                const leafGeo = new THREE.BoxGeometry(0.2 * sizeFactor, 0.02, 0.18 * sizeFactor);
                leafGeo.rotateY(leafAngle);
                leafGeo.rotateX(seededRandom(plantSeed + l + 23) * 0.3 - 0.15);
                leafGeo.translate(leafX, leafY, localZ);
                geometries.push({ geo: leafGeo, mat: 'leaves' });
            }
            break;
        }
    }

    return geometries;
}

// Create furrows/rows pattern on the ground
function createFurrows(fieldWidth, fieldDepth, rows, type) {
    const geometries = [];
    const furrowSpacing = fieldDepth / (rows + 1);

    for (let i = 1; i <= rows; i++) {
        const z = -fieldDepth / 2 + furrowSpacing * i;

        // Furrow ridge (raised earth)
        const ridgeGeo = new THREE.BoxGeometry(fieldWidth - 0.5, 0.15, 0.4);
        ridgeGeo.translate(0, 0.08, z);
        geometries.push({ geo: ridgeGeo, mat: 'soil' });
    }

    return geometries;
}

// Create the base soil/ground for a field
function createFieldBase(fieldWidth, fieldDepth, type) {
    const geometries = [];

    // Main soil base
    const baseGeo = new THREE.BoxGeometry(fieldWidth, 0.1, fieldDepth);
    baseGeo.translate(0, 0.05, 0);

    if (type === FieldTypes.RICE) {
        // Rice paddy has water
        geometries.push({ geo: baseGeo, mat: 'water' });

        // Raised borders for rice paddy
        const borderThickness = 0.3;
        const borderHeight = 0.25;

        // Front border
        const front = new THREE.BoxGeometry(fieldWidth + borderThickness * 2, borderHeight, borderThickness);
        front.translate(0, borderHeight / 2, fieldDepth / 2 + borderThickness / 2);
        geometries.push({ geo: front, mat: 'soil' });

        // Back border
        const back = new THREE.BoxGeometry(fieldWidth + borderThickness * 2, borderHeight, borderThickness);
        back.translate(0, borderHeight / 2, -fieldDepth / 2 - borderThickness / 2);
        geometries.push({ geo: back, mat: 'soil' });

        // Left border
        const left = new THREE.BoxGeometry(borderThickness, borderHeight, fieldDepth);
        left.translate(-fieldWidth / 2 - borderThickness / 2, borderHeight / 2, 0);
        geometries.push({ geo: left, mat: 'soil' });

        // Right border
        const right = new THREE.BoxGeometry(borderThickness, borderHeight, fieldDepth);
        right.translate(fieldWidth / 2 + borderThickness / 2, borderHeight / 2, 0);
        geometries.push({ geo: right, mat: 'soil' });
    } else {
        geometries.push({ geo: baseGeo, mat: 'soil' });
    }

    return geometries;
}

// Main function to create a field
export function createField(scene, type, x = null, z = null, options = {}) {
    // If no position provided, get next position from grid (centered)
    if (x === null || z === null) {
        const pos = getNextFieldPosition();
        x = pos.x;
        z = pos.z;
    }

    const config = fieldConfig[type] || fieldConfig[FieldTypes.VEGETABLE];
    // Each field type can have its own size (centered in grid cell)
    const fieldWidth = options.width || config.width || FIELD_GRID.fieldSize;
    const fieldDepth = options.depth || config.depth || FIELD_GRID.fieldSize;
    const rows = options.rows || config.rows;
    const cols = options.cols || config.cols;

    // Check if position collides with existing houses
    if (collidesWithHouses(x, z, fieldWidth / 2 + 2)) {
        console.warn('Cannot create field: house exists at position', x, z);
        return null;
    }

    // Remove any trees in the field area
    removeTreesInArea(scene, x, z, fieldWidth, fieldDepth);

    const y = getHeightAt(x, z);
    const allGeometries = [];

    // 1. Create base soil/water
    const baseGeos = createFieldBase(fieldWidth, fieldDepth, type);
    allGeometries.push(...baseGeos);

    // 2. Create furrows (except for orchard and vineyard which don't need them)
    if (type !== FieldTypes.ORCHARD && type !== FieldTypes.VINEYARD) {
        const furrowGeos = createFurrows(fieldWidth, fieldDepth, rows, type);
        allGeometries.push(...furrowGeos);
    }

    // 3. Create plants/crops (start as young/immature)
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const plantGeos = createPlantGeometry(type, row, col, fieldWidth, fieldDepth, rows, cols, false);
            allGeometries.push(...plantGeos);
        }
    }

    // Group geometries by material type
    const byMaterial = new Map();
    allGeometries.forEach(({ geo, mat }) => {
        const material = fieldMaterials[mat] || materials[mat] || materials.grass;
        if (!byMaterial.has(material)) byMaterial.set(material, []);
        const finalGeo = geo.index ? geo.toNonIndexed() : geo;
        byMaterial.get(material).push(finalGeo);
    });

    // Create merged meshes
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

    // Position field
    group.position.set(x, y, z);

    // No scaling needed - plants start small via mature=false parameter

    // Field metadata
    const fieldId = `field-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    group.userData = {
        id: fieldId,
        type,
        x,
        z,
        width: fieldWidth,
        depth: fieldDepth,
        rows,
        cols,
        progress: 0,
        currentTask: null,
        assignedAgent: null,
        // Work positions within the field (for agent movement)
        workPositions: generateWorkPositions(x, z, fieldWidth, fieldDepth, rows, cols),
        bounds: {
            width: fieldWidth + 1,
            depth: fieldDepth + 1,
            radius: Math.max(fieldWidth, fieldDepth) / 2 + 1
        }
    };

    scene.add(group);
    fields.push(group);

    // Register position to avoid overlaps
    registerPosition(x, z, Math.max(fieldWidth, fieldDepth) / 2 + 2);

    return group;
}

// Generate work positions within a field for agent movement
function generateWorkPositions(fieldX, fieldZ, width, depth, rows, cols) {
    const positions = [];
    const spacingX = width / (cols + 1);
    const spacingZ = depth / (rows + 1);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            positions.push({
                x: fieldX - width / 2 + spacingX * (col + 1),
                z: fieldZ - depth / 2 + spacingZ * (row + 1),
                row,
                col
            });
        }
    }

    return positions;
}

// Update field progress visually
export function updateFieldProgress(field, progress) {
    field.userData.progress = Math.max(0, Math.min(100, progress));

    if (progress >= 100 && !field.userData.matured) {
        // Mark as matured to avoid re-regenerating
        field.userData.matured = true;
        field.userData.currentTask = null;

        // Regenerate plants as mature
        regenerateFieldPlants(field, true);

        // Add completion visual: golden emissive glow on all meshes
        field.traverse((child) => {
            if (child.isMesh && child.material) {
                // Clone material to not affect other fields
                if (!child.userData.originalMaterial) {
                    child.userData.originalMaterial = child.material;
                    child.material = child.material.clone();
                }
                // Add golden glow
                child.material.emissive = new THREE.Color(0xffaa00);
                child.material.emissiveIntensity = 0.5;
            }
        });

        // Reset glow after 4 seconds
        setTimeout(() => {
            field.traverse((child) => {
                if (child.isMesh && child.material && child.material.emissive) {
                    child.material.emissive = new THREE.Color(0x000000);
                    child.material.emissiveIntensity = 0;
                }
            });
        }, 4000);
    }
}

// Regenerate all plants in a field (for growth transitions)
function regenerateFieldPlants(field, mature) {
    const { type, width, depth, rows, cols } = field.userData;
    const fieldWidth = width || FIELD_GRID.fieldSize;
    const fieldDepth = depth || FIELD_GRID.fieldSize;

    // Remove all existing meshes except keep track of base/furrows
    const toRemove = [];
    field.traverse((child) => {
        if (child.isMesh) {
            toRemove.push(child);
        }
    });
    toRemove.forEach(mesh => {
        mesh.geometry.dispose();
        field.remove(mesh);
    });

    // Rebuild all geometries
    const allGeometries = [];

    // 1. Create base soil/water
    const baseGeos = createFieldBase(fieldWidth, fieldDepth, type);
    allGeometries.push(...baseGeos);

    // 2. Create furrows (except for orchard and vineyard)
    if (type !== FieldTypes.ORCHARD && type !== FieldTypes.VINEYARD) {
        const furrowGeos = createFurrows(fieldWidth, fieldDepth, rows, type);
        allGeometries.push(...furrowGeos);
    }

    // 3. Create plants with new maturity level
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const plantGeos = createPlantGeometry(type, row, col, fieldWidth, fieldDepth, rows, cols, mature);
            allGeometries.push(...plantGeos);
        }
    }

    // Group geometries by material type
    const byMaterial = new Map();
    allGeometries.forEach(({ geo, mat }) => {
        const material = fieldMaterials[mat] || materials[mat] || materials.grass;
        if (!byMaterial.has(material)) byMaterial.set(material, []);
        const finalGeo = geo.index ? geo.toNonIndexed() : geo;
        byMaterial.get(material).push(finalGeo);
    });

    // Create merged meshes
    byMaterial.forEach((geos, mat) => {
        const merged = mergeGeometries(geos);
        if (merged) {
            const mesh = new THREE.Mesh(merged, mat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            field.add(mesh);
        }
    });
}

// Get a random work position within a field
export function getFieldWorkPosition(field) {
    const positions = field.userData.workPositions;
    if (!positions || positions.length === 0) {
        return { x: field.userData.x, z: field.userData.z };
    }
    return positions[Math.floor(Math.random() * positions.length)];
}

// Assign an agent to work on a field
export function assignAgentToField(agent, field, taskName) {
    agent.userData.assignedField = field;
    agent.userData.currentTask = taskName;
    field.userData.assignedAgent = agent;
    field.userData.currentTask = taskName;

    // Set initial target to a work position in the field
    const workPos = getFieldWorkPosition(field);
    agent.userData.targetX = workPos.x;
    agent.userData.targetZ = workPos.z;

    return workPos;
}

// Release agent from field work
export function releaseAgentFromField(agent) {
    if (agent.userData.assignedField) {
        const field = agent.userData.assignedField;
        field.userData.assignedAgent = null;
        field.userData.currentTask = null;
    }
    agent.userData.assignedField = null;
}
