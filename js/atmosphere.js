import * as THREE from 'three';

// ==================== CLOUDS (Sphere Groups) ====================
export function createCloudGroup() {
    const cloudGroup = new THREE.Group();
    const cloudGeo = new THREE.SphereGeometry(1, 16, 16);
    const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.9,
        flatShading: true,
        transparent: true,
        opacity: 0.9
    });

    const clusters = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < clusters; i++) {
        const mesh = new THREE.Mesh(cloudGeo, cloudMat);
        mesh.position.set(
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 2
        );
        mesh.scale.setScalar(0.8 + Math.random() * 1.2);
        cloudGroup.add(mesh);
    }

    cloudGroup.position.set(
        (Math.random() - 0.5) * 350,
        32 + Math.random() * 25,
        (Math.random() - 0.5) * 350
    );

    cloudGroup.userData = {
        speed: 0.01 + Math.random() * 0.02
    };

    return cloudGroup;
}

export function createClouds(scene) {
    const clouds = [];
    for (let i = 0; i < 30; i++) {
        const cloud = createCloudGroup();
        scene.add(cloud);
        clouds.push(cloud);
    }
    return clouds;
}

// ==================== INSTANCED CLOUDS ====================
export function createInstancedClouds(scene) {
    const cloudCount = 70;
    const cloudGeo = new THREE.BoxGeometry(4, 1.5, 4);
    const cloudMat = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
    });

    const cloudMesh = new THREE.InstancedMesh(cloudGeo, cloudMat, cloudCount);
    const cloudData = [];
    const dummy = new THREE.Object3D();

    for (let i = 0; i < cloudCount; i++) {
        const x = (Math.random() - 0.5) * 350;
        const y = 28 + Math.random() * 30;
        const z = (Math.random() - 0.5) * 350;
        const scale = 0.5 + Math.random() * 2;

        cloudData.push({ x, y, z, scale, speed: 0.015 + Math.random() * 0.025 });
        dummy.position.set(x, y, z);
        dummy.scale.set(scale, scale * 0.5, scale);
        dummy.updateMatrix();
        cloudMesh.setMatrixAt(i, dummy.matrix);
    }

    cloudMesh.instanceMatrix.needsUpdate = true;
    scene.add(cloudMesh);

    return { cloudMesh, cloudData, dummy };
}

// ==================== POLLEN/DUST ====================
export function createPollen(scene) {
    const pollenCount = 300;
    const pollenGeo = new THREE.BufferGeometry();
    const pollenPositions = new Float32Array(pollenCount * 3);
    const pollenData = [];

    for (let i = 0; i < pollenCount; i++) {
        const x = (Math.random() - 0.5) * 280;
        const y = 1 + Math.random() * 12;
        const z = (Math.random() - 0.5) * 280;
        pollenPositions[i * 3] = x;
        pollenPositions[i * 3 + 1] = y;
        pollenPositions[i * 3 + 2] = z;

        pollenData.push({
            speed: 0.002 + Math.random() * 0.003,
            drift: Math.random() * Math.PI * 2,
            driftSpeed: 0.01 + Math.random() * 0.02
        });
    }

    pollenGeo.setAttribute('position', new THREE.BufferAttribute(pollenPositions, 3));

    const pollenMat = new THREE.PointsMaterial({
        color: 0xffffcc,
        size: 0.08,
        transparent: true,
        opacity: 0.6
    });

    const pollenMesh = new THREE.Points(pollenGeo, pollenMat);
    scene.add(pollenMesh);

    return { pollenMesh, pollenData, pollenCount };
}

// ==================== FALLING LEAVES ====================
export function createFallingLeaves(scene) {
    const leafCount = 80;
    const leafGeo = new THREE.BoxGeometry(0.15, 0.02, 0.1);
    const leafColors = [0x8b4513, 0xd2691e, 0xcd853f, 0x228b22, 0x32cd32];
    const leafMeshes = [];
    const leafDataArr = [];

    for (let i = 0; i < leafCount; i++) {
        const color = leafColors[Math.floor(Math.random() * leafColors.length)];
        const leaf = new THREE.Mesh(
            leafGeo,
            new THREE.MeshLambertMaterial({ color })
        );
        leaf.position.set(
            (Math.random() - 0.5) * 280,
            15 + Math.random() * 25,
            (Math.random() - 0.5) * 280
        );
        leaf.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        scene.add(leaf);
        leafMeshes.push(leaf);

        leafDataArr.push({
            fallSpeed: 0.5 + Math.random() * 0.5,
            swayPhase: Math.random() * Math.PI * 2,
            swaySpeed: 1 + Math.random() * 2,
            spinSpeed: 0.5 + Math.random() * 1.5,
            driftX: (Math.random() - 0.5) * 0.02,
            driftZ: (Math.random() - 0.5) * 0.02
        });
    }

    return { leafMeshes, leafDataArr, leafCount };
}

// ==================== CHIMNEY SMOKE ====================
export function createChimneySmoke(scene) {
    const smokeParticles = [];
    const particlesPerChimney = 20;
    const smokeGeo = new THREE.SphereGeometry(0.15, 6, 6);
    const smokeMat = new THREE.MeshBasicMaterial({
        color: 0xcccccc,
        transparent: true,
        opacity: 0.4
    });

    return {
        particles: smokeParticles,
        geo: smokeGeo,
        mat: smokeMat,
        particlesPerChimney,
        scene
    };
}

export function addSmokeToHouse(smokeSystem, house) {
    const { particles, geo, mat, particlesPerChimney, scene } = smokeSystem;
    const hd = house.userData;

    // Only add smoke if house has chimney
    if (!hd.hasChimney || !hd.chimneyPos) return;

    // Use actual chimney position
    const chimneyX = hd.x + hd.chimneyPos.localX;
    const chimneyZ = hd.z + hd.chimneyPos.localZ;
    const chimneyY = hd.chimneyPos.topY;

    for (let i = 0; i < particlesPerChimney; i++) {
        const particle = new THREE.Mesh(geo, mat.clone());
        particle.position.set(
            chimneyX + (Math.random() - 0.5) * 0.3,
            chimneyY + Math.random() * 3,
            chimneyZ + (Math.random() - 0.5) * 0.3
        );

        const scale = 0.3 + Math.random() * 0.4;
        particle.scale.setScalar(scale);

        particle.userData = {
            baseX: chimneyX,
            baseY: chimneyY,
            baseZ: chimneyZ,
            phase: Math.random() * Math.PI * 2,
            speed: 0.3 + Math.random() * 0.3,
            drift: (Math.random() - 0.5) * 0.02,
            maxHeight: 6 + Math.random() * 3,
            initialOpacity: 0.3 + Math.random() * 0.2
        };

        scene.add(particle);
        particles.push(particle);
    }
}

export function updateChimneySmoke(smokeSystem, dt) {
    const { particles } = smokeSystem;

    for (const particle of particles) {
        const pd = particle.userData;
        pd.phase += dt;

        // Rise up
        particle.position.y += pd.speed * dt;

        // Drift sideways
        particle.position.x += pd.drift + Math.sin(pd.phase * 2) * 0.005;
        particle.position.z += Math.cos(pd.phase * 1.5) * 0.003;

        // Expand as it rises
        const heightProgress = (particle.position.y - pd.baseY) / pd.maxHeight;
        particle.scale.setScalar(0.3 + heightProgress * 0.8);

        // Fade out as it rises
        particle.material.opacity = pd.initialOpacity * (1 - heightProgress * 0.8);

        // Reset when too high
        if (particle.position.y > pd.baseY + pd.maxHeight) {
            particle.position.set(
                pd.baseX + (Math.random() - 0.5) * 0.3,
                pd.baseY,
                pd.baseZ + (Math.random() - 0.5) * 0.3
            );
            pd.phase = Math.random() * Math.PI * 2;
        }
    }
}

// ==================== UPDATE FUNCTIONS ====================
export function updateClouds(clouds) {
    clouds.forEach(cloud => {
        cloud.position.x += cloud.userData.speed;
        if (cloud.position.x > 180) cloud.position.x = -180;
    });
}

export function updateInstancedClouds(cloudMesh, cloudData, cloudCount, dummy) {
    for (let i = 0; i < cloudCount; i++) {
        cloudData[i].x += cloudData[i].speed;
        if (cloudData[i].x > 180) cloudData[i].x = -180;
        dummy.position.set(cloudData[i].x, cloudData[i].y, cloudData[i].z);
        dummy.scale.set(cloudData[i].scale, cloudData[i].scale * 0.5, cloudData[i].scale);
        dummy.updateMatrix();
        cloudMesh.setMatrixAt(i, dummy.matrix);
    }
    cloudMesh.instanceMatrix.needsUpdate = true;
}

export function updatePollen(pollenMesh, pollenData, pollenCount, dt) {
    const pollenPos = pollenMesh.geometry.attributes.position.array;

    for (let i = 0; i < pollenCount; i++) {
        const pd = pollenData[i];
        pd.drift += pd.driftSpeed * dt;
        pollenPos[i * 3] += Math.sin(pd.drift) * 0.01;
        pollenPos[i * 3 + 1] += Math.sin(pd.drift * 0.5) * 0.005;
        pollenPos[i * 3 + 2] += Math.cos(pd.drift) * 0.01;

        // Wrap around
        if (pollenPos[i * 3] > 140) pollenPos[i * 3] = -140;
        if (pollenPos[i * 3] < -140) pollenPos[i * 3] = 140;
        if (pollenPos[i * 3 + 2] > 140) pollenPos[i * 3 + 2] = -140;
        if (pollenPos[i * 3 + 2] < -140) pollenPos[i * 3 + 2] = 140;
    }

    pollenMesh.geometry.attributes.position.needsUpdate = true;
}

export function updateLeaves(leafMeshes, leafDataArr, leafCount, dt) {
    for (let i = 0; i < leafCount; i++) {
        const leaf = leafMeshes[i];
        const ld = leafDataArr[i];

        ld.swayPhase += ld.swaySpeed * dt;
        leaf.position.y -= ld.fallSpeed * dt;
        leaf.position.x += Math.sin(ld.swayPhase) * 0.02 + ld.driftX;
        leaf.position.z += Math.cos(ld.swayPhase * 0.7) * 0.015 + ld.driftZ;
        leaf.rotation.x += ld.spinSpeed * dt * 0.5;
        leaf.rotation.z += ld.spinSpeed * dt * 0.3;

        // Reset when too low
        if (leaf.position.y < 0) {
            leaf.position.y = 15 + Math.random() * 25;
            leaf.position.x = (Math.random() - 0.5) * 280;
            leaf.position.z = (Math.random() - 0.5) * 280;
        }
    }
}
