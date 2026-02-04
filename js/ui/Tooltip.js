/**
 * Tooltip - Hover tooltip system for signs and other elements
 */

import * as THREE from 'three';
import { state } from '../core/State.js';

let tooltip = null;
let raycaster = null;
let mouse = null;

/**
 * Initialize the tooltip system
 * @param {THREE.Camera} camera - The camera for raycasting
 */
export function initTooltip(camera) {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Create tooltip element
    tooltip = document.createElement('div');
    tooltip.id = 'sign-tooltip';
    tooltip.style.cssText = `
        position: fixed;
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.85);
        color: #fff;
        border-radius: 6px;
        font-size: 13px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
        max-width: 300px;
        z-index: 1000;
        border: 1px solid rgba(255,255,255,0.2);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(tooltip);

    // Add mouse move listener
    window.addEventListener('mousemove', (event) => handleMouseMove(event, camera));
}

/**
 * Handle mouse move for tooltip display
 * @param {MouseEvent} event - Mouse event
 * @param {THREE.Camera} camera - The camera for raycasting
 */
function handleMouseMove(event, camera) {
    if (!raycaster || !mouse || !tooltip) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const fieldSigns = state.fieldSigns;

    // Check intersections with signs
    if (fieldSigns.length > 0) {
        const intersects = raycaster.intersectObjects(fieldSigns, true);

        if (intersects.length > 0) {
            // Find the sign (parent object with userData)
            let sign = intersects[0].object;
            while (sign && !sign.userData?.isFieldSign) {
                sign = sign.parent;
            }

            if (sign && sign.userData?.summary) {
                tooltip.textContent = sign.userData.summary;
                tooltip.style.opacity = '1';
                tooltip.style.left = (event.clientX + 15) + 'px';
                tooltip.style.top = (event.clientY + 15) + 'px';
                document.body.style.cursor = 'pointer';
                return;
            }
        }
    }

    // Hide tooltip if not hovering sign
    tooltip.style.opacity = '0';
    document.body.style.cursor = 'default';
}

/**
 * Show tooltip with custom text at position
 * @param {string} text - Tooltip text
 * @param {number} x - X position
 * @param {number} y - Y position
 */
export function showTooltip(text, x, y) {
    if (!tooltip) return;
    tooltip.textContent = text;
    tooltip.style.opacity = '1';
    tooltip.style.left = (x + 15) + 'px';
    tooltip.style.top = (y + 15) + 'px';
}

/**
 * Hide the tooltip
 */
export function hideTooltip() {
    if (!tooltip) return;
    tooltip.style.opacity = '0';
}
