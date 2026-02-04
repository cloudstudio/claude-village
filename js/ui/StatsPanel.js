/**
 * StatsPanel - UI statistics panel
 */

import { state } from '../core/State.js';

/**
 * Update the stats panel in the DOM
 */
export function updateStats() {
    const stats = state.getStats();

    const el = (id) => document.getElementById(id);

    const housesEl = el('houses');
    const agentsEl = el('agents');
    const treesEl = el('trees');
    const floraEl = el('flora');
    const fieldsEl = el('fields');
    const animalsEl = el('animals');

    if (housesEl) housesEl.textContent = stats.houses;
    if (agentsEl) agentsEl.textContent = stats.agents;
    if (treesEl) treesEl.textContent = stats.trees;
    if (floraEl) floraEl.textContent = stats.flora;
    if (fieldsEl) fieldsEl.textContent = stats.fields;
    if (animalsEl) animalsEl.textContent = stats.animals;
}

/**
 * Update the agents panel showing individual agent info
 */
export function updateAgentsPanel() {
    const agents = state.agents;
    const panel = document.getElementById('agentCards');
    if (!panel) return;

    // Clear existing cards
    panel.innerHTML = '';

    agents.forEach(agent => {
        const d = agent.userData;
        const card = document.createElement('div');
        card.className = 'agent-card';
        card.style.borderLeftColor = `#${d.color.toString(16).padStart(6, '0')}`;

        const stateClass = d.state === 'working' ? 'working' :
                          d.state === 'thinking' ? 'thinking' :
                          d.state === 'success' ? 'success' :
                          d.state === 'error' ? 'error' :
                          d.state === 'harvesting' ? 'harvesting' : '';

        card.innerHTML = `
            <div class="agent-name">${d.name || `Agent ${d.id}`}</div>
            <div class="agent-state ${stateClass}">${d.state}</div>
            ${d.currentTask ? `<div class="agent-task">${d.currentTask}</div>` : ''}
            ${d.assignedField ? `<div class="agent-field">Field #${d.assignedField.userData.id}</div>` : ''}
        `;

        panel.appendChild(card);
    });
}
