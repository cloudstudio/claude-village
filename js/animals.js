import * as THREE from 'three';
import { materials } from './materials.js';
import { farmZone, grid } from './config.js';
import { getHeightAt, animals, insects, registerPosition, getRandomPositionInFarm, getRandomPositionOutsideFarm, snapToGrid } from './terrain.js';

const GRID_STEP = grid?.size ?? 6;

function getFarmGridCells(step = GRID_STEP) {
    const cells = [];
    for (let x = farmZone.minX + step; x <= farmZone.maxX - step; x += step) {
        for (let z = farmZone.minZ + step; z <= farmZone.maxZ - step; z += step) {
            cells.push({ x, z });
        }
    }
    return cells;
}

// ==================== CHICKEN ====================
export function createChicken(scene, x, z) {
    const group = new THREE.Group();
    const y = getHeightAt(x, z);

    // Body - plump capsule shape
    const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.2, 0.25, 8, 12),
        materials.chickenWhite
    );
    body.rotation.x = Math.PI / 2;
    body.position.y = 0.35;
    body.castShadow = true;
    group.add(body);

    // Breast feathers (white puff)
    const breast = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 8),
        materials.chickenWhite
    );
    breast.position.set(0, 0.3, 0.15);
    group.add(breast);

    // Head - round
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 10),
        materials.chickenWhite
    );
    head.position.set(0, 0.55, 0.22);
    group.add(head);

    // Eyes (black with shine)
    const eyeGeo = new THREE.SphereGeometry(0.025, 6, 6);
    const eyeL = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeL.position.set(-0.06, 0.57, 0.3);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeR.position.set(0.06, 0.57, 0.3);
    group.add(eyeR);

    // Eye shine
    const shineGeo = new THREE.SphereGeometry(0.008, 4, 4);
    const shineL = new THREE.Mesh(shineGeo, materials.white);
    shineL.position.set(-0.055, 0.575, 0.32);
    group.add(shineL);
    const shineR = new THREE.Mesh(shineGeo, materials.white);
    shineR.position.set(0.065, 0.575, 0.32);
    group.add(shineR);

    // Beak - two parts
    const beakTop = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.1, 6),
        materials.chickenYellow
    );
    beakTop.rotation.x = -Math.PI / 2;
    beakTop.position.set(0, 0.55, 0.35);
    group.add(beakTop);

    const beakBottom = new THREE.Mesh(
        new THREE.ConeGeometry(0.025, 0.06, 6),
        materials.chickenYellow
    );
    beakBottom.rotation.x = -Math.PI / 2;
    beakBottom.position.set(0, 0.52, 0.33);
    group.add(beakBottom);

    // Wattle (red thing under beak)
    const wattle = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 6, 6),
        materials.chickenRed
    );
    wattle.scale.set(0.8, 1.2, 0.6);
    wattle.position.set(0, 0.48, 0.3);
    group.add(wattle);

    // Comb (red thing on top)
    const comb = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.1, 0.12),
        materials.chickenRed
    );
    comb.position.set(0, 0.68, 0.2);
    group.add(comb);

    // Wings (folded)
    const wingGeo = new THREE.CapsuleGeometry(0.08, 0.15, 4, 8);
    const wingL = new THREE.Mesh(wingGeo, materials.chickenWhite);
    wingL.rotation.z = Math.PI / 2;
    wingL.position.set(-0.18, 0.35, 0);
    group.add(wingL);
    const wingR = new THREE.Mesh(wingGeo, materials.chickenWhite);
    wingR.rotation.z = Math.PI / 2;
    wingR.position.set(0.18, 0.35, 0);
    group.add(wingR);

    // Tail feathers
    for (let i = 0; i < 3; i++) {
        const feather = new THREE.Mesh(
            new THREE.ConeGeometry(0.04, 0.18, 4),
            materials.chickenWhite
        );
        feather.position.set((i - 1) * 0.06, 0.4, -0.28);
        feather.rotation.x = -Math.PI / 3 - Math.random() * 0.2;
        feather.rotation.z = (i - 1) * 0.15;
        group.add(feather);
    }

    // Legs with feet
    const legs = [];
    [-0.08, 0.08].forEach(xPos => {
        const legGroup = new THREE.Group();

        const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.018, 0.18, 6),
            materials.chickenYellow
        );
        leg.position.y = 0.09;
        legGroup.add(leg);

        // Foot
        const foot = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.015, 0.08),
            materials.chickenYellow
        );
        foot.position.set(0, 0.01, 0.02);
        legGroup.add(foot);

        legGroup.position.set(xPos, 0.1, 0);
        legs.push(legGroup);
        group.add(legGroup);
    });

    group.position.set(x, y, z);
    group.scale.setScalar(1.5);

    group.userData = {
        type: 'chicken',
        state: 'idle',
        stateTimer: 0,
        targetX: x,
        targetZ: z,
        speed: 0.02 + Math.random() * 0.01,
        legs: legs,
        head: head,
        walkCycle: 0,
        homeX: x,
        homeZ: z,
        confined: true
    };

    scene.add(group);
    animals.push(group);
    return group;
}

// ==================== SHEEP ====================
export function createSheep(scene, x, z) {
    const group = new THREE.Group();
    const y = getHeightAt(x, z);

    // Fluffy body - main wool
    const bodyMain = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.35, 0.6, 8, 12),
        materials.sheepWhite
    );
    bodyMain.rotation.x = Math.PI / 2;
    bodyMain.position.y = 0.55;
    bodyMain.castShadow = true;
    group.add(bodyMain);

    // Extra fluff puffs for woolly look
    for (let i = 0; i < 10; i++) {
        const fluff = new THREE.Mesh(
            new THREE.SphereGeometry(0.15 + Math.random() * 0.1, 8, 8),
            materials.sheepWhite
        );
        const angle = (i / 10) * Math.PI * 2;
        const r = 0.25 + Math.random() * 0.1;
        fluff.position.set(
            Math.cos(angle) * r,
            0.55 + (Math.random() - 0.5) * 0.2,
            Math.sin(angle) * r * 1.3
        );
        group.add(fluff);
    }

    // Head - rounded black face
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 10, 10),
        materials.sheepFace
    );
    head.scale.set(0.9, 1, 1.1);
    head.position.set(0, 0.7, 0.55);
    group.add(head);

    // Wool tuft on head
    const headWool = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        materials.sheepWhite
    );
    headWool.position.set(0, 0.85, 0.5);
    group.add(headWool);

    // Eyes (with shine)
    const eyeGeo = new THREE.SphereGeometry(0.03, 6, 6);
    const eyeL = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeL.position.set(-0.08, 0.72, 0.68);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeR.position.set(0.08, 0.72, 0.68);
    group.add(eyeR);

    // Eye shine
    const shineGeo = new THREE.SphereGeometry(0.01, 4, 4);
    const shineL = new THREE.Mesh(shineGeo, materials.white);
    shineL.position.set(-0.075, 0.725, 0.7);
    group.add(shineL);
    const shineR = new THREE.Mesh(shineGeo, materials.white);
    shineR.position.set(0.085, 0.725, 0.7);
    group.add(shineR);

    // Nose
    const nose = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 6, 6),
        materials.beeBlack
    );
    nose.scale.set(1.2, 0.8, 1);
    nose.position.set(0, 0.65, 0.72);
    group.add(nose);

    // Ears
    const earGeo = new THREE.CapsuleGeometry(0.04, 0.08, 4, 6);
    const earL = new THREE.Mesh(earGeo, materials.sheepFace);
    earL.rotation.z = Math.PI / 2 + 0.3;
    earL.position.set(-0.18, 0.75, 0.52);
    group.add(earL);
    const earR = new THREE.Mesh(earGeo, materials.sheepFace);
    earR.rotation.z = -Math.PI / 2 - 0.3;
    earR.position.set(0.18, 0.75, 0.52);
    group.add(earR);

    // Tail (small wool puff)
    const tail = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        materials.sheepWhite
    );
    tail.position.set(0, 0.5, -0.5);
    group.add(tail);

    // Legs with hooves
    const legs = [];
    const legPositions = [
        [-0.18, 0.2, 0.22],
        [0.18, 0.2, 0.22],
        [-0.18, 0.2, -0.22],
        [0.18, 0.2, -0.22]
    ];

    legPositions.forEach(pos => {
        const legGroup = new THREE.Group();

        const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.04, 0.35, 8),
            materials.sheepFace
        );
        leg.position.y = 0.18;
        legGroup.add(leg);

        // Hoof
        const hoof = new THREE.Mesh(
            new THREE.CylinderGeometry(0.045, 0.05, 0.06, 8),
            materials.beeBlack
        );
        hoof.position.y = 0.03;
        legGroup.add(hoof);

        legGroup.position.set(...pos);
        legs.push(legGroup);
        group.add(legGroup);
    });

    group.position.set(x, y, z);
    group.scale.setScalar(1.3);

    group.userData = {
        type: 'sheep',
        state: 'idle',
        stateTimer: 0,
        targetX: x,
        targetZ: z,
        speed: 0.015 + Math.random() * 0.01,
        legs: legs,
        walkCycle: 0,
        homeX: x,
        homeZ: z,
        confined: true
    };

    scene.add(group);
    animals.push(group);
    return group;
}

// ==================== PIG ====================
export function createPig(scene, x, z) {
    const group = new THREE.Group();
    const y = getHeightAt(x, z);

    // Body - plump capsule
    const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.28, 0.5, 8, 12),
        materials.pigPink
    );
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.38;
    body.castShadow = true;
    group.add(body);

    // Belly (slightly lighter/bigger underneath)
    const belly = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 8, 8),
        materials.pigSnout
    );
    belly.scale.set(1.2, 0.8, 1);
    belly.position.set(0, 0.28, 0);
    group.add(belly);

    // Head - round
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 10, 10),
        materials.pigPink
    );
    head.scale.set(1, 0.95, 1.1);
    head.position.set(0, 0.48, 0.42);
    group.add(head);

    // Snout - big and round
    const snout = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 0.1, 12),
        materials.pigSnout
    );
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, 0.44, 0.6);
    group.add(snout);

    // Nostrils
    const nostrilGeo = new THREE.SphereGeometry(0.025, 6, 6);
    const nostrilL = new THREE.Mesh(nostrilGeo, materials.pigPink);
    nostrilL.position.set(-0.04, 0.44, 0.66);
    group.add(nostrilL);
    const nostrilR = new THREE.Mesh(nostrilGeo, materials.pigPink);
    nostrilR.position.set(0.04, 0.44, 0.66);
    group.add(nostrilR);

    // Eyes (with shine)
    const eyeGeo = new THREE.SphereGeometry(0.03, 6, 6);
    const eyeL = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeL.position.set(-0.1, 0.52, 0.52);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeR.position.set(0.1, 0.52, 0.52);
    group.add(eyeR);

    // Eye shine
    const shineGeo = new THREE.SphereGeometry(0.01, 4, 4);
    const shineL = new THREE.Mesh(shineGeo, materials.white);
    shineL.position.set(-0.095, 0.525, 0.545);
    group.add(shineL);
    const shineR = new THREE.Mesh(shineGeo, materials.white);
    shineR.position.set(0.105, 0.525, 0.545);
    group.add(shineR);

    // Ears - floppy triangular
    const earGeo = new THREE.ConeGeometry(0.08, 0.12, 4);
    const earL = new THREE.Mesh(earGeo, materials.pigPink);
    earL.rotation.x = Math.PI / 4;
    earL.rotation.z = -0.4;
    earL.position.set(-0.14, 0.6, 0.35);
    group.add(earL);
    const earR = new THREE.Mesh(earGeo, materials.pigPink);
    earR.rotation.x = Math.PI / 4;
    earR.rotation.z = 0.4;
    earR.position.set(0.14, 0.6, 0.35);
    group.add(earR);

    // Curly tail
    const tailGroup = new THREE.Group();
    for (let i = 0; i < 5; i++) {
        const segment = new THREE.Mesh(
            new THREE.SphereGeometry(0.025, 6, 6),
            materials.pigPink
        );
        const angle = (i / 5) * Math.PI * 1.5;
        const r = 0.06;
        segment.position.set(
            Math.cos(angle) * r,
            Math.sin(angle) * r,
            i * 0.02
        );
        tailGroup.add(segment);
    }
    tailGroup.position.set(0, 0.4, -0.4);
    tailGroup.rotation.x = -0.3;
    group.add(tailGroup);

    // Legs with hooves
    const legs = [];
    const legPositions = [
        [-0.14, 0.12, 0.18],
        [0.14, 0.12, 0.18],
        [-0.14, 0.12, -0.18],
        [0.14, 0.12, -0.18]
    ];

    legPositions.forEach(pos => {
        const legGroup = new THREE.Group();

        const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.045, 0.22, 8),
            materials.pigPink
        );
        leg.position.y = 0.11;
        legGroup.add(leg);

        // Hoof
        const hoof = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.04, 8),
            materials.beeBlack
        );
        hoof.position.y = 0.02;
        legGroup.add(hoof);

        legGroup.position.set(...pos);
        legs.push(legGroup);
        group.add(legGroup);
    });

    group.position.set(x, y, z);
    group.scale.setScalar(1.4);

    group.userData = {
        type: 'pig',
        state: 'idle',
        stateTimer: 0,
        targetX: x,
        targetZ: z,
        speed: 0.02 + Math.random() * 0.01,
        legs: legs,
        walkCycle: 0,
        homeX: x,
        homeZ: z,
        confined: true
    };

    scene.add(group);
    animals.push(group);
    return group;
}

// ==================== BUTTERFLY ====================
export function createButterfly(scene, x, y, z) {
    const group = new THREE.Group();
    const colors = [materials.butterflyBlue, materials.butterflyOrange, materials.flowerPurple, materials.flowerPink];
    const wingColor = colors[Math.floor(Math.random() * colors.length)];

    // Body - segmented
    const thorax = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.02, 0.06, 4, 6),
        materials.beeBlack
    );
    thorax.rotation.x = Math.PI / 2;
    thorax.position.z = 0.02;
    group.add(thorax);

    const abdomen = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.015, 0.1, 4, 6),
        materials.beeBlack
    );
    abdomen.rotation.x = Math.PI / 2;
    abdomen.position.z = -0.08;
    group.add(abdomen);

    // Head
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 8, 8),
        materials.beeBlack
    );
    head.position.z = 0.08;
    group.add(head);

    // Eyes (compound eyes)
    const eyeGeo = new THREE.SphereGeometry(0.012, 6, 6);
    const eyeL = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeL.position.set(-0.02, 0.005, 0.09);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeR.position.set(0.02, 0.005, 0.09);
    group.add(eyeR);

    // Antennae
    const antennaGeo = new THREE.CylinderGeometry(0.003, 0.002, 0.08, 4);
    const antenna1 = new THREE.Mesh(antennaGeo, materials.beeBlack);
    antenna1.position.set(-0.015, 0.04, 0.1);
    antenna1.rotation.x = -0.3;
    antenna1.rotation.z = -0.3;
    group.add(antenna1);
    const antenna2 = new THREE.Mesh(antennaGeo, materials.beeBlack);
    antenna2.position.set(0.015, 0.04, 0.1);
    antenna2.rotation.x = -0.3;
    antenna2.rotation.z = 0.3;
    group.add(antenna2);

    // Antenna tips (clubs)
    const tipGeo = new THREE.SphereGeometry(0.008, 4, 4);
    const tip1 = new THREE.Mesh(tipGeo, materials.beeBlack);
    tip1.position.set(-0.035, 0.07, 0.12);
    group.add(tip1);
    const tip2 = new THREE.Mesh(tipGeo, materials.beeBlack);
    tip2.position.set(0.035, 0.07, 0.12);
    group.add(tip2);

    // Upper wings - more organic rounded shape
    const upperWingShape = new THREE.Shape();
    upperWingShape.moveTo(0, 0);
    upperWingShape.bezierCurveTo(0.08, 0.02, 0.15, 0.08, 0.18, 0);
    upperWingShape.bezierCurveTo(0.16, -0.06, 0.08, -0.1, 0, -0.05);
    upperWingShape.closePath();

    const upperWingGeo = new THREE.ShapeGeometry(upperWingShape);

    const wing1 = new THREE.Mesh(upperWingGeo, wingColor);
    wing1.rotation.y = Math.PI / 2;
    wing1.rotation.x = Math.PI / 2;
    wing1.position.set(-0.02, 0.01, 0.02);
    group.add(wing1);

    const wing2 = new THREE.Mesh(upperWingGeo, wingColor);
    wing2.rotation.y = -Math.PI / 2;
    wing2.rotation.x = Math.PI / 2;
    wing2.scale.x = -1;
    wing2.position.set(0.02, 0.01, 0.02);
    group.add(wing2);

    // Lower wings - smaller
    const lowerWingShape = new THREE.Shape();
    lowerWingShape.moveTo(0, 0);
    lowerWingShape.bezierCurveTo(0.05, 0.01, 0.1, 0.03, 0.12, -0.02);
    lowerWingShape.bezierCurveTo(0.1, -0.06, 0.04, -0.07, 0, -0.03);
    lowerWingShape.closePath();

    const lowerWingGeo = new THREE.ShapeGeometry(lowerWingShape);

    const wing3 = new THREE.Mesh(lowerWingGeo, wingColor);
    wing3.rotation.y = Math.PI / 2;
    wing3.rotation.x = Math.PI / 2;
    wing3.position.set(-0.02, 0.005, -0.04);
    group.add(wing3);

    const wing4 = new THREE.Mesh(lowerWingGeo, wingColor);
    wing4.rotation.y = -Math.PI / 2;
    wing4.rotation.x = Math.PI / 2;
    wing4.scale.x = -1;
    wing4.position.set(0.02, 0.005, -0.04);
    group.add(wing4);

    // Wing patterns (spots)
    const spotGeo = new THREE.CircleGeometry(0.02, 8);
    const spotMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });

    [-1, 1].forEach(side => {
        const spot = new THREE.Mesh(spotGeo, spotMat);
        spot.rotation.y = side * Math.PI / 2;
        spot.rotation.x = Math.PI / 2;
        spot.position.set(side * 0.1, 0.012, 0);
        group.add(spot);
    });

    group.position.set(x, y, z);
    group.scale.setScalar(1.2);

    group.userData = {
        type: 'butterfly',
        wings: [wing1, wing2, wing3, wing4],
        phase: Math.random() * Math.PI * 2,
        targetX: x,
        targetY: y,
        targetZ: z,
        homeX: x,
        homeZ: z,
        flightTimer: 0
    };

    scene.add(group);
    insects.push(group);
    return group;
}

// ==================== BIRD ====================
export function createBird(scene, x, y, z) {
    const group = new THREE.Group();
    const isBlueBird = Math.random() > 0.5;
    const bodyColor = isBlueBird ? materials.birdBlue : materials.birdBrown;
    const bellyColor = isBlueBird ? materials.white : materials.squirrelLight;

    // Body - round and plump
    const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 10),
        bodyColor
    );
    body.scale.set(0.9, 0.85, 1.2);
    group.add(body);

    // Belly
    const belly = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 8, 8),
        bellyColor
    );
    belly.position.set(0, -0.03, 0.02);
    group.add(belly);

    // Head
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 10, 10),
        bodyColor
    );
    head.position.set(0, 0.06, 0.12);
    group.add(head);

    // Eyes (with shine)
    const eyeGeo = new THREE.SphereGeometry(0.018, 6, 6);
    const eyeL = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeL.position.set(-0.045, 0.07, 0.17);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeR.position.set(0.045, 0.07, 0.17);
    group.add(eyeR);

    // Eye shine
    const shineGeo = new THREE.SphereGeometry(0.006, 4, 4);
    const shineL = new THREE.Mesh(shineGeo, materials.white);
    shineL.position.set(-0.042, 0.073, 0.185);
    group.add(shineL);
    const shineR = new THREE.Mesh(shineGeo, materials.white);
    shineR.position.set(0.048, 0.073, 0.185);
    group.add(shineR);

    // Beak - two parts
    const beakTop = new THREE.Mesh(
        new THREE.ConeGeometry(0.025, 0.07, 6),
        materials.chickenYellow
    );
    beakTop.rotation.x = -Math.PI / 2;
    beakTop.position.set(0, 0.05, 0.22);
    group.add(beakTop);

    const beakBottom = new THREE.Mesh(
        new THREE.ConeGeometry(0.015, 0.04, 6),
        materials.chickenYellow
    );
    beakBottom.rotation.x = -Math.PI / 2 + 0.3;
    beakBottom.position.set(0, 0.035, 0.2);
    group.add(beakBottom);

    // Wings - more detailed shape
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.bezierCurveTo(0.1, 0.02, 0.2, 0, 0.25, -0.05);
    wingShape.bezierCurveTo(0.22, -0.08, 0.1, -0.06, 0, -0.03);
    wingShape.closePath();

    const wingGeo = new THREE.ShapeGeometry(wingShape);

    const wing1 = new THREE.Mesh(wingGeo, bodyColor);
    wing1.rotation.y = Math.PI / 2;
    wing1.position.set(-0.1, 0.02, 0);
    group.add(wing1);

    const wing2 = new THREE.Mesh(wingGeo, bodyColor);
    wing2.rotation.y = -Math.PI / 2;
    wing2.scale.x = -1;
    wing2.position.set(0.1, 0.02, 0);
    group.add(wing2);

    // Tail feathers
    const tailGroup = new THREE.Group();
    for (let i = -1; i <= 1; i++) {
        const feather = new THREE.Mesh(
            new THREE.ConeGeometry(0.02, 0.12, 4),
            bodyColor
        );
        feather.rotation.x = Math.PI / 2 + 0.3;
        feather.position.set(i * 0.025, 0, 0);
        feather.rotation.z = i * 0.15;
        tailGroup.add(feather);
    }
    tailGroup.position.set(0, 0, -0.15);
    group.add(tailGroup);

    // Feet (small when flying)
    const footGeo = new THREE.CylinderGeometry(0.008, 0.005, 0.04, 4);
    const foot1 = new THREE.Mesh(footGeo, materials.chickenYellow);
    foot1.position.set(-0.04, -0.1, 0);
    group.add(foot1);
    const foot2 = new THREE.Mesh(footGeo, materials.chickenYellow);
    foot2.position.set(0.04, -0.1, 0);
    group.add(foot2);

    group.position.set(x, y, z);
    group.scale.setScalar(1.1);

    group.userData = {
        type: 'bird',
        wings: [wing1, wing2],
        tail: tailGroup,
        phase: Math.random() * Math.PI * 2,
        circleAngle: Math.random() * Math.PI * 2,
        circleRadius: 10 + Math.random() * 15,
        targetX: x,
        targetY: y,
        targetZ: z,
        homeX: x,
        homeZ: z,
        flightTimer: 0
    };

    scene.add(group);
    insects.push(group);
    return group;
}

// ==================== BEE ====================
export function createBee(scene, x, y, z) {
    const group = new THREE.Group();

    // Body segments
    const body1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        materials.beeYellow
    );
    body1.position.z = 0.05;
    group.add(body1);

    const body2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        materials.beeBlack
    );
    body2.position.z = 0;
    group.add(body2);

    const body3 = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        materials.beeYellow
    );
    body3.position.z = -0.06;
    group.add(body3);

    // Wings
    const wingGeo = new THREE.BoxGeometry(0.08, 0.01, 0.06);
    const wing1 = new THREE.Mesh(wingGeo, materials.beeWing);
    wing1.position.set(-0.06, 0.04, 0);
    group.add(wing1);
    const wing2 = new THREE.Mesh(wingGeo, materials.beeWing);
    wing2.position.set(0.06, 0.04, 0);
    group.add(wing2);

    group.position.set(x, y, z);

    group.userData = {
        type: 'bee',
        wings: [wing1, wing2],
        phase: Math.random() * Math.PI * 2,
        targetX: x,
        targetY: y,
        targetZ: z,
        speed: 0.03 + Math.random() * 0.02,
        homeX: x,
        homeZ: z,
        flightTimer: 0,
        targetFlower: null
    };

    scene.add(group);
    insects.push(group);
    return group;
}

// ==================== FOX ====================
export function createFox(scene, x, z) {
    const group = new THREE.Group();
    const y = getHeightAt(x, z);

    // Main body - sleek and elongated
    const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.18, 0.55, 8, 12),
        materials.foxOrange
    );
    body.rotation.z = Math.PI / 2;
    body.position.set(0, 0.32, 0);
    body.castShadow = true;
    group.add(body);

    // Chest (white underbelly)
    const chest = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 8, 8),
        materials.foxWhite
    );
    chest.scale.set(0.8, 1, 0.9);
    chest.position.set(0, 0.25, 0.2);
    group.add(chest);

    // Neck
    const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 0.15, 8),
        materials.foxOrange
    );
    neck.position.set(0, 0.4, 0.35);
    neck.rotation.x = -0.3;
    group.add(neck);

    // Head base - rounded
    const headBase = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 10, 10),
        materials.foxOrange
    );
    headBase.scale.set(1, 0.9, 1);
    headBase.position.set(0, 0.48, 0.42);
    group.add(headBase);

    // Snout - elegant pointed shape
    const snout = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.22, 8),
        materials.foxOrange
    );
    snout.rotation.x = -Math.PI / 2;
    snout.position.set(0, 0.44, 0.58);
    group.add(snout);

    // Nose tip (black)
    const nose = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 6, 6),
        materials.beeBlack
    );
    nose.position.set(0, 0.44, 0.7);
    group.add(nose);

    // White snout markings
    const snoutWhite = new THREE.Mesh(
        new THREE.ConeGeometry(0.055, 0.12, 8),
        materials.foxWhite
    );
    snoutWhite.rotation.x = -Math.PI / 2;
    snoutWhite.position.set(0, 0.41, 0.55);
    group.add(snoutWhite);

    // Cheeks (white fur patches)
    const cheekL = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 6),
        materials.foxWhite
    );
    cheekL.scale.set(0.8, 1, 0.6);
    cheekL.position.set(-0.1, 0.44, 0.48);
    group.add(cheekL);

    const cheekR = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 6),
        materials.foxWhite
    );
    cheekR.scale.set(0.8, 1, 0.6);
    cheekR.position.set(0.1, 0.44, 0.48);
    group.add(cheekR);

    // Eyes (dark with shine)
    const eyeGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const eyeL = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeL.position.set(-0.06, 0.52, 0.52);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeR.position.set(0.06, 0.52, 0.52);
    group.add(eyeR);

    // Eye shine
    const shineGeo = new THREE.SphereGeometry(0.008, 4, 4);
    const shineMat = materials.white || materials.foxWhite;
    const shineL = new THREE.Mesh(shineGeo, shineMat);
    shineL.position.set(-0.055, 0.525, 0.54);
    group.add(shineL);
    const shineR = new THREE.Mesh(shineGeo, shineMat);
    shineR.position.set(0.065, 0.525, 0.54);
    group.add(shineR);

    // Ears - large and triangular with black tips
    const earGeo = new THREE.ConeGeometry(0.06, 0.16, 4);
    const ear1 = new THREE.Mesh(earGeo, materials.foxOrange);
    ear1.position.set(-0.08, 0.65, 0.38);
    ear1.rotation.x = -0.2;
    ear1.rotation.z = -0.15;
    group.add(ear1);
    const ear2 = new THREE.Mesh(earGeo, materials.foxOrange);
    ear2.position.set(0.08, 0.65, 0.38);
    ear2.rotation.x = -0.2;
    ear2.rotation.z = 0.15;
    group.add(ear2);

    // Inner ears (pinkish)
    const innerEarGeo = new THREE.ConeGeometry(0.035, 0.1, 4);
    const innerEar1 = new THREE.Mesh(innerEarGeo, materials.rabbitPink);
    innerEar1.position.set(-0.08, 0.63, 0.4);
    innerEar1.rotation.x = -0.2;
    innerEar1.rotation.z = -0.15;
    group.add(innerEar1);
    const innerEar2 = new THREE.Mesh(innerEarGeo, materials.rabbitPink);
    innerEar2.position.set(0.08, 0.63, 0.4);
    innerEar2.rotation.x = -0.2;
    innerEar2.rotation.z = 0.15;
    group.add(innerEar2);

    // Ear tips (black)
    const earTipGeo = new THREE.ConeGeometry(0.025, 0.04, 4);
    const earTip1 = new THREE.Mesh(earTipGeo, materials.beeBlack);
    earTip1.position.set(-0.085, 0.73, 0.36);
    earTip1.rotation.z = -0.15;
    group.add(earTip1);
    const earTip2 = new THREE.Mesh(earTipGeo, materials.beeBlack);
    earTip2.position.set(0.085, 0.73, 0.36);
    earTip2.rotation.z = 0.15;
    group.add(earTip2);

    // Tail - big, fluffy, curved upward
    const tail1 = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.1, 0.25, 8, 12),
        materials.foxOrange
    );
    tail1.position.set(0, 0.32, -0.4);
    tail1.rotation.x = Math.PI / 6;
    group.add(tail1);

    const tail2 = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.12, 0.2, 8, 12),
        materials.foxOrange
    );
    tail2.position.set(0, 0.42, -0.55);
    tail2.rotation.x = Math.PI / 4;
    group.add(tail2);

    // Tail tip (white)
    const tailTip = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 10, 10),
        materials.foxWhite
    );
    tailTip.scale.set(0.9, 1.1, 0.9);
    tailTip.position.set(0, 0.58, -0.68);
    group.add(tailTip);

    // Legs - slender with dark "socks"
    const legs = [];
    const legPositions = [
        { pos: [-0.1, 0, 0.18], front: true },
        { pos: [0.1, 0, 0.18], front: true },
        { pos: [-0.1, 0, -0.15], front: false },
        { pos: [0.1, 0, -0.15], front: false }
    ];

    legPositions.forEach(({ pos, front }) => {
        const legGroup = new THREE.Group();

        // Upper leg
        const upperLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.035, 0.15, 8),
            materials.foxOrange
        );
        upperLeg.position.y = 0.22;
        legGroup.add(upperLeg);

        // Lower leg (black sock)
        const lowerLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.025, 0.12, 8),
            materials.beeBlack
        );
        lowerLeg.position.y = 0.06;
        legGroup.add(lowerLeg);

        // Paw
        const paw = new THREE.Mesh(
            new THREE.SphereGeometry(0.03, 6, 6),
            materials.beeBlack
        );
        paw.scale.set(1, 0.5, 1.3);
        paw.position.y = 0.015;
        legGroup.add(paw);

        legGroup.position.set(...pos);
        legs.push(legGroup);
        group.add(legGroup);
    });

    group.position.set(x, y, z);
    group.scale.setScalar(1.3);

    group.userData = {
        type: 'fox',
        state: 'walking',
        stateTimer: 0,
        targetX: x,
        targetZ: z,
        speed: 0.04 + Math.random() * 0.02,
        legs: legs,
        walkCycle: 0,
        homeX: x,
        homeZ: z,
        confined: false,
        roamRadius: 40 + Math.random() * 30
    };

    scene.add(group);
    animals.push(group);
    return group;
}

// ==================== RABBIT ====================
export function createRabbit(scene, x, z) {
    const group = new THREE.Group();
    const y = getHeightAt(x, z);
    const isWhite = Math.random() > 0.7;
    const bodyMat = isWhite ? materials.rabbitWhite : materials.rabbitBrown;

    // Body - plump
    const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 10, 10),
        bodyMat
    );
    body.scale.set(1, 0.85, 1.3);
    body.position.y = 0.22;
    body.castShadow = true;
    group.add(body);

    // Head - round and cute
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 10, 10),
        bodyMat
    );
    head.scale.set(1, 0.95, 1);
    head.position.set(0, 0.35, 0.2);
    group.add(head);

    // Cheeks
    const cheekL = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 6),
        bodyMat
    );
    cheekL.position.set(-0.1, 0.32, 0.28);
    group.add(cheekL);
    const cheekR = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 6),
        bodyMat
    );
    cheekR.position.set(0.1, 0.32, 0.28);
    group.add(cheekR);

    // Eyes (large and cute with shine)
    const eyeGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const eyeL = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeL.position.set(-0.06, 0.38, 0.3);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeR.position.set(0.06, 0.38, 0.3);
    group.add(eyeR);

    // Eye shine (bigger for cute look)
    const shineGeo = new THREE.SphereGeometry(0.012, 4, 4);
    const shineL = new THREE.Mesh(shineGeo, materials.white);
    shineL.position.set(-0.055, 0.385, 0.33);
    group.add(shineL);
    const shineR = new THREE.Mesh(shineGeo, materials.white);
    shineR.position.set(0.065, 0.385, 0.33);
    group.add(shineR);

    // Nose (pink)
    const nose = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 6, 6),
        materials.rabbitPink
    );
    nose.scale.set(1.2, 0.8, 1);
    nose.position.set(0, 0.33, 0.34);
    group.add(nose);

    // Whisker dots
    const whiskerDot = new THREE.SphereGeometry(0.008, 4, 4);
    [-0.08, -0.06, 0.06, 0.08].forEach((xPos, i) => {
        const dot = new THREE.Mesh(whiskerDot, materials.beeBlack);
        dot.position.set(xPos, 0.31, 0.32);
        group.add(dot);
    });

    // Ears (long)
    const earGeo = new THREE.CapsuleGeometry(0.04, 0.22, 6, 10);
    const ear1 = new THREE.Mesh(earGeo, bodyMat);
    ear1.position.set(-0.06, 0.58, 0.15);
    ear1.rotation.x = -0.15;
    ear1.rotation.z = -0.1;
    group.add(ear1);
    const ear2 = new THREE.Mesh(earGeo, bodyMat);
    ear2.position.set(0.06, 0.58, 0.15);
    ear2.rotation.x = -0.15;
    ear2.rotation.z = 0.1;
    group.add(ear2);

    // Inner ears (pink)
    const innerEarGeo = new THREE.CapsuleGeometry(0.02, 0.15, 4, 6);
    const innerEar1 = new THREE.Mesh(innerEarGeo, materials.rabbitPink);
    innerEar1.position.set(-0.06, 0.57, 0.17);
    innerEar1.rotation.x = -0.15;
    innerEar1.rotation.z = -0.1;
    group.add(innerEar1);
    const innerEar2 = new THREE.Mesh(innerEarGeo, materials.rabbitPink);
    innerEar2.position.set(0.06, 0.57, 0.17);
    innerEar2.rotation.x = -0.15;
    innerEar2.rotation.z = 0.1;
    group.add(innerEar2);

    // Tail (fluffy ball)
    const tail = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        materials.rabbitWhite
    );
    tail.position.set(0, 0.22, -0.22);
    group.add(tail);

    // Legs - bunny has big back legs
    const legs = [];

    // Front legs (smaller)
    [-0.07, 0.07].forEach(xPos => {
        const legGroup = new THREE.Group();
        const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.02, 0.1, 6),
            bodyMat
        );
        leg.position.y = 0.05;
        legGroup.add(leg);

        const paw = new THREE.Mesh(
            new THREE.SphereGeometry(0.025, 6, 6),
            bodyMat
        );
        paw.scale.set(1, 0.6, 1.3);
        paw.position.y = 0.01;
        legGroup.add(paw);

        legGroup.position.set(xPos, 0.05, 0.12);
        legs.push(legGroup);
        group.add(legGroup);
    });

    // Back legs (bigger for hopping)
    [-0.09, 0.09].forEach(xPos => {
        const legGroup = new THREE.Group();
        const leg = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.04, 0.08, 4, 6),
            bodyMat
        );
        leg.position.y = 0.06;
        legGroup.add(leg);

        const foot = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.025, 0.06, 4, 6),
            bodyMat
        );
        foot.rotation.x = Math.PI / 2;
        foot.position.set(0, 0.02, 0.03);
        legGroup.add(foot);

        legGroup.position.set(xPos, 0.05, -0.1);
        legs.push(legGroup);
        group.add(legGroup);
    });

    group.position.set(x, y, z);
    group.scale.setScalar(1.3);

    group.userData = {
        type: 'rabbit',
        state: 'idle',
        stateTimer: 0,
        targetX: x,
        targetZ: z,
        speed: 0.05 + Math.random() * 0.03,
        legs: legs,
        ears: [ear1, ear2],
        walkCycle: 0,
        homeX: x,
        homeZ: z,
        confined: false,
        roamRadius: 25 + Math.random() * 20
    };

    scene.add(group);
    animals.push(group);
    return group;
}

// ==================== DEER ====================
export function createDeer(scene, x, z) {
    const group = new THREE.Group();
    const y = getHeightAt(x, z);

    // Body - elegant
    const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.28, 0.75, 8, 12),
        materials.deerBrown
    );
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.72;
    body.castShadow = true;
    group.add(body);

    // Belly (lighter)
    const belly = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.2, 0.5, 6, 10),
        materials.deerSpots
    );
    belly.rotation.z = Math.PI / 2;
    belly.position.y = 0.65;
    group.add(belly);

    // Spots on body (fawn spots)
    for (let i = 0; i < 8; i++) {
        const spot = new THREE.Mesh(
            new THREE.SphereGeometry(0.04 + Math.random() * 0.03, 6, 6),
            materials.deerSpots
        );
        spot.position.set(
            (Math.random() - 0.5) * 0.25,
            0.72 + (Math.random() - 0.5) * 0.15,
            (Math.random() - 0.5) * 0.5
        );
        group.add(spot);
    }

    // Neck - long and elegant
    const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.14, 0.45, 10),
        materials.deerBrown
    );
    neck.position.set(0, 1.0, 0.42);
    neck.rotation.x = -0.35;
    group.add(neck);

    // Head - graceful
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 10),
        materials.deerBrown
    );
    head.scale.set(0.9, 1, 1.3);
    head.position.set(0, 1.2, 0.58);
    group.add(head);

    // Snout
    const snout = new THREE.Mesh(
        new THREE.ConeGeometry(0.07, 0.18, 8),
        materials.deerBrown
    );
    snout.rotation.x = -Math.PI / 2;
    snout.position.set(0, 1.15, 0.72);
    group.add(snout);

    // Nose
    const nose = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 6, 6),
        materials.beeBlack
    );
    nose.position.set(0, 1.15, 0.82);
    group.add(nose);

    // Eyes (large and gentle with shine)
    const eyeGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const eyeL = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeL.position.set(-0.08, 1.22, 0.65);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeR.position.set(0.08, 1.22, 0.65);
    group.add(eyeR);

    // Eye shine
    const shineGeo = new THREE.SphereGeometry(0.012, 4, 4);
    const shineL = new THREE.Mesh(shineGeo, materials.white);
    shineL.position.set(-0.075, 1.225, 0.68);
    group.add(shineL);
    const shineR = new THREE.Mesh(shineGeo, materials.white);
    shineR.position.set(0.085, 1.225, 0.68);
    group.add(shineR);

    // Ears - large and alert
    const earGeo = new THREE.ConeGeometry(0.055, 0.14, 6);
    const ear1 = new THREE.Mesh(earGeo, materials.deerBrown);
    ear1.position.set(-0.1, 1.35, 0.52);
    ear1.rotation.z = -0.4;
    ear1.rotation.x = -0.2;
    group.add(ear1);
    const ear2 = new THREE.Mesh(earGeo, materials.deerBrown);
    ear2.position.set(0.1, 1.35, 0.52);
    ear2.rotation.z = 0.4;
    ear2.rotation.x = -0.2;
    group.add(ear2);

    // Inner ears
    const innerEarGeo = new THREE.ConeGeometry(0.03, 0.08, 4);
    const innerEar1 = new THREE.Mesh(innerEarGeo, materials.rabbitPink);
    innerEar1.position.set(-0.1, 1.33, 0.54);
    innerEar1.rotation.z = -0.4;
    innerEar1.rotation.x = -0.2;
    group.add(innerEar1);
    const innerEar2 = new THREE.Mesh(innerEarGeo, materials.rabbitPink);
    innerEar2.position.set(0.1, 1.33, 0.54);
    innerEar2.rotation.z = 0.4;
    innerEar2.rotation.x = -0.2;
    group.add(innerEar2);

    // Antlers (if male - 50% chance) - more elaborate
    if (Math.random() > 0.5) {
        const antlerMat = materials.deerLight;

        // Helper to create antler branch
        const createBranch = (length, radius) => {
            return new THREE.CylinderGeometry(radius * 0.7, radius, length, 6);
        };

        // Left antler system
        const antlerGroupL = new THREE.Group();

        const mainL = new THREE.Mesh(createBranch(0.3, 0.025), antlerMat);
        mainL.position.y = 0.15;
        mainL.rotation.z = -0.3;
        antlerGroupL.add(mainL);

        const branchL1 = new THREE.Mesh(createBranch(0.15, 0.02), antlerMat);
        branchL1.position.set(-0.08, 0.22, 0);
        branchL1.rotation.z = -0.8;
        antlerGroupL.add(branchL1);

        const branchL2 = new THREE.Mesh(createBranch(0.12, 0.015), antlerMat);
        branchL2.position.set(-0.12, 0.32, 0);
        branchL2.rotation.z = -1.2;
        antlerGroupL.add(branchL2);

        const tipL = new THREE.Mesh(createBranch(0.1, 0.012), antlerMat);
        tipL.position.set(-0.05, 0.35, 0);
        tipL.rotation.z = 0.2;
        antlerGroupL.add(tipL);

        antlerGroupL.position.set(-0.06, 1.35, 0.5);
        group.add(antlerGroupL);

        // Right antler system (mirrored)
        const antlerGroupR = new THREE.Group();

        const mainR = new THREE.Mesh(createBranch(0.3, 0.025), antlerMat);
        mainR.position.y = 0.15;
        mainR.rotation.z = 0.3;
        antlerGroupR.add(mainR);

        const branchR1 = new THREE.Mesh(createBranch(0.15, 0.02), antlerMat);
        branchR1.position.set(0.08, 0.22, 0);
        branchR1.rotation.z = 0.8;
        antlerGroupR.add(branchR1);

        const branchR2 = new THREE.Mesh(createBranch(0.12, 0.015), antlerMat);
        branchR2.position.set(0.12, 0.32, 0);
        branchR2.rotation.z = 1.2;
        antlerGroupR.add(branchR2);

        const tipR = new THREE.Mesh(createBranch(0.1, 0.012), antlerMat);
        tipR.position.set(0.05, 0.35, 0);
        tipR.rotation.z = -0.2;
        antlerGroupR.add(tipR);

        antlerGroupR.position.set(0.06, 1.35, 0.5);
        group.add(antlerGroupR);
    }

    // Tail (white underside)
    const tail = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 8, 8),
        materials.deerSpots
    );
    tail.scale.set(0.8, 1, 1.2);
    tail.position.set(0, 0.68, -0.52);
    group.add(tail);

    // Legs - long and slender with hooves
    const legs = [];
    const legPositions = [
        { pos: [-0.12, 0, 0.22], front: true },
        { pos: [0.12, 0, 0.22], front: true },
        { pos: [-0.12, 0, -0.22], front: false },
        { pos: [0.12, 0, -0.22], front: false }
    ];

    legPositions.forEach(({ pos, front }) => {
        const legGroup = new THREE.Group();

        // Upper leg
        const upperLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.045, 0.04, 0.25, 8),
            materials.deerBrown
        );
        upperLeg.position.y = 0.35;
        legGroup.add(upperLeg);

        // Lower leg
        const lowerLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.035, 0.03, 0.25, 8),
            materials.deerBrown
        );
        lowerLeg.position.y = 0.12;
        legGroup.add(lowerLeg);

        // Hoof
        const hoof = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.035, 0.05, 8),
            materials.beeBlack
        );
        hoof.position.y = 0.025;
        legGroup.add(hoof);

        legGroup.position.set(...pos);
        legs.push(legGroup);
        group.add(legGroup);
    });

    group.position.set(x, y, z);
    group.scale.setScalar(1.1);

    group.userData = {
        type: 'deer',
        state: 'idle',
        stateTimer: 0,
        targetX: x,
        targetZ: z,
        speed: 0.035 + Math.random() * 0.02,
        legs: legs,
        walkCycle: 0,
        homeX: x,
        homeZ: z,
        confined: false,
        roamRadius: 50 + Math.random() * 40
    };

    scene.add(group);
    animals.push(group);
    return group;
}

// ==================== SQUIRREL ====================
export function createSquirrel(scene, x, z) {
    const group = new THREE.Group();
    const y = getHeightAt(x, z);

    // Body
    const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.07, 0.12, 6, 10),
        materials.squirrelBrown
    );
    body.rotation.x = Math.PI / 5;
    body.position.y = 0.16;
    body.castShadow = true;
    group.add(body);

    // Belly (lighter)
    const belly = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 8, 8),
        materials.squirrelLight
    );
    belly.scale.set(0.9, 1, 1.1);
    belly.position.set(0, 0.14, 0.04);
    group.add(belly);

    // Head
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 10, 10),
        materials.squirrelBrown
    );
    head.position.set(0, 0.28, 0.1);
    group.add(head);

    // Cheeks (white/light)
    const cheekL = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 6, 6),
        materials.squirrelLight
    );
    cheekL.position.set(-0.045, 0.26, 0.12);
    group.add(cheekL);
    const cheekR = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 6, 6),
        materials.squirrelLight
    );
    cheekR.position.set(0.045, 0.26, 0.12);
    group.add(cheekR);

    // Snout
    const snout = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 6, 6),
        materials.squirrelBrown
    );
    snout.scale.set(1, 0.8, 1.2);
    snout.position.set(0, 0.26, 0.16);
    group.add(snout);

    // Nose
    const nose = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 6, 6),
        materials.beeBlack
    );
    nose.position.set(0, 0.26, 0.19);
    group.add(nose);

    // Eyes (large and bright)
    const eyeGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const eyeL = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeL.position.set(-0.04, 0.3, 0.14);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeR.position.set(0.04, 0.3, 0.14);
    group.add(eyeR);

    // Eye shine (big for cute look)
    const shineGeo = new THREE.SphereGeometry(0.01, 4, 4);
    const shineL = new THREE.Mesh(shineGeo, materials.white);
    shineL.position.set(-0.035, 0.305, 0.16);
    group.add(shineL);
    const shineR = new THREE.Mesh(shineGeo, materials.white);
    shineR.position.set(0.045, 0.305, 0.16);
    group.add(shineR);

    // Ears (rounded with tufts)
    const earGeo = new THREE.SphereGeometry(0.025, 6, 6);
    const ear1 = new THREE.Mesh(earGeo, materials.squirrelBrown);
    ear1.scale.set(0.8, 1.2, 0.6);
    ear1.position.set(-0.045, 0.36, 0.08);
    group.add(ear1);
    const ear2 = new THREE.Mesh(earGeo, materials.squirrelBrown);
    ear2.scale.set(0.8, 1.2, 0.6);
    ear2.position.set(0.045, 0.36, 0.08);
    group.add(ear2);

    // Ear tufts
    const tuftGeo = new THREE.ConeGeometry(0.01, 0.025, 4);
    const tuft1 = new THREE.Mesh(tuftGeo, materials.squirrelBrown);
    tuft1.position.set(-0.045, 0.39, 0.08);
    group.add(tuft1);
    const tuft2 = new THREE.Mesh(tuftGeo, materials.squirrelBrown);
    tuft2.position.set(0.045, 0.39, 0.08);
    group.add(tuft2);

    // Big fluffy tail - multiple segments for fluffiness
    const tailGroup = new THREE.Group();

    const tail1 = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.05, 0.1, 6, 8),
        materials.squirrelBrown
    );
    tail1.position.y = 0.05;
    tailGroup.add(tail1);

    const tail2 = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.065, 0.12, 6, 8),
        materials.squirrelBrown
    );
    tail2.position.y = 0.15;
    tailGroup.add(tail2);

    const tail3 = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        materials.squirrelLight
    );
    tail3.scale.set(1, 1.3, 1);
    tail3.position.y = 0.28;
    tailGroup.add(tail3);

    tailGroup.position.set(0, 0.18, -0.12);
    tailGroup.rotation.x = -Math.PI / 2.5;
    group.add(tailGroup);

    // Legs with tiny paws
    const legs = [];

    // Front legs (holding pose)
    [-0.04, 0.04].forEach(xPos => {
        const legGroup = new THREE.Group();

        const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.012, 0.06, 6),
            materials.squirrelBrown
        );
        leg.position.y = 0.03;
        legGroup.add(leg);

        const paw = new THREE.Mesh(
            new THREE.SphereGeometry(0.015, 6, 6),
            materials.squirrelBrown
        );
        paw.scale.set(1, 0.6, 1.2);
        paw.position.y = 0.005;
        legGroup.add(paw);

        legGroup.position.set(xPos, 0.06, 0.08);
        legs.push(legGroup);
        group.add(legGroup);
    });

    // Back legs (bigger for jumping)
    [-0.045, 0.045].forEach(xPos => {
        const legGroup = new THREE.Group();

        const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.018, 0.015, 0.08, 6),
            materials.squirrelBrown
        );
        leg.position.y = 0.04;
        legGroup.add(leg);

        const foot = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.012, 0.03, 4, 6),
            materials.squirrelBrown
        );
        foot.rotation.x = Math.PI / 2;
        foot.position.set(0, 0.01, 0.015);
        legGroup.add(foot);

        legGroup.position.set(xPos, 0.04, -0.06);
        legs.push(legGroup);
        group.add(legGroup);
    });

    group.position.set(x, y, z);
    group.scale.setScalar(1.5);

    group.userData = {
        type: 'squirrel',
        state: 'idle',
        stateTimer: 0,
        targetX: x,
        targetZ: z,
        speed: 0.06 + Math.random() * 0.03,
        legs: legs,
        tail: tailGroup,
        walkCycle: 0,
        homeX: x,
        homeZ: z,
        confined: false,
        roamRadius: 20 + Math.random() * 15
    };

    scene.add(group);
    animals.push(group);
    return group;
}

// ==================== FROG ====================
export function createFrog(scene, x, z) {
    const group = new THREE.Group();
    const y = getHeightAt(x, z);

    // Vibrant frog colors!
    const frogColors = [
        { body: 0x00ff44, belly: 0xccffcc }, // Bright green
        { body: 0x44ff00, belly: 0xddffaa }, // Lime green
        { body: 0xffdd00, belly: 0xffffcc }, // Yellow
        { body: 0xff6600, belly: 0xffddaa }, // Orange
        { body: 0x00ccff, belly: 0xccffff }, // Cyan/blue
        { body: 0xff0066, belly: 0xffccdd }, // Pink/red (poison dart frog)
        { body: 0x9933ff, belly: 0xddccff }, // Purple
        { body: 0x33ff99, belly: 0xccffee }, // Teal
    ];

    const colorScheme = frogColors[Math.floor(Math.random() * frogColors.length)];
    const bodyColor = new THREE.MeshStandardMaterial({ color: colorScheme.body, roughness: 0.5 });
    const bellyColor = new THREE.MeshStandardMaterial({ color: colorScheme.belly, roughness: 0.4 });

    // Body - squat and round
    const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 10),
        bodyColor
    );
    body.scale.set(1.2, 0.7, 1.4);
    body.position.y = 0.1;
    body.castShadow = true;
    group.add(body);

    // Belly
    const belly = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 8, 8),
        bellyColor
    );
    belly.scale.set(1.1, 0.6, 1.2);
    belly.position.set(0, 0.06, 0.02);
    group.add(belly);

    // Head - wide and flat
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 10, 10),
        bodyColor
    );
    head.scale.set(1.3, 0.7, 1);
    head.position.set(0, 0.12, 0.14);
    group.add(head);

    // Big bulging eyes
    const eyeBulgeGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const eyeBulgeL = new THREE.Mesh(eyeBulgeGeo, bodyColor);
    eyeBulgeL.position.set(-0.07, 0.18, 0.16);
    group.add(eyeBulgeL);
    const eyeBulgeR = new THREE.Mesh(eyeBulgeGeo, bodyColor);
    eyeBulgeR.position.set(0.07, 0.18, 0.16);
    group.add(eyeBulgeR);

    // Eyeballs (black with shine)
    const eyeGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const eyeL = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeL.position.set(-0.07, 0.2, 0.19);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, materials.beeBlack);
    eyeR.position.set(0.07, 0.2, 0.19);
    group.add(eyeR);

    // Eye shine
    const shineGeo = new THREE.SphereGeometry(0.008, 4, 4);
    const shineL = new THREE.Mesh(shineGeo, materials.white);
    shineL.position.set(-0.065, 0.205, 0.21);
    group.add(shineL);
    const shineR = new THREE.Mesh(shineGeo, materials.white);
    shineR.position.set(0.075, 0.205, 0.21);
    group.add(shineR);

    // Mouth line
    const mouthGeo = new THREE.BoxGeometry(0.12, 0.01, 0.02);
    const mouth = new THREE.Mesh(mouthGeo, materials.beeBlack);
    mouth.position.set(0, 0.08, 0.22);
    group.add(mouth);

    // Nostrils
    const nostrilGeo = new THREE.SphereGeometry(0.008, 4, 4);
    const nostrilL = new THREE.Mesh(nostrilGeo, materials.beeBlack);
    nostrilL.position.set(-0.025, 0.12, 0.23);
    group.add(nostrilL);
    const nostrilR = new THREE.Mesh(nostrilGeo, materials.beeBlack);
    nostrilR.position.set(0.025, 0.12, 0.23);
    group.add(nostrilR);

    // Back legs (big and powerful for jumping)
    const legs = [];

    // Back legs
    [-1, 1].forEach(side => {
        const legGroup = new THREE.Group();

        // Thigh
        const thigh = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.035, 0.08, 4, 6),
            bodyColor
        );
        thigh.rotation.z = side * 0.8;
        thigh.rotation.x = 0.3;
        thigh.position.set(side * 0.06, 0.04, -0.06);
        legGroup.add(thigh);

        // Shin
        const shin = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.025, 0.07, 4, 6),
            bodyColor
        );
        shin.rotation.z = side * -0.5;
        shin.position.set(side * 0.12, 0.02, -0.04);
        legGroup.add(shin);

        // Foot (webbed)
        const foot = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.01, 0.08),
            bodyColor
        );
        foot.position.set(side * 0.14, 0.01, -0.02);
        legGroup.add(foot);

        legs.push(legGroup);
        group.add(legGroup);
    });

    // Front legs (smaller)
    [-1, 1].forEach(side => {
        const legGroup = new THREE.Group();

        const frontLeg = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.02, 0.04, 4, 6),
            bodyColor
        );
        frontLeg.rotation.z = side * 0.4;
        frontLeg.position.set(side * 0.08, 0.03, 0.1);
        legGroup.add(frontLeg);

        const frontFoot = new THREE.Mesh(
            new THREE.BoxGeometry(0.03, 0.008, 0.04),
            bodyColor
        );
        frontFoot.position.set(side * 0.1, 0.01, 0.12);
        legGroup.add(frontFoot);

        legs.push(legGroup);
        group.add(legGroup);
    });

    group.position.set(x, y, z);
    group.scale.setScalar(1.8);

    group.userData = {
        type: 'frog',
        state: 'idle',
        stateTimer: 0,
        targetX: x,
        targetZ: z,
        speed: 0.08, // Fast when jumping
        legs: legs,
        walkCycle: 0,
        homeX: x,
        homeZ: z,
        confined: false,
        roamRadius: 8, // Stay near pond
        jumpTimer: 0,
        isJumping: false
    };

    scene.add(group);
    animals.push(group);
    return group;
}

// ==================== SPAWN ANIMALS ====================
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
        registerPosition(pos.x, pos.z, 0.5);
        createChicken(scene, pos.x, pos.z);
    }

    // Sheep
    for (let i = 0; i < 4; i++) {
        const pos = nextFarmPos(1.5);
        registerPosition(pos.x, pos.z, 1);
        createSheep(scene, pos.x, pos.z);
    }

    // Pigs
    for (let i = 0; i < 3; i++) {
        const pos = nextFarmPos(1.2);
        registerPosition(pos.x, pos.z, 0.8);
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
        const dist = pondRadius + 0.5 + Math.random() * 3; // On the edge or nearby
        const frogX = pondX + Math.cos(angle) * dist;
        const frogZ = pondZ + Math.sin(angle) * dist;
        createFrog(scene, frogX, frogZ);
    }
}
