/**
 * GameLoop - Main animation loop orchestrating all systems
 */

import {
    updateWaterSystem,
    updateAnimalSystem,
    updateInsectSystem,
    updateAgentSystem,
    updateFileSystem
} from '../systems/index.js';
import { updateAgentsPanel } from '../ui/index.js';

// Timing
let lastTime = 0;
let isRunning = false;
let animationFrameId = null;

// References to scene components
let composerRef = null;
let controlsRef = null;

// Atmosphere update functions (set from main)
let atmosphereUpdates = null;

/**
 * Initialize the game loop with required references
 * @param {Object} refs - Object containing composer, controls
 */
export function initGameLoop(refs) {
    composerRef = refs.composer;
    controlsRef = refs.controls;
}

/**
 * Set atmosphere update functions
 * @param {Object} updates - Object with atmosphere update functions and data
 */
export function setAtmosphereUpdates(updates) {
    atmosphereUpdates = updates;
}

/**
 * Main animation loop
 * @param {number} currentTime - Current timestamp from requestAnimationFrame
 */
function animate(currentTime) {
    if (!isRunning) return;

    animationFrameId = requestAnimationFrame(animate);

    // Calculate delta time
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap at 100ms
    lastTime = currentTime;

    // Update controls
    if (controlsRef) {
        controlsRef.update();
    }

    // Update atmosphere (clouds, pollen, leaves, smoke)
    if (atmosphereUpdates) {
        const { updateClouds, updatePollen, updateLeaves, updateChimneySmoke } = atmosphereUpdates.functions;
        const { clouds, pollenMesh, pollenData, pollenCount, leafMeshes, leafDataArr, leafCount, smokeSystem } = atmosphereUpdates.data;

        if (updateClouds && clouds) updateClouds(clouds);
        if (updatePollen && pollenMesh) updatePollen(pollenMesh, pollenData, pollenCount, dt);
        if (updateLeaves && leafMeshes) updateLeaves(leafMeshes, leafDataArr, leafCount, dt);
        if (updateChimneySmoke && smokeSystem) updateChimneySmoke(smokeSystem, dt);
    }

    // Update pond water
    updateWaterSystem(dt, currentTime);

    // Update animals
    updateAnimalSystem(dt, currentTime);

    // Update insects (butterflies, bees, birds)
    updateInsectSystem(dt, currentTime);

    // Update agents
    updateAgentSystem(dt, currentTime);

    // Update floating files
    updateFileSystem(dt, currentTime);

    // Update UI
    updateAgentsPanel();

    // Render with post-processing
    if (composerRef) {
        composerRef.render();
    }
}

/**
 * Start the game loop
 */
export function startGameLoop() {
    if (isRunning) return;

    isRunning = true;
    lastTime = performance.now();
    animationFrameId = requestAnimationFrame(animate);
}

/**
 * Stop the game loop
 */
export function stopGameLoop() {
    isRunning = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

/**
 * Check if game loop is running
 * @returns {boolean}
 */
export function isGameLoopRunning() {
    return isRunning;
}

/**
 * Get current FPS (approximate)
 * @returns {number}
 */
let fpsCounter = 0;
let fpsTime = 0;
let currentFPS = 60;

export function getFPS() {
    return currentFPS;
}
