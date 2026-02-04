/**
 * Scene - Three.js scene, camera, renderer, and post-processing setup
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { skyColor } from '../config/index.js';

// Scene components (exported after initialization)
let scene = null;
let camera = null;
let renderer = null;
let composer = null;
let controls = null;

/**
 * Initialize Three.js scene, camera, renderer, and post-processing
 * @returns {Object} Object containing scene, camera, renderer, composer, controls
 */
export function initScene() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.Fog(skyColor, 80, 200);

    // Camera
    camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        500
    );
    camera.position.set(0, 35, 50);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Post-processing
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.3,   // strength
        0.4,   // radius
        0.85   // threshold
    );
    composer.addPass(bloomPass);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.minDistance = 10;
    controls.maxDistance = 150;
    controls.target.set(0, 0, 0);

    // Window resize handler
    window.addEventListener('resize', handleResize);

    return { scene, camera, renderer, composer, controls };
}

/**
 * Handle window resize
 */
function handleResize() {
    if (!camera || !renderer || !composer) return;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Get the scene
 * @returns {THREE.Scene}
 */
export function getScene() {
    return scene;
}

/**
 * Get the camera
 * @returns {THREE.PerspectiveCamera}
 */
export function getCamera() {
    return camera;
}

/**
 * Get the renderer
 * @returns {THREE.WebGLRenderer}
 */
export function getRenderer() {
    return renderer;
}

/**
 * Get the composer
 * @returns {EffectComposer}
 */
export function getComposer() {
    return composer;
}

/**
 * Get the controls
 * @returns {OrbitControls}
 */
export function getControls() {
    return controls;
}

/**
 * Create lighting for the scene
 * @param {THREE.Scene} sceneRef - The scene to add lights to
 * @returns {Object} Object containing created lights
 */
export function createLighting(sceneRef) {
    // Hemisphere light (sky/ground ambient)
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x98D982, 0.8);
    hemiLight.position.set(0, 50, 0);
    sceneRef.add(hemiLight);

    // Directional light (sun)
    const dirLight = new THREE.DirectionalLight(0xFFF5E0, 1.2);
    dirLight.position.set(50, 80, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.left = -80;
    dirLight.shadow.camera.right = 80;
    dirLight.shadow.camera.top = 80;
    dirLight.shadow.camera.bottom = -80;
    dirLight.shadow.bias = -0.0001;
    sceneRef.add(dirLight);

    // Visible sun sphere
    const sunGeom = new THREE.SphereGeometry(3, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFFF99 });
    const sun = new THREE.Mesh(sunGeom, sunMat);
    sun.position.copy(dirLight.position);
    sceneRef.add(sun);

    return { hemiLight, dirLight, sun };
}
