/**
 * WaterSystem - Handles pond water wave animation
 */

import { state } from '../core/State.js';

/**
 * Update pond water waves
 * @param {number} dt - Delta time in seconds
 * @param {number} now - Current time in milliseconds
 */
export function updateWaterSystem(dt, now) {
    const pondWater = state.pondWater;
    const pondWaterData = state.pondWaterData;

    if (!pondWater || !pondWaterData) return;

    const posAttr = pondWater.geometry.attributes.position;
    const { basePositions, size } = pondWaterData;

    // Create gentle wave motion
    for (let i = 0; i < posAttr.count; i++) {
        const baseY = basePositions[i * 3 + 1];
        const x = basePositions[i * 3];
        const z = basePositions[i * 3 + 2];

        // Combine multiple wave frequencies for natural look
        const wave1 = Math.sin(now * 0.001 + x * 0.5) * 0.03;
        const wave2 = Math.sin(now * 0.0015 + z * 0.3) * 0.02;
        const wave3 = Math.sin(now * 0.002 + (x + z) * 0.4) * 0.015;

        posAttr.setY(i, baseY + wave1 + wave2 + wave3);
    }

    posAttr.needsUpdate = true;
}
