import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { getHeightAt } from './terrain.js';

// Movement state
export const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false
};

// Drone state
export let droneMode = false;
export let drone = null;

const moveSpeed = 0.5;
const droneSpeed = 0.3;

// ==================== SETUP CONTROLS ====================
export function setupControls(camera, renderer) {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 5;
    controls.maxDistance = 150;
    controls.target.set(0, 3, 0);

    // Keyboard events
    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'KeyW': moveState.forward = true; break;
            case 'KeyS': moveState.backward = true; break;
            case 'KeyA': moveState.left = true; break;
            case 'KeyD': moveState.right = true; break;
            case 'KeyQ': case 'ShiftLeft': moveState.down = true; break;
            case 'KeyE': case 'Space': moveState.up = true; e.preventDefault(); break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'KeyW': moveState.forward = false; break;
            case 'KeyS': moveState.backward = false; break;
            case 'KeyA': moveState.left = false; break;
            case 'KeyD': moveState.right = false; break;
            case 'KeyQ': case 'ShiftLeft': moveState.down = false; break;
            case 'KeyE': case 'Space': moveState.up = false; break;
        }
    });

    return controls;
}

// ==================== DRONE CREATION ====================
export function createDrone(scene) {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x333333, roughness: 0.4, metalness: 0.8
    });

    const lensMat = new THREE.MeshStandardMaterial({
        color: 0x00aaff, emissive: 0x0044aa, emissiveIntensity: 0.5
    });

    const armMat = new THREE.MeshStandardMaterial({
        color: 0x444444, roughness: 0.5, metalness: 0.5
    });

    const propMat = new THREE.MeshStandardMaterial({
        color: 0x666666, transparent: true, opacity: 0.9
    });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.6), bodyMat);
    body.castShadow = true;
    group.add(body);

    // Camera lens
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.1), lensMat);
    lens.position.set(0, 0, 0.35);
    group.add(lens);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.8, 0.05, 0.08);
    const arm1 = new THREE.Mesh(armGeo, armMat);
    arm1.rotation.y = Math.PI / 4;
    group.add(arm1);

    const arm2 = new THREE.Mesh(armGeo, armMat);
    arm2.rotation.y = -Math.PI / 4;
    group.add(arm2);

    // Propellers
    const propGeo = new THREE.BoxGeometry(0.4, 0.02, 0.08);
    const propPositions = [
        { x: 0.35, z: 0.35 },
        { x: -0.35, z: 0.35 },
        { x: 0.35, z: -0.35 },
        { x: -0.35, z: -0.35 }
    ];

    const propellers = [];
    propPositions.forEach(pos => {
        const prop = new THREE.Mesh(propGeo, propMat);
        prop.position.set(pos.x, 0.12, pos.z);
        propellers.push(prop);
        group.add(prop);
    });

    // Lights
    const ledGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    const ledGreen = new THREE.Mesh(ledGeo, new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
    ledGreen.position.set(-0.35, 0, 0.35);
    group.add(ledGreen);

    const ledRed = new THREE.Mesh(ledGeo, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    ledRed.position.set(0.35, 0, 0.35);
    group.add(ledRed);

    group.position.set(0, 5, 0);
    group.userData = { propellers, velocityY: 0, targetHeight: 5 };

    scene.add(group);
    return group;
}

// ==================== INIT DRONE (always active) ====================
export function initDrone(scene, controls) {
    droneMode = true;
    drone = createDrone(scene);
    drone.position.set(controls.target.x, 5, controls.target.z);
    return drone;
}

// ==================== UPDATE CONTROLS ====================
export function updateControls(camera, controls) {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(direction, new THREE.Vector3(0, 1, 0));

    if (droneMode && drone) {
        // DRONE MODE
        controls.enablePan = false;
        controls.enableZoom = true;
        controls.enableRotate = true;

        const dronePrevPos = drone.position.clone();
        const speed = droneSpeed;

        // Camera direction
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        camDir.y = 0;
        camDir.normalize();

        const camRight = new THREE.Vector3();
        camRight.crossVectors(camDir, new THREE.Vector3(0, 1, 0));

        // Move drone
        if (moveState.forward) {
            drone.position.x += camDir.x * speed;
            drone.position.z += camDir.z * speed;
        }
        if (moveState.backward) {
            drone.position.x -= camDir.x * speed;
            drone.position.z -= camDir.z * speed;
        }
        if (moveState.left) {
            drone.position.x -= camRight.x * speed;
            drone.position.z -= camRight.z * speed;
        }
        if (moveState.right) {
            drone.position.x += camRight.x * speed;
            drone.position.z += camRight.z * speed;
        }

        // Height limits
        const MAX_HEIGHT = 80;
        const MAP_LIMIT = 140;

        // Map boundaries
        const distFromCenter = Math.sqrt(drone.position.x * drone.position.x + drone.position.z * drone.position.z);
        if (distFromCenter > MAP_LIMIT) {
            const angle = Math.atan2(drone.position.z, drone.position.x);
            drone.position.x = Math.cos(angle) * MAP_LIMIT;
            drone.position.z = Math.sin(angle) * MAP_LIMIT;
        }

        // Terrain collision
        const groundHeight = getHeightAt(drone.position.x, drone.position.z);
        const minDroneHeight = groundHeight + 1;
        if (drone.position.y < minDroneHeight) {
            drone.position.y = minDroneHeight;
        }
        if (drone.position.y > MAX_HEIGHT) drone.position.y = MAX_HEIGHT;

        if (moveState.up) {
            drone.position.y = Math.min(drone.position.y + speed * 1.5, MAX_HEIGHT);
        }
        if (moveState.down) {
            drone.position.y = Math.max(drone.position.y - speed * 1.5, minDroneHeight);
        }

        // Drone facing direction
        const isMoving = moveState.forward || moveState.backward || moveState.left || moveState.right;
        if (isMoving) {
            let moveDir = new THREE.Vector3();
            if (moveState.forward) moveDir.add(camDir);
            if (moveState.backward) moveDir.sub(camDir);
            if (moveState.left) moveDir.sub(camRight);
            if (moveState.right) moveDir.add(camRight);
            if (moveDir.length() > 0) {
                drone.rotation.y = Math.atan2(moveDir.x, moveDir.z);
            }
        }

        // Tilt
        const tiltAmount = 0.25;
        const targetTiltX = moveState.forward ? tiltAmount : (moveState.backward ? -tiltAmount : 0);
        const targetTiltZ = moveState.left ? -tiltAmount : (moveState.right ? tiltAmount : 0);
        drone.rotation.x += (targetTiltX - drone.rotation.x) * 0.15;
        drone.rotation.z += (targetTiltZ - drone.rotation.z) * 0.15;

        // Propellers
        const propSpeed = isMoving ? 1.2 : 0.6;
        drone.userData.propellers.forEach(prop => {
            prop.rotation.y += propSpeed;
        });

        // Camera follows drone
        const droneDelta = drone.position.clone().sub(dronePrevPos);
        camera.position.add(droneDelta);
        controls.target.copy(drone.position);

    } else {
        // FREE CAMERA MODE
        controls.enablePan = true;

        if (moveState.forward || moveState.backward || moveState.left || moveState.right || moveState.up || moveState.down) {
            const speed = moveSpeed * 2;

            if (moveState.forward) {
                camera.position.addScaledVector(direction, speed);
                controls.target.addScaledVector(direction, speed);
            }
            if (moveState.backward) {
                camera.position.addScaledVector(direction, -speed);
                controls.target.addScaledVector(direction, -speed);
            }
            if (moveState.left) {
                camera.position.addScaledVector(right, -speed);
                controls.target.addScaledVector(right, -speed);
            }
            if (moveState.right) {
                camera.position.addScaledVector(right, speed);
                controls.target.addScaledVector(right, speed);
            }
            if (moveState.up) {
                camera.position.y += speed;
                controls.target.y += speed;
            }
            if (moveState.down) {
                camera.position.y -= speed;
                controls.target.y -= speed;
            }

            // Terrain collision
            const camX = camera.position.x;
            const camZ = camera.position.z;
            const groundH = getHeightAt(camX, camZ);
            const minH = groundH + 2;
            if (camera.position.y < minH) {
                camera.position.y = minH;
            }

            // Height ceiling
            const MAX_HEIGHT = 80;
            if (camera.position.y > MAX_HEIGHT) {
                camera.position.y = MAX_HEIGHT;
            }

            // Map boundaries
            const MAP_LIMIT = 140;
            const distFromCenter = Math.sqrt(camX * camX + camZ * camZ);
            if (distFromCenter > MAP_LIMIT) {
                const angle = Math.atan2(camZ, camX);
                camera.position.x = Math.cos(angle) * MAP_LIMIT;
                camera.position.z = Math.sin(angle) * MAP_LIMIT;
                controls.target.x = Math.cos(angle) * (MAP_LIMIT - 5);
                controls.target.z = Math.sin(angle) * (MAP_LIMIT - 5);
            }
        }
    }

    controls.update();
}
