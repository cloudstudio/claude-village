/**
 * Ground - Terrain and ground creation
 */

import * as THREE from 'three';
import { getHeightAt } from '../utils/height.js';

/**
 * Create grass texture for the terrain
 * @returns {THREE.CanvasTexture} Grass texture
 */
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

/**
 * Create snow texture for mountain peaks
 * @returns {THREE.CanvasTexture} Snow texture
 */
export function createSnowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#f0f5ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

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

/**
 * Create the ground plane with grass and snow blending
 * @param {THREE.Scene} scene - The scene to add ground to
 * @returns {THREE.Mesh} The ground mesh
 */
export function createGround(scene) {
    const grassTexture = createGrassTexture();

    const groundMat = new THREE.MeshStandardMaterial({
        map: grassTexture,
        roughness: 1,
        vertexColors: true
    });

    const groundGeo = new THREE.PlaneGeometry(600, 600, 192, 192);
    const posAttribute = groundGeo.attributes.position;
    const vertex = new THREE.Vector3();

    // Create vertex colors array for snow blending
    const colors = new Float32Array(posAttribute.count * 3);
    const snowStartHeight = 25;
    const fullSnowHeight = 40;

    for (let i = 0; i < posAttribute.count; i++) {
        vertex.fromBufferAttribute(posAttribute, i);
        const x = vertex.x;
        const y = vertex.y;

        // Calculate height at this position
        const height = getHeightAt(x, y);
        posAttribute.setZ(i, height);

        // Calculate snow blend based on height
        let snowBlend = 0;
        if (height > snowStartHeight) {
            snowBlend = Math.min(1, (height - snowStartHeight) / (fullSnowHeight - snowStartHeight));
        }

        // Green grass color blending to white snow
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
