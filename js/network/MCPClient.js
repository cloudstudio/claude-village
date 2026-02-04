/**
 * MCPClient - WebSocket connection to MCP server
 */

const MCP_WS_URL = 'ws://localhost:8765';

let mcpSocket = null;
let mcpReconnectTimer = null;
let commandHandler = null;

/**
 * Update connection status in the UI
 * @param {boolean} connected - Connection state
 */
function updateConnectionStatus(connected) {
    const connEl = document.getElementById('connection');
    if (connEl) {
        const dot = connEl.querySelector('.conn-dot');
        const text = connEl.querySelector('span');
        if (dot) {
            dot.classList.toggle('connected', connected);
        }
        if (text) {
            text.textContent = connected ? 'MCP Connected' : 'Demo Mode';
        }
    }
}

/**
 * Connect to MCP WebSocket server
 */
export function connectToMCP() {
    if (mcpSocket && mcpSocket.readyState === WebSocket.OPEN) return;

    mcpSocket = new WebSocket(MCP_WS_URL);

    mcpSocket.onopen = () => {
        console.log('Connected to MCP server');
        updateConnectionStatus(true);
    };

    mcpSocket.onclose = () => {
        console.log('Disconnected from MCP server');
        updateConnectionStatus(false);
        // Reconnect after 3 seconds
        mcpReconnectTimer = setTimeout(connectToMCP, 3000);
    };

    mcpSocket.onerror = (err) => {
        console.log('MCP connection error (server may not be running)');
    };

    mcpSocket.onmessage = (event) => {
        try {
            const { type, payload } = JSON.parse(event.data);
            if (commandHandler) {
                commandHandler(type, payload);
            }
        } catch (e) {
            console.error('Failed to parse MCP message:', e);
        }
    };
}

/**
 * Set the command handler function
 * @param {Function} handler - Function to handle MCP commands
 */
export function setCommandHandler(handler) {
    commandHandler = handler;
}

/**
 * Send a message to the MCP server
 * @param {string} type - Message type
 * @param {Object} payload - Message payload
 */
export function sendMCPMessage(type, payload) {
    if (mcpSocket && mcpSocket.readyState === WebSocket.OPEN) {
        mcpSocket.send(JSON.stringify({ type, payload }));
    }
}

/**
 * Check if connected to MCP server
 * @returns {boolean}
 */
export function isConnected() {
    return mcpSocket && mcpSocket.readyState === WebSocket.OPEN;
}

/**
 * Disconnect from MCP server
 */
export function disconnect() {
    if (mcpReconnectTimer) {
        clearTimeout(mcpReconnectTimer);
        mcpReconnectTimer = null;
    }
    if (mcpSocket) {
        mcpSocket.close();
        mcpSocket = null;
    }
}
