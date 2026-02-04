#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { WebSocketServer } from "ws";

// WebSocket server for frontend communication
const WS_PORT = 8765;
let wsClients = new Set();
let wss = null;

// Village state
const state = {
  houses: [],
  agents: [],
  nextHouseId: 1,
  nextAgentId: 1,
};

// Start WebSocket server
function startWebSocketServer() {
  wss = new WebSocketServer({ port: WS_PORT });

  wss.on("connection", (ws) => {
    console.error(`[WS] Client connected. Total: ${wsClients.size + 1}`);
    wsClients.add(ws);

    // Send current state to new client
    ws.send(
      JSON.stringify({
        type: "sync",
        payload: state,
      })
    );

    ws.on("close", () => {
      wsClients.delete(ws);
      console.error(`[WS] Client disconnected. Total: ${wsClients.size}`);
    });

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        console.error("[WS] Received:", msg.type);

        // Handle commands from any client (for testing)
        if (msg.type === "command") {
          const { action, payload } = msg;
          handleCommand(action, payload);
        }
        // Handle state updates from frontend
        else if (msg.type === "state_update") {
          Object.assign(state, msg.payload);
        }
      } catch (e) {
        console.error("[WS] Parse error:", e);
      }
    });
  });

  console.error(`[WS] WebSocket server running on ws://localhost:${WS_PORT}`);
}

// Broadcast to all connected frontends
function broadcast(type, payload) {
  const message = JSON.stringify({ type, payload });
  for (const client of wsClients) {
    if (client.readyState === 1) {
      // OPEN
      client.send(message);
    }
  }
}

// Handle commands from WebSocket clients (for testing without MCP)
function handleCommand(action, payload = {}) {
  console.error(`[CMD] ${action}`, payload);

  switch (action) {
    case "create_house": {
      const houseId = state.nextHouseId++;
      state.houses.push({ id: houseId, agents: [] });
      broadcast("create_house", { id: houseId, ...payload });
      console.error(`[CMD] Created house #${houseId}`);
      break;
    }
    case "create_agent": {
      const agentId = state.nextAgentId++;
      const name = payload.name || `Agent-${agentId}`;
      state.agents.push({ id: agentId, name, state: "idle" });
      broadcast("create_agent", { id: agentId, name, ...payload });
      console.error(`[CMD] Created agent "${name}" #${agentId}`);
      break;
    }
    case "set_agent_state": {
      const agent = state.agents.find((a) => a.id === payload.agentId);
      if (agent) {
        agent.state = payload.state;
        broadcast("set_agent_state", payload);
        console.error(`[CMD] Agent #${payload.agentId} -> ${payload.state}`);
      }
      break;
    }
    case "create_file": {
      broadcast("create_file", payload);
      console.error(`[CMD] Created file "${payload.fileName}"`);
      break;
    }
    case "move_camera": {
      broadcast("move_camera", payload);
      console.error(`[CMD] Camera moved`);
      break;
    }
  }
}

// Create MCP server
const server = new Server(
  {
    name: "agent-village-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_house",
        description:
          "Create a new house in the Agent Village. Houses are work areas where agents can operate.",
        inputSchema: {
          type: "object",
          properties: {
            x: {
              type: "number",
              description:
                "Optional X position. If not provided, auto-positioned.",
            },
            z: {
              type: "number",
              description:
                "Optional Z position. If not provided, auto-positioned.",
            },
          },
        },
      },
      {
        name: "create_agent",
        description:
          "Create a new agent in the Agent Village. Agents are visual representations of Claude working on tasks.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name for the agent (e.g., 'Claude', 'Agent-1')",
            },
            houseId: {
              type: "number",
              description:
                "Optional house ID to assign the agent to. If not provided, assigns to HQ.",
            },
          },
        },
      },
      {
        name: "set_agent_state",
        description:
          "Change an agent's visual state. States: 'idle', 'thinking', 'working', 'success', 'error'",
        inputSchema: {
          type: "object",
          properties: {
            agentId: {
              type: "number",
              description: "ID of the agent to update",
            },
            state: {
              type: "string",
              enum: ["idle", "thinking", "working", "success", "error"],
              description: "New state for the agent",
            },
            taskName: {
              type: "string",
              description:
                "Optional task name to display (for thinking/working states)",
            },
          },
          required: ["agentId", "state"],
        },
      },
      {
        name: "create_file",
        description:
          "Create a visual file block near an agent's house. Represents code or files being created.",
        inputSchema: {
          type: "object",
          properties: {
            fileName: {
              type: "string",
              description: "Name of the file (e.g., 'app.js', 'styles.css')",
            },
            agentId: {
              type: "number",
              description: "ID of the agent creating the file",
            },
          },
          required: ["fileName"],
        },
      },
      {
        name: "get_village_state",
        description:
          "Get the current state of the Agent Village including all houses and agents.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "move_camera",
        description:
          "Move the camera/drone to focus on a specific location or agent.",
        inputSchema: {
          type: "object",
          properties: {
            x: {
              type: "number",
              description: "X coordinate to move to",
            },
            z: {
              type: "number",
              description: "Z coordinate to move to",
            },
            agentId: {
              type: "number",
              description: "Or specify an agent ID to focus on",
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "create_house": {
      const houseId = state.nextHouseId++;
      const house = {
        id: houseId,
        x: args?.x,
        z: args?.z,
        agents: [],
      };
      state.houses.push(house);

      broadcast("create_house", { id: houseId, x: args?.x, z: args?.z });

      return {
        content: [
          {
            type: "text",
            text: `Created house #${houseId}${args?.x !== undefined ? ` at position (${args.x}, ${args.z})` : " at auto-generated position"}`,
          },
        ],
      };
    }

    case "create_agent": {
      const agentId = state.nextAgentId++;
      const agentName = args?.name || `Agent-${agentId}`;
      const agent = {
        id: agentId,
        name: agentName,
        houseId: args?.houseId || null,
        state: "idle",
      };
      state.agents.push(agent);

      broadcast("create_agent", {
        id: agentId,
        name: agentName,
        houseId: args?.houseId,
      });

      return {
        content: [
          {
            type: "text",
            text: `Created agent "${agentName}" (ID: ${agentId})${args?.houseId ? ` assigned to house #${args.houseId}` : " at headquarters"}`,
          },
        ],
      };
    }

    case "set_agent_state": {
      const agent = state.agents.find((a) => a.id === args.agentId);
      if (!agent) {
        return {
          content: [
            { type: "text", text: `Agent #${args.agentId} not found` },
          ],
          isError: true,
        };
      }

      agent.state = args.state;

      broadcast("set_agent_state", {
        agentId: args.agentId,
        state: args.state,
        taskName: args.taskName,
      });

      return {
        content: [
          {
            type: "text",
            text: `Agent "${agent.name}" state changed to ${args.state}${args.taskName ? ` (task: ${args.taskName})` : ""}`,
          },
        ],
      };
    }

    case "create_file": {
      broadcast("create_file", {
        fileName: args.fileName,
        agentId: args.agentId,
      });

      return {
        content: [
          {
            type: "text",
            text: `Created file "${args.fileName}"${args.agentId ? ` by agent #${args.agentId}` : ""}`,
          },
        ],
      };
    }

    case "get_village_state": {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(state, null, 2),
          },
        ],
      };
    }

    case "move_camera": {
      broadcast("move_camera", {
        x: args?.x,
        z: args?.z,
        agentId: args?.agentId,
      });

      return {
        content: [
          {
            type: "text",
            text: args?.agentId
              ? `Camera focusing on agent #${args.agentId}`
              : `Camera moving to (${args?.x || 0}, ${args?.z || 0})`,
          },
        ],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
});

// Check for standalone mode (WebSocket only, no MCP stdio)
const standaloneMode = process.argv.includes("--standalone");

// Start servers
async function main() {
  // Start WebSocket server for frontend
  startWebSocketServer();

  if (standaloneMode) {
    console.error("[Server] Running in standalone mode (WebSocket only)");
    console.error("[Server] Press Ctrl+C to stop");
    // Keep process alive
    process.stdin.resume();
  } else {
    // Start MCP server on stdio (for Claude Code integration)
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[MCP] Agent Village MCP server running");
  }
}

main().catch(console.error);
