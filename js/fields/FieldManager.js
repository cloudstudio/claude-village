/**
 * FieldManager - Field positioning and agent assignment
 */

import { FIELD_GRID } from '../config/index.js';
import { state } from '../core/State.js';

// Track next field index for grid placement
let nextFieldIndex = 0;

/**
 * Check if a row is blocked for field placement
 * @param {number} row - Row index
 * @returns {boolean} True if blocked
 */
function isRowBlocked(row) {
    return FIELD_GRID.blockedRows && FIELD_GRID.blockedRows.includes(row);
}

/**
 * Convert logical index to grid position, skipping blocked rows
 * Returns CENTER of the cell (not corner)
 * @param {number} logicalIndex - Logical field index
 * @returns {Object} Position with x, z, row, col
 */
function getFieldPositionByIndex(logicalIndex) {
    const cellSize = FIELD_GRID.fieldSize + FIELD_GRID.gap;
    const cols = FIELD_GRID.columns;

    // Count through valid cells until we reach logicalIndex
    let validCount = 0;
    let gridRow = 0;
    let gridCol = 0;

    for (let i = 0; i < 1000; i++) {  // Safety limit
        gridRow = Math.floor(i / cols);
        gridCol = i % cols;

        // Skip blocked rows entirely
        if (isRowBlocked(gridRow)) {
            // Jump to start of next row
            i = (gridRow + 1) * cols - 1;  // -1 because loop will add 1
            continue;
        }

        if (validCount === logicalIndex) {
            break;
        }
        validCount++;
    }

    // Return CENTER of cell, not corner
    // Cell corner + half of cell size = center
    return {
        x: FIELD_GRID.startX + gridCol * cellSize + FIELD_GRID.fieldSize / 2,
        z: FIELD_GRID.startZ + gridRow * cellSize + FIELD_GRID.fieldSize / 2,
        row: gridRow,
        col: gridCol
    };
}

/**
 * Get next field position (skipping blocked rows)
 * @returns {Object} Position with x, z, row, col
 */
export function getNextFieldPosition() {
    const pos = getFieldPositionByIndex(nextFieldIndex);
    nextFieldIndex++;
    return pos;
}

/**
 * Reset field placement (for testing)
 */
export function resetFieldPlacement() {
    nextFieldIndex = 0;
}

/**
 * Generate work positions within a field for agent movement
 * @param {number} fieldX - Field center X
 * @param {number} fieldZ - Field center Z
 * @param {number} width - Field width
 * @param {number} depth - Field depth
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @returns {Array} Array of work positions
 */
export function generateWorkPositions(fieldX, fieldZ, width, depth, rows, cols) {
    const positions = [];
    const spacingX = width / (cols + 1);
    const spacingZ = depth / (rows + 1);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            positions.push({
                x: fieldX - width / 2 + spacingX * (col + 1),
                z: fieldZ - depth / 2 + spacingZ * (row + 1),
                row,
                col
            });
        }
    }

    return positions;
}

/**
 * Get a random work position within a field
 * @param {THREE.Group} field - The field group
 * @returns {Object} Position with x, z
 */
export function getFieldWorkPosition(field) {
    const positions = field.userData.workPositions;
    if (!positions || positions.length === 0) {
        return { x: field.userData.x, z: field.userData.z };
    }
    return positions[Math.floor(Math.random() * positions.length)];
}

/**
 * Assign an agent to work on a field
 * @param {THREE.Group} agent - The agent
 * @param {THREE.Group} field - The field
 * @param {string} taskName - Name of the task
 * @returns {Object} Work position
 */
export function assignAgentToField(agent, field, taskName) {
    agent.userData.assignedField = field;
    agent.userData.currentTask = taskName;
    field.userData.assignedAgent = agent;
    field.userData.currentTask = taskName;

    // Set initial target to a work position in the field
    const workPos = getFieldWorkPosition(field);
    agent.userData.targetX = workPos.x;
    agent.userData.targetZ = workPos.z;

    return workPos;
}

/**
 * Release agent from field work
 * @param {THREE.Group} agent - The agent
 */
export function releaseAgentFromField(agent) {
    if (agent.userData.assignedField) {
        const field = agent.userData.assignedField;
        field.userData.assignedAgent = null;
        field.userData.currentTask = null;
    }
    agent.userData.assignedField = null;
}

/**
 * Remove trees that overlap with a field area
 * @param {THREE.Scene} scene - The scene
 * @param {number} x - Field center X
 * @param {number} z - Field center Z
 * @param {number} width - Field width
 * @param {number} depth - Field depth
 * @returns {number} Number of trees removed
 */
export function removeTreesInArea(scene, x, z, width, depth) {
    const halfW = width / 2 + 2;  // Add padding
    const halfD = depth / 2 + 2;

    const treesToRemove = [];
    const trees = state.trees;

    for (let i = trees.length - 1; i >= 0; i--) {
        const tree = trees[i];
        const tx = tree.position.x;
        const tz = tree.position.z;

        // Check if tree is within field bounds
        if (tx > x - halfW && tx < x + halfW && tz > z - halfD && tz < z + halfD) {
            treesToRemove.push(i);
        }
    }

    // Remove trees from scene and array
    for (const idx of treesToRemove) {
        const tree = trees[idx];
        scene.remove(tree);
        state.removeTree(tree);
    }

    if (treesToRemove.length > 0) {
        console.log(`Removed ${treesToRemove.length} trees for field placement`);
    }

    return treesToRemove.length;
}
