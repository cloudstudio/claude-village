/**
 * FloatingText - Text sprites for agents
 */

import * as THREE from 'three';

/**
 * Create a text canvas for sprites
 * @param {string} text - Text to display
 * @param {number} fontSize - Font size (default 48)
 * @param {string} fontFamily - Font family (default 'Arial')
 * @param {string} color - Text color (default white)
 * @param {string} bgColor - Background color (default semi-transparent black)
 * @returns {HTMLCanvasElement} The canvas element
 */
function createTextCanvas(text, fontSize = 48, fontFamily = 'Arial', color = '#ffffff', bgColor = 'rgba(0,0,0,0.7)') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Measure text
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;

    // Set canvas size with padding
    const padding = 20;
    canvas.width = textWidth + padding * 2;
    canvas.height = fontSize + padding * 2;

    // Draw background
    ctx.fillStyle = bgColor;
    const radius = 10;
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, radius);
    ctx.fill();

    // Draw text
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    return canvas;
}

/**
 * Show text above an agent
 * @param {THREE.Group} agent - The agent
 * @param {string} text - Text to display
 * @returns {THREE.Sprite} The text sprite
 */
export function showAgentText(agent, text) {
    // Remove existing text if any
    hideAgentText(agent);

    const canvas = createTextCanvas(text, 24);  // Smaller font
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
    });

    const sprite = new THREE.Sprite(material);

    // Scale based on canvas aspect ratio - HALF SIZE
    const aspect = canvas.width / canvas.height;
    const scale = 1.25;  // Was 2.5, now half
    sprite.scale.set(scale * aspect, scale, 1);

    // Position above agent's head
    sprite.position.y = 2.5;

    agent.add(sprite);
    agent.userData.textSprite = sprite;
    agent.userData.textCanvas = canvas;

    return sprite;
}

/**
 * Hide text above an agent
 * @param {THREE.Group} agent - The agent
 */
export function hideAgentText(agent) {
    if (agent.userData.textSprite) {
        agent.remove(agent.userData.textSprite);
        if (agent.userData.textSprite.material.map) {
            agent.userData.textSprite.material.map.dispose();
        }
        agent.userData.textSprite.material.dispose();
        agent.userData.textSprite = null;
        agent.userData.textCanvas = null;
    }
}

/**
 * Update text above an agent
 * @param {THREE.Group} agent - The agent
 * @param {string} text - New text to display
 */
export function updateAgentText(agent, text) {
    if (agent.userData.textSprite) {
        const canvas = createTextCanvas(text, 32);
        agent.userData.textSprite.material.map.dispose();
        agent.userData.textSprite.material.map = new THREE.CanvasTexture(canvas);
        agent.userData.textSprite.material.map.needsUpdate = true;

        const aspect = canvas.width / canvas.height;
        const scale = 2.5;
        agent.userData.textSprite.scale.set(scale * aspect, scale, 1);
        agent.userData.textCanvas = canvas;
    }
}
