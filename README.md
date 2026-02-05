# Agent Village

A 3D visualization for AI agent workflows. Watch your Claude agents work in an isometric farm village.

![Agent Village Demo](https://img.shields.io/badge/status-beta-yellow) ![License](https://img.shields.io/badge/license-MIT-blue)

https://github.com/user-attachments/assets/8036e2b3-694e-4f1e-918b-da9fa6517a17

## Installation

```bash
# Clone and install
git clone https://github.com/cloudstudio/claude-village.git
cd claude-village/server
npm install
```

## Setup

### 1. Start the frontend

```bash
# From project root
npx http-server -p 3000
```

Open http://localhost:3000 in your browser.

### 2. Configure MCP in Claude Code

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "village": {
      "command": "node",
      "args": ["/path/to/claude-village/server/mcp.js"],
      "cwd": "/path/to/claude-village/server"
    }
  }
}
```

Restart Claude Code or run `/mcp` to reload.

## Usage

### Workflow

1. **Create a board**: Use `village_create_board` with title and tasks
2. **Start tasks**: Use `village_start_task` - agent begins working animation
3. **Complete tasks**: Use `village_complete_task` with summary - field matures, agent harvests

### Example

```javascript
// Create a board with tasks
village_create_board({
  title: "Auth Feature",
  tasks: ["Design flow", "Implement JWT", "Write tests"]
})

// Start working on a task
village_start_task({ task: "Design" })

// Complete with summary (shown on sign)
village_complete_task({
  task: "Design",
  summary: "Created 3 flow diagrams"
})

// Check progress
village_get_status()

// Clear and start fresh
village_clear_board()
```

### Available Tools

| Tool | Description |
|------|-------------|
| `village_create_board` | Create board with title and optional tasks array |
| `village_add_task` | Add a task (creates house, field, agent) |
| `village_start_task` | Mark task as in-progress (partial match) |
| `village_complete_task` | Complete task with summary (partial match) |
| `village_get_status` | Get current board status |
| `village_clear_board` | Clear all tasks |

## Controls

| Key | Action |
|-----|--------|
| `W/A/S/D` | Move camera |
| `Q/E` | Height |
| `Mouse drag` | Rotate |
| `Scroll` | Zoom |

## Debug Mode

Add `?debug=true` to URL to show UI panel with stats.

## Integration

Add this to your `CLAUDE.md` or `.claude/rules/village.md` to enable automatic task tracking.

**Pro tip**: Add these instructions to each agent or skill for best results - Claude will automatically track all tasks visually.

```markdown
# Agent Village Integration

When working on features or multi-step tasks, use the Village MCP tools to track progress visually.

## Workflow

1. **Start a new feature**: Use `village_create_board` with the feature title and list of tasks
2. **Before starting each task**: Use `village_start_task` with the task name
3. **After completing each task**: Use `village_complete_task` with a summary of what was done

## Example

\`\`\`javascript
// Starting a new feature
village_create_board({
  title: "User Authentication",
  tasks: ["Design flow", "Implement JWT", "Add OAuth", "Write tests"]
})

// When starting work on a task
village_start_task({ task: "Design" })

// When done with a task (ALWAYS include summary)
village_complete_task({
  task: "Design",
  summary: "Created login/signup flows, added password reset diagram"
})
\`\`\`

## Rules

- Always provide summaries when completing tasks
- Use `village_get_status` to check current progress
- Use `village_clear_board` when starting a completely new feature
```

## License

MIT
