#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { WebSocketServer, WebSocket } from "ws";

// WebSocket server for frontend communication
const WS_PORT = 8765;
let wsClients = new Set();
let wss = null;
let wsClient = null;  // Client connection to existing server

// Field types
const FieldTypes = {
  ORCHARD: 'orchard',
  RICE: 'rice',
  WHEAT: 'wheat',
  VEGETABLE: 'vegetable',
  VINEYARD: 'vineyard',
};

// Category to field type mapping for Kanban integration
const CategoryToFieldType = {
  task: FieldTypes.VEGETABLE,
  agent: FieldTypes.ORCHARD,
  skill: FieldTypes.VINEYARD,
  planner: FieldTypes.WHEAT,
  worker: FieldTypes.RICE,
  reviewer: FieldTypes.VEGETABLE,
};

// Village state
const state = {
  houses: [],
  agents: [],
  fields: [],
  nextHouseId: 1,
  nextAgentId: 1,
  nextFieldId: 1,
  // Kanban state
  kanban: {
    board: null,
    tasks: [],
  },
};

// Connect as client to existing WebSocket server
// Returns a promise that resolves when connected
function connectAsClient() {
  return new Promise((resolve) => {
    console.error(`[WS] Connecting as client to ws://localhost:${WS_PORT}...`);

    wsClient = new WebSocket(`ws://localhost:${WS_PORT}`);

    wsClient.on("open", () => {
      console.error(`[WS] Connected as client to existing server`);
      resolve(true);
    });

    wsClient.on("error", (err) => {
      console.error(`[WS] Client connection error: ${err.message}`);
      wsClient = null;
      resolve(false);
    });

    wsClient.on("close", () => {
      console.error(`[WS] Client connection closed`);
      wsClient = null;
    });

    // Timeout after 2 seconds
    setTimeout(() => {
      if (wsClient && wsClient.readyState !== WebSocket.OPEN) {
        console.error(`[WS] Connection timeout`);
        resolve(false);
      }
    }, 2000);
  });
}

// Start WebSocket server (or connect as client if server exists)
async function startWebSocketServer() {
  return new Promise((resolve) => {
    // Try to start as server
    wss = new WebSocketServer({ port: WS_PORT });

    wss.on("error", async (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[WS] Port ${WS_PORT} in use. Connecting as client instead...`);
        wss = null;
        const connected = await connectAsClient();
        resolve(connected);
      } else {
        console.error(`[WS] Server error: ${err.message}`);
        resolve(false);
      }
    });

    wss.on("listening", () => {
      console.error(`[WS] WebSocket server running on ws://localhost:${WS_PORT}`);
      setupServerHandlers();
      resolve(true);
    });
  });
}

// Setup WebSocket server event handlers (separated for clarity)
function setupServerHandlers() {

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
        // Handle relay messages from other MCP instances
        else if (msg.type === "relay") {
          const { type: relayType, payload: relayPayload } = msg.payload;
          // Broadcast to all OTHER clients (not back to sender)
          const relayMsg = JSON.stringify({ type: relayType, payload: relayPayload });
          for (const client of wsClients) {
            if (client !== ws && client.readyState === 1) {
              client.send(relayMsg);
            }
          }
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
}

// Broadcast to all connected frontends (or via client connection)
function broadcast(type, payload) {
  const message = JSON.stringify({ type, payload });
  console.error(`[BROADCAST] ${type} - wsClient: ${wsClient ? 'yes' : 'no'}, wsClients: ${wsClients.size}`);

  // If we're connected as a client, send through that connection
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    console.error(`[BROADCAST] Sending as relay to server`);
    wsClient.send(JSON.stringify({
      type: "relay",  // Tell the server to broadcast this
      payload: { type, payload }
    }));
    return;
  }

  // Otherwise broadcast to our connected clients
  console.error(`[BROADCAST] Sending to ${wsClients.size} clients directly`);
  for (const client of wsClients) {
    if (client.readyState === 1) {
      // OPEN
      client.send(message);
    }
  }
}

// Handle commands from WebSocket clients (for testing without MCP)
// SIMPLIFIED: Only village_* commands supported
function handleCommand(action, payload = {}) {
  console.error(`[CMD] ${action}`, payload);

  switch (action) {
    case "village_create_board": {
      state.kanban = {
        board: { title: payload.title, createdAt: new Date().toISOString() },
        tasks: [],
      };
      if (payload.tasks && payload.tasks.length > 0) {
        for (const taskName of payload.tasks) {
          createKanbanTask(taskName, 'task');
        }
      }
      console.error(`[VILLAGE] Created board "${payload.title}" with ${payload.tasks?.length || 0} tasks`);
      break;
    }
    case "village_add_task": {
      if (!state.kanban.board) {
        state.kanban.board = { title: "Default", createdAt: new Date().toISOString() };
      }
      createKanbanTask(payload.task, payload.category || 'task', payload.parentTasks || []);
      break;
    }
    case "village_start_task": {
      const task = findTaskByName(payload.task);
      if (task) {
        startKanbanTask(task);
      } else {
        console.error(`[VILLAGE] Task not found: ${payload.task}`);
      }
      break;
    }
    case "village_complete_task": {
      const task = findTaskByName(payload.task);
      if (task) {
        completeKanbanTask(task, payload.summary);
      } else {
        console.error(`[VILLAGE] Task not found: ${payload.task}`);
      }
      break;
    }
    case "village_get_status": {
      console.error(`[VILLAGE] Status: ${state.kanban.tasks.length} tasks`);
      break;
    }
    case "village_clear_board": {
      state.kanban = { board: null, tasks: [] };
      broadcast("village_clear_board", {});
      console.error(`[VILLAGE] Board cleared`);
      break;
    }
    default: {
      console.error(`[CMD] Unknown command: ${action}`);
      break;
    }
  }
}

// ==================== VILLAGE HELPER FUNCTIONS ====================

function findTaskByName(taskName) {
  const lowerName = taskName.toLowerCase();
  return state.kanban.tasks.find(t =>
    t.name.toLowerCase().includes(lowerName) ||
    lowerName.includes(t.name.toLowerCase())
  );
}

function getFieldTypeForCategory(category) {
  // If category maps to a field type, use it; otherwise pick random
  if (CategoryToFieldType[category]) {
    return CategoryToFieldType[category];
  }
  // Random field type
  const types = Object.values(FieldTypes);
  return types[Math.floor(Math.random() * types.length)];
}

function createKanbanTask(taskName, category = 'task', parentTasks = []) {
  // 1. Create HOUSE for the agent
  const houseId = state.nextHouseId++;
  state.houses.push({ id: houseId, agents: [] });
  broadcast("create_house", { id: houseId });

  // 2. Create FIELD based on category
  const fieldType = getFieldTypeForCategory(category);
  const fieldId = state.nextFieldId++;
  const field = {
    id: fieldId,
    type: fieldType,
    progress: 0,
    assignedAgent: null,
    currentTask: taskName,
  };
  state.fields.push(field);
  broadcast("create_field", { id: fieldId, type: fieldType });

  // 3. Create AGENT for the task
  const agentId = state.nextAgentId++;
  const agentName = taskName.substring(0, 15);
  const agent = {
    id: agentId,
    name: agentName,
    houseId,  // Assign to the house
    state: "idle",
    assignedField: fieldId,
    currentTask: taskName,
  };
  state.agents.push(agent);
  broadcast("create_agent", { id: agentId, name: agentName, houseId });

  // 4. Assign agent to field
  field.assignedAgent = agentId;
  broadcast("start_task", {
    agentId,
    taskName,
    fieldId,
  });

  // 5. Show floating text
  broadcast("show_agent_text", {
    agentId,
    text: taskName,
  });

  // Create kanban task record
  const task = {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: taskName,
    category,
    status: 'pending',
    agentId,
    fieldId,
    houseId,  // Store house reference
    parentTasks,
    summary: null,
    createdAt: new Date().toISOString(),
  };
  state.kanban.tasks.push(task);

  console.error(`[VILLAGE] Created task "${taskName}" with house #${houseId}, agent #${agentId}, and ${fieldType} field #${fieldId}`);
  return task;
}

function startKanbanTask(task) {
  const agent = state.agents.find(a => a.id === task.agentId);
  if (agent) {
    agent.state = "working";
    task.status = 'in_progress';
    broadcast("set_agent_state", { agentId: task.agentId, state: "working" });
    console.error(`[VILLAGE] Started task "${task.name}"`);
  }
}

function completeKanbanTask(task, summary) {
  task.status = 'completed';
  task.summary = summary;

  // 1. Field to 100% - this triggers HARVESTING mode in frontend
  const field = state.fields.find(f => f.id === task.fieldId);
  if (field) {
    field.progress = 100;
    broadcast("set_field_progress", { fieldId: task.fieldId, progress: 100, agentId: task.agentId });
  }

  // 2. Create sign with summary in front of field
  if (summary) {
    broadcast("create_field_sign", { fieldId: task.fieldId, summary: summary });
  }

  // 3. Update internal state (agent is now harvesting, handled by frontend)
  const agent = state.agents.find(a => a.id === task.agentId);
  if (agent) {
    agent.state = "harvesting";
  }

  // 4. Hide floating text after delay
  setTimeout(() => {
    broadcast("hide_agent_text", { agentId: task.agentId });
  }, 2000);

  console.error(`[VILLAGE] Completed task "${task.name}": ${summary || 'Done'}`);
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

// Define available tools - SIMPLIFIED: Only 6 village tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "village_create_board",
        description:
          "Create a new Village board with optional initial tasks. Each task creates a field + agent with floating text showing the task name.",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Title of the board (e.g., 'Sprint 1', 'Feature X')",
            },
            tasks: {
              type: "array",
              items: { type: "string" },
              description: "Optional list of initial task names to create",
            },
          },
          required: ["title"],
        },
      },
      {
        name: "village_add_task",
        description:
          "Add a new task to the Village board. Creates a field + agent with floating text. Category determines field type: task=vegetable, agent=orchard, skill=vineyard, planner=wheat, worker=rice, reviewer=vegetable.",
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "Task name/description",
            },
            category: {
              type: "string",
              enum: ["task", "agent", "skill", "planner", "worker", "reviewer"],
              description: "Task category (determines field type). Default: task",
            },
            parentTasks: {
              type: "array",
              items: { type: "string" },
              description: "Optional parent task names for workflow visualization",
            },
            summary: {
              type: "string",
              description: "Brief summary of what this task will do",
            },
          },
          required: ["task"],
        },
      },
      {
        name: "village_start_task",
        description:
          "Start working on a task. Agent begins work animation in its field.",
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "Task name (partial match supported)",
            },
          },
          required: ["task"],
        },
      },
      {
        name: "village_complete_task",
        description:
          "Mark a task as completed. Field goes to 100%, agent celebrates with ✓, then walks back home. Floating text disappears.",
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "Task name (partial match supported)",
            },
            summary: {
              type: "string",
              description: "Summary of what was accomplished",
            },
          },
          required: ["task"],
        },
      },
      {
        name: "village_get_status",
        description:
          "Get current Village board status including all tasks and their states.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "village_clear_board",
        description:
          "Clear/archive the current board to start fresh.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls - SIMPLIFIED: Only village_* handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "village_create_board": {
      // Clear existing board
      state.kanban = {
        board: {
          title: args.title,
          createdAt: new Date().toISOString(),
        },
        tasks: [],
      };

      const createdTasks = [];

      // Create initial tasks if provided
      if (args.tasks && args.tasks.length > 0) {
        for (const taskName of args.tasks) {
          const task = createKanbanTask(taskName, 'task');
          createdTasks.push(task.name);
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `Created Village board "${args.title}"${createdTasks.length > 0 ? ` with ${createdTasks.length} tasks: ${createdTasks.join(', ')}` : ''}`,
          },
        ],
      };
    }

    case "village_add_task": {
      if (!state.kanban.board) {
        state.kanban.board = {
          title: "Default Board",
          createdAt: new Date().toISOString(),
        };
      }

      const category = args.category || 'task';
      const parentTasks = args.parentTasks || [];
      const task = createKanbanTask(args.task, category, parentTasks);

      return {
        content: [
          {
            type: "text",
            text: `Added task "${args.task}" (${category}) with agent #${task.agentId} working in ${getFieldTypeForCategory(category)} field #${task.fieldId}`,
          },
        ],
      };
    }

    case "village_start_task": {
      const task = findTaskByName(args.task);
      if (!task) {
        return {
          content: [{ type: "text", text: `Task "${args.task}" not found` }],
          isError: true,
        };
      }

      startKanbanTask(task);

      return {
        content: [
          {
            type: "text",
            text: `Started task "${task.name}" - agent #${task.agentId} is now working`,
          },
        ],
      };
    }

    case "village_complete_task": {
      const task = findTaskByName(args.task);
      if (!task) {
        return {
          content: [{ type: "text", text: `Task "${args.task}" not found` }],
          isError: true,
        };
      }

      completeKanbanTask(task, args.summary);

      return {
        content: [
          {
            type: "text",
            text: `Completed task "${task.name}"${args.summary ? `: ${args.summary}` : ''}. Agent celebrating and returning home.`,
          },
        ],
      };
    }

    case "village_get_status": {
      const board = state.kanban.board;
      const tasks = state.kanban.tasks;

      if (!board) {
        return {
          content: [{ type: "text", text: "No Village board active. Use village_create_board to start." }],
        };
      }

      const pending = tasks.filter(t => t.status === 'pending').length;
      const inProgress = tasks.filter(t => t.status === 'in_progress').length;
      const completed = tasks.filter(t => t.status === 'completed').length;

      const taskList = tasks.map(t =>
        `- [${t.status}] ${t.name} (agent #${t.agentId}, field #${t.fieldId})${t.summary ? ` - ${t.summary}` : ''}`
      ).join('\n');

      return {
        content: [
          {
            type: "text",
            text: `Board: ${board.title}\nPending: ${pending} | In Progress: ${inProgress} | Completed: ${completed}\n\nTasks:\n${taskList || '(no tasks)'}`,
          },
        ],
      };
    }

    case "village_clear_board": {
      const oldBoard = state.kanban.board;
      state.kanban = {
        board: null,
        tasks: [],
      };

      return {
        content: [
          {
            type: "text",
            text: oldBoard ? `Cleared board "${oldBoard.title}"` : "No board to clear",
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
  if (standaloneMode) {
    // Standalone mode: WebSocket server only (for frontend)
    await startWebSocketServer();
    console.error("[Server] Running in standalone mode (WebSocket only)");
    console.error("[Server] Press Ctrl+C to stop");
    // Keep process alive
    process.stdin.resume();
  } else {
    // MCP mode: Try to start WebSocket, but don't fail if port is in use
    // This allows Claude Code to connect even when standalone is running
    // IMPORTANT: Wait for WebSocket connection before starting MCP
    await startWebSocketServer();
    console.error("[WS] WebSocket ready, starting MCP server...");

    // Start MCP server on stdio (for Claude Code integration)
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[MCP] Agent Village MCP server running");
  }
}

main().catch(console.error);
