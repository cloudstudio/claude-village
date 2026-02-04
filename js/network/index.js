/**
 * Network module index - MCP connection and commands
 */

export { connectToMCP, setCommandHandler, sendMCPMessage, isConnected, disconnect } from './MCPClient.js';
export { handleMCPCommand, initMCPCommands } from './MCPCommands.js';
