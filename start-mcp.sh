#!/bin/bash
# Start the Agent Village MCP Server in standalone mode
cd "$(dirname "$0")"
echo "Starting Agent Village MCP Server (standalone mode)..."
echo "WebSocket available at ws://localhost:8765"
echo "Open http://localhost:3000 in your browser"
echo "Press Ctrl+C to stop"
echo ""
node server/mcp.js --standalone
