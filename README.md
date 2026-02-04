# Agent Village

A 3D visualization tool that brings your AI agent workflows to life. Watch your Claude agents work in a beautiful isometric farm village, where each task becomes a field to cultivate and each completion triggers a harvest celebration.

![Agent Village Demo](https://img.shields.io/badge/status-beta-yellow) ![License](https://img.shields.io/badge/license-MIT-blue)

<!-- Video demo: Upload demo.mp4 from assets/ folder to GitHub release or drag into README editor -->

## What is Agent Village?

Agent Village is a **Model Context Protocol (MCP) server** that provides a real-time 3D visualization of AI agent tasks. When connected to Claude Code (or any MCP-compatible client), you can:

- **Create visual task boards** - Each task spawns a house, field, and agent
- **Watch agents work** - Agents animate while tasks are in progress
- **See completions** - Fields mature, agents harvest, and signs display summaries
- **Track progress** - Different field types represent different task categories

## Features

- **6 Simple MCP Tools** - Streamlined API for task management
- **5 Field Types** - Wheat, Rice, Vineyard, Orchard, Vegetable (based on task category)
- **Real-time WebSocket** - Instant updates between MCP and frontend
- **Hover Tooltips** - See task summaries by hovering over completion signs
- **Harvesting Animation** - Completed tasks trigger continuous harvest loops
- **Minimal UI** - Collapsible panel with stats and controls

## Installation

### Prerequisites

- Node.js 18+
- A modern browser (Chrome, Firefox, Safari)
- Claude Code or another MCP-compatible client

### Setup

```bash
# Clone the repository
git clone https://github.com/cloudstudio/claude-village.git
cd claude-village

# Install server dependencies
cd server
npm install
cd ..
```

## Quick Start

### 1. Start the Frontend Server

```bash
# From the project root
npx http-server -p 3000
```

Open http://localhost:3000 in your browser.

### 2. Configure MCP in Claude Code

Add this to your project's `.mcp.json` file:

```json
{
  "mcpServers": {
    "village": {
      "command": "node",
      "args": ["/path/to/agent-village/server/mcp.js"],
      "cwd": "/path/to/agent-village/server"
    }
  }
}
```

Then restart Claude Code or run `/mcp` to reload the MCP servers.

### 3. Start Using!

In Claude Code, you can now use the village tools:

```
Create a board called "My Sprint" with tasks "Design API" and "Write tests"
```

## MCP Tools Reference

### `village_create_board`
Creates a new task board, optionally with initial tasks.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Board title (e.g., "Sprint 1") |
| `tasks` | string[] | No | Initial task names to create |

**Example:**
```javascript
village_create_board({
  title: "Authentication Feature",
  tasks: ["Design flow", "Implement JWT", "Write tests"]
})
```

---

### `village_add_task`
Adds a task to the board. Automatically creates a house, field (random type), and agent.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task` | string | Yes | Task name/description |
| `summary` | string | No | Brief description |

**Field Types** (randomly assigned):
- Vegetable (green garden beds)
- Rice (flooded paddies)
- Wheat (golden fields)
- Vineyard (purple grape vines)
- Orchard (fruit trees)

**Example:**
```javascript
village_add_task({
  task: "Implement OAuth2"
})
```

---

### `village_start_task`
Marks a task as in-progress. Agent begins working animation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task` | string | Yes | Task name (partial match supported) |

**Example:**
```javascript
village_start_task({ task: "OAuth" })  // Matches "Implement OAuth2"
```

---

### `village_complete_task`
Completes a task. Field matures to 100%, agent starts harvesting, and a sign appears with the summary.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task` | string | Yes | Task name (partial match supported) |
| `summary` | string | No | Completion summary (shown on sign) |

**Example:**
```javascript
village_complete_task({
  task: "OAuth",
  summary: "Google + GitHub SSO working, 15 tests passing"
})
```

---

### `village_get_status`
Returns the current board status with all tasks.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | | | |

**Returns:**
```
Board: Authentication Feature
Pending: 2 | In Progress: 1 | Completed: 5

Tasks:
- [completed] Design flow (agent #1, field #1) - Created 3 diagrams
- [in_progress] Implement JWT (agent #2, field #2)
- [pending] Write tests (agent #3, field #3)
```

---

### `village_clear_board`
Clears the current board to start fresh.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | | | |

---

## Architecture

```
agent-village/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # UI styles
├── js/
│   ├── main.js             # Entry point and animation loop
│   ├── core/               # Core engine modules
│   │   ├── State.js        # Centralized state management
│   │   ├── Scene.js        # Three.js scene setup
│   │   ├── GameLoop.js     # Animation orchestration
│   │   └── Engine.js       # Public API functions
│   ├── config/             # Configuration
│   │   ├── constants.js    # Global constants
│   │   ├── fieldTypes.js   # Field type definitions
│   │   └── agentConfig.js  # Agent colors and states
│   ├── systems/            # Update systems
│   │   ├── AgentSystem.js  # Agent behavior and harvesting
│   │   ├── AnimalSystem.js # Animal movement
│   │   ├── InsectSystem.js # Flying creatures
│   │   ├── WaterSystem.js  # Pond waves
│   │   └── FileSystem.js   # Floating files
│   ├── buildings/          # Structure creation
│   │   ├── House.js        # House generation
│   │   ├── Headquarters.js # HQ building
│   │   ├── Fence.js        # Farm fencing
│   │   └── Pond.js         # Water features
│   ├── fields/             # Field system
│   │   ├── Field.js        # Main field creation
│   │   ├── FieldManager.js # Positioning and assignment
│   │   └── plants/         # Plant geometries by type
│   ├── entities/           # Agents and objects
│   │   ├── Agent.js        # Agent creation
│   │   ├── ParticleSystem.js # Particle effects
│   │   └── FloatingText.js # Text sprites
│   ├── animals/            # Animal creation
│   │   ├── farm/           # Chickens, sheep, pigs
│   │   ├── wild/           # Foxes, rabbits, deer, etc.
│   │   └── flying/         # Butterflies, bees, birds
│   ├── network/            # MCP communication
│   │   ├── MCPClient.js    # WebSocket connection
│   │   └── MCPCommands.js  # Command handlers
│   ├── ui/                 # User interface
│   │   ├── StatsPanel.js   # Statistics display
│   │   └── Tooltip.js      # Hover tooltips
│   ├── utils/              # Shared utilities
│   │   ├── math.js         # Math helpers
│   │   ├── collision.js    # Collision detection
│   │   └── grid.js         # Grid positioning
│   └── world/              # World generation
│       ├── Ground.js       # Terrain creation
│       └── Positions.js    # Position management
├── server/
│   ├── mcp.js              # MCP server + WebSocket
│   └── package.json        # Server dependencies
└── .mcp.json               # MCP configuration
```

**80+ modular files** organized by domain for easy maintenance and contribution.

### Communication Flow

```
Claude Code  ──MCP (stdio)──▶  mcp.js  ──WebSocket──▶  Browser
                                │
                                ▼
                         State Management
                         (houses, agents,
                          fields, tasks)
```

## Controls

| Key/Action | Description |
|------------|-------------|
| `W/A/S/D` | Move camera |
| `Q/E` | Adjust height |
| `Mouse drag` | Rotate view |
| `Scroll` | Zoom in/out |
| `×` button | Hide UI panel |
| `☰` button | Show UI panel |

## Development

### Standalone Mode (Testing without Claude)

Run the WebSocket server independently:

```bash
cd server
node mcp.js --standalone
```

Then use the UI buttons to add fields, houses, and test manually.

### Debug Logging

Open browser console (F12) to see:
- MCP commands received
- Agent state changes
- Field progress updates

## Troubleshooting

### "MCP not connected"
1. Check `.mcp.json` path is correct
2. Run `/mcp` in Claude Code to reload
3. Ensure Node.js 18+ is installed

### Agents not moving after task completion
1. Refresh the browser
2. Check console for errors
3. Ensure WebSocket is connected (green dot in UI)

### Port already in use
```bash
# Kill existing processes
pkill -f "node.*mcp.js"
```

## License

MIT License - feel free to use, modify, and distribute.

## Contributing

Contributions welcome! Please open an issue first to discuss major changes.

## Credits

- Built with [Three.js](https://threejs.org/)
- MCP SDK by [Anthropic](https://github.com/anthropics/anthropic-sdk)
- Inspired by cozy farm simulation games
