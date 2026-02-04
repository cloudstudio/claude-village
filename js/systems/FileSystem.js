/**
 * FileSystem - Handles floating file block animation
 */

import { state } from '../core/State.js';

/**
 * Update all file blocks (floating and rotating)
 * @param {number} dt - Delta time in seconds
 * @param {number} now - Current time in milliseconds
 */
export function updateFileSystem(dt, now) {
    const files = state.files;

    files.forEach(file => {
        file.userData.floatPhase += dt * 2;
        file.position.y = file.userData.baseY + Math.sin(file.userData.floatPhase) * 0.1;
        file.rotation.y += dt * 0.5;
    });
}
