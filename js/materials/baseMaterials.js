import * as THREE from 'three';

// Helper function to create materials
const mat = (color, rough = 0.8, metal = 0.0) => new THREE.MeshStandardMaterial({
    color, roughness: rough, metalness: metal
});

// ==================== MATERIALS ====================
export const materials = {
    grass: mat(0x5d9b3a, 0.9),
    snow: mat(0xffffff, 0.95),
    snowRock: mat(0xe8e8f0, 0.85),
    grassDark: mat(0x4a8a2f, 0.9),
    grassLight: mat(0x6dab4a, 0.9),
    dirt: mat(0x8b6914, 1.0),
    dirtDark: mat(0x6b5410, 1.0),
    sand: mat(0xe6dcc3, 0.9),
    wood: mat(0x8b5a2b, 0.9),
    woodLight: mat(0xc9a66b, 0.9),
    woodBirch: mat(0xfff5e6, 0.8),
    leaves: mat(0x2d7d32, 0.8, 0.1),
    leavesBright: mat(0x4caf50, 0.8, 0.1),
    stone: mat(0x999999, 0.6, 0.1),
    stoneDark: mat(0x666666, 0.6, 0.1),
    stoneLight: mat(0xcccccc, 0.6, 0.1),
    roofRed: mat(0xc94c4c, 0.7),
    roofBrown: mat(0x5c4033, 0.7),
    roofBlue: mat(0x4a6fa5, 0.7),
    roofGreen: mat(0x4a7c59, 0.7),
    roofOrange: mat(0xcc7744, 0.7),
    roofPurple: mat(0x6b5b7a, 0.7),
    // Wall colors
    wallWhite: mat(0xf5f5f0, 0.6),
    wallCream: mat(0xf5e6c8, 0.6),
    wallYellow: mat(0xf0d58c, 0.6),
    wallPink: mat(0xe8c4c4, 0.6),
    wallBlue: mat(0xc4d4e8, 0.6),
    wallGreen: mat(0xc8dcc8, 0.6),
    wallOrange: mat(0xe8d0b4, 0.6),
    wallBrick: mat(0xb86b4a, 0.8),
    // Door colors
    doorRed: mat(0x8b2500, 0.7),
    doorBlue: mat(0x2b4570, 0.7),
    doorGreen: mat(0x355e3b, 0.7),
    glass: new THREE.MeshPhysicalMaterial({
        color: 0x88ccff, transmission: 0.9, opacity: 1,
        metalness: 0, roughness: 0, ior: 1.5, thickness: 0.1, transparent: true
    }),
    doorDark: mat(0x3e2723, 0.8),
    white: mat(0xffffff, 0.5),
    skin: mat(0xffdcb1, 0.6),
    fileBlock: mat(0x4a9eff, 0.3, 0.2),
    // Flowers
    flowerPink: mat(0xff69b4),
    flowerYellow: mat(0xffd700),
    flowerRed: mat(0xff4444),
    flowerPurple: mat(0x9932cc),
    flowerWhite: mat(0xffffff),
    flowerOrange: mat(0xff8c00),
    flowerStem: mat(0x228b22),
    // Mushrooms
    mushroomRed: mat(0xcc2222),
    mushroomBrown: mat(0x8b4513),
    mushroomWhite: mat(0xfffdd0),
    mushroomSpots: mat(0xffffff),
    // Animals
    chickenWhite: mat(0xffffff),
    chickenRed: mat(0xcc0000),
    chickenYellow: mat(0xffa500),
    sheepWhite: mat(0xfffff0, 0.9),
    sheepFace: mat(0x222222),
    pigPink: mat(0xffc0cb),
    pigSnout: mat(0xffb6c1),
    butterflyBlue: mat(0x4169e1, 0.5),
    butterflyOrange: mat(0xff8c00, 0.5),
    birdBrown: mat(0x8b4513),
    birdBlue: mat(0x4682b4),
    beeYellow: mat(0xffd700),
    beeBlack: mat(0x111111),
    beeWing: new THREE.MeshStandardMaterial({
        color: 0xffffff, transparent: true, opacity: 0.6, roughness: 0.1
    }),
    water: new THREE.MeshPhysicalMaterial({
        color: 0x0077be, transmission: 0.6, opacity: 0.8,
        roughness: 0.2, metalness: 0.1, transparent: true
    }),
    waterDeep: new THREE.MeshStandardMaterial({
        color: 0x004488
    }),
    fence: mat(0x8d6e63),
    // Wild animals
    foxOrange: mat(0xd4652f, 0.7),
    foxWhite: mat(0xfff5e6, 0.7),
    foxTail: mat(0xc45a28, 0.7),
    rabbitBrown: mat(0x9c7a5c, 0.8),
    rabbitWhite: mat(0xfff8f0, 0.8),
    rabbitPink: mat(0xffcccc, 0.6),
    deerBrown: mat(0x8b6914, 0.7),
    deerLight: mat(0xc9a66b, 0.7),
    deerSpots: mat(0xf5e6c8, 0.7),
    wolfGray: mat(0x606060, 0.8),
    wolfDark: mat(0x404040, 0.8),
    squirrelBrown: mat(0x8b4513, 0.7),
    squirrelLight: mat(0xdeb887, 0.7)
};

// ==================== FIELD MATERIALS ====================
export const fieldMaterials = {
    // Soil types
    soil: mat(0x5c4033, 0.95),           // Dark brown tilled soil
    soilWet: mat(0x3d2817, 0.9),         // Wet dark soil
    soilDry: mat(0x8b6914, 0.95),        // Dry light soil

    // Plant parts
    trunk: mat(0x8b5a2b, 0.9),           // Tree trunk/wood
    leaves: mat(0x2d7d32, 0.8),          // Green leaves
    stalk: mat(0x7cb342, 0.85),          // Green stalks
    grain: mat(0xdaa520, 0.7),           // Golden grain/wheat

    // Fruits and vegetables
    fruit: mat(0xff4444, 0.6),           // Red fruit (apples)
    fruitDark: mat(0xcc2222, 0.6),       // Dark red fruit variation
    fruitGreen: mat(0x7cb342, 0.6),      // Unripe green fruit
    fruitYoung: mat(0xaed581, 0.6),      // Very young fruit (light green)
    grape: mat(0x6b3fa0, 0.5),           // Purple grapes
    grapeGreen: mat(0x9acd32, 0.5),      // Unripe green grapes
    vegGreen: mat(0x4caf50, 0.7),        // Green vegetables
    vegOrange: mat(0xff8c00, 0.7),       // Orange vegetables (carrots)
    vegRed: mat(0xe53935, 0.6),          // Red vegetables (tomatoes)

    // Water for rice paddies
    water: new THREE.MeshPhysicalMaterial({
        color: 0x6b8e8e,
        transmission: 0.4,
        opacity: 0.7,
        roughness: 0.3,
        metalness: 0.1,
        transparent: true
    })
};
