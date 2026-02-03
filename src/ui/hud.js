/**
 * HUD - Heads Up Display for Agent Village
 * Shows stats, controls, and agent information
 */

/**
 * Create and manage the HUD overlay
 */
export class HUD {
  constructor(options = {}) {
    this.container = options.container || document.body
    this.worldState = null
    this.agentManager = null
    this.fileManager = null

    this.elements = {}
    this.visible = true

    this.createHUD()
    this.startUpdateLoop()
  }

  /**
   * Set data sources
   */
  setDataSources(worldState, agentManager, fileManager) {
    this.worldState = worldState
    this.agentManager = agentManager
    this.fileManager = fileManager
  }

  /**
   * Create HUD elements
   */
  createHUD() {
    // Styles
    const style = document.createElement('style')
    style.textContent = `
      .hud-panel {
        position: fixed;
        color: white;
        background: rgba(0, 0, 0, 0.7);
        padding: 15px 20px;
        border-radius: 12px;
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        font-size: 14px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        z-index: 1000;
        user-select: none;
      }

      .hud-title {
        position: fixed;
        top: 20px;
        left: 20px;
      }

      .hud-title h1 {
        font-size: 24px;
        margin: 0 0 5px 0;
        font-weight: 700;
      }

      .hud-title p {
        margin: 0;
        opacity: 0.7;
        font-size: 12px;
      }

      .hud-stats {
        position: fixed;
        top: 20px;
        right: 20px;
        min-width: 150px;
      }

      .hud-stat-row {
        display: flex;
        justify-content: space-between;
        margin: 4px 0;
      }

      .hud-stat-value {
        font-weight: 600;
        color: #4ade80;
      }

      .hud-controls {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 10px;
        background: transparent;
        padding: 0;
        border: none;
        backdrop-filter: none;
      }

      .hud-button {
        background: rgba(255, 255, 255, 0.95);
        border: none;
        padding: 14px 24px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        color: #333;
        transition: all 0.2s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      }

      .hud-button:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 25px rgba(0, 0, 0, 0.25);
      }

      .hud-button:active {
        transform: translateY(-1px);
      }

      .hud-button.active {
        background: #4ade80;
        color: white;
      }

      .hud-agents {
        position: fixed;
        bottom: 80px;
        left: 20px;
        max-width: 300px;
        max-height: 200px;
        overflow-y: auto;
      }

      .hud-agents h3 {
        margin: 0 0 10px 0;
        font-size: 14px;
        font-weight: 600;
      }

      .hud-agent {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        margin: 4px 0;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
      }

      .hud-agent-color {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }

      .hud-agent-name {
        flex: 1;
        font-weight: 500;
      }

      .hud-agent-state {
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 4px;
        text-transform: uppercase;
      }

      .hud-agent-state.idle { background: rgba(100, 100, 100, 0.5); }
      .hud-agent-state.thinking { background: rgba(255, 200, 0, 0.5); }
      .hud-agent-state.working { background: rgba(0, 150, 255, 0.5); }
      .hud-agent-state.success { background: rgba(0, 200, 100, 0.5); }
      .hud-agent-state.error { background: rgba(255, 50, 50, 0.5); }
      .hud-agent-state.walking { background: rgba(150, 100, 255, 0.5); }

      .hud-help {
        position: fixed;
        bottom: 20px;
        right: 20px;
        font-size: 12px;
        opacity: 0.7;
      }

      .hud-help kbd {
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: monospace;
      }

      .hud-connection {
        position: fixed;
        top: 100px;
        right: 20px;
        font-size: 12px;
      }

      .hud-connection-status {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .hud-connection-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .hud-connection-dot.connected { background: #4ade80; }
      .hud-connection-dot.disconnected { background: #ef4444; }
      .hud-connection-dot.demo { background: #fbbf24; }
    `
    document.head.appendChild(style)

    // Title panel
    const title = document.createElement('div')
    title.className = 'hud-panel hud-title'
    title.innerHTML = `
      <h1>Agent Village</h1>
      <p>Visualizador de Agentes Claude</p>
    `
    this.container.appendChild(title)
    this.elements.title = title

    // Stats panel
    const stats = document.createElement('div')
    stats.className = 'hud-panel hud-stats'
    stats.innerHTML = `
      <div class="hud-stat-row">
        <span>Casas</span>
        <span class="hud-stat-value" id="hud-houses">0</span>
      </div>
      <div class="hud-stat-row">
        <span>Agentes</span>
        <span class="hud-stat-value" id="hud-agents">0</span>
      </div>
      <div class="hud-stat-row">
        <span>Archivos</span>
        <span class="hud-stat-value" id="hud-files">0</span>
      </div>
      <div class="hud-stat-row">
        <span>Árboles</span>
        <span class="hud-stat-value" id="hud-trees">0</span>
      </div>
    `
    this.container.appendChild(stats)
    this.elements.stats = stats

    // Controls
    const controls = document.createElement('div')
    controls.className = 'hud-controls'
    controls.innerHTML = `
      <button class="hud-button" id="btn-house">🏠 Casa</button>
      <button class="hud-button" id="btn-agent">🤖 Agente</button>
      <button class="hud-button" id="btn-tree">🌲 Árbol</button>
      <button class="hud-button" id="btn-auto">✨ Auto</button>
    `
    this.container.appendChild(controls)
    this.elements.controls = controls

    // Agent list
    const agentList = document.createElement('div')
    agentList.className = 'hud-panel hud-agents'
    agentList.innerHTML = `
      <h3>Agentes Activos</h3>
      <div id="agent-list-content"></div>
    `
    this.container.appendChild(agentList)
    this.elements.agentList = agentList

    // Help
    const help = document.createElement('div')
    help.className = 'hud-panel hud-help'
    help.innerHTML = `
      <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Mover &nbsp;
      <kbd>Space</kbd> Subir &nbsp;
      <kbd>Shift</kbd> Bajar &nbsp;
      <kbd>Mouse</kbd> Rotar
    `
    this.container.appendChild(help)
    this.elements.help = help

    // Connection status
    const connection = document.createElement('div')
    connection.className = 'hud-panel hud-connection'
    connection.innerHTML = `
      <div class="hud-connection-status">
        <div class="hud-connection-dot demo" id="connection-dot"></div>
        <span id="connection-text">Demo Mode</span>
      </div>
    `
    this.container.appendChild(connection)
    this.elements.connection = connection
  }

  /**
   * Set button handlers
   */
  setButtonHandlers(handlers) {
    if (handlers.addHouse) {
      document.getElementById('btn-house').onclick = handlers.addHouse
    }
    if (handlers.addAgent) {
      document.getElementById('btn-agent').onclick = handlers.addAgent
    }
    if (handlers.addTree) {
      document.getElementById('btn-tree').onclick = handlers.addTree
    }
    if (handlers.toggleAuto) {
      const btn = document.getElementById('btn-auto')
      btn.onclick = () => {
        const isActive = handlers.toggleAuto()
        btn.classList.toggle('active', isActive)
      }
    }
  }

  /**
   * Update connection status display
   */
  setConnectionStatus(status, text) {
    const dot = document.getElementById('connection-dot')
    const label = document.getElementById('connection-text')

    dot.className = 'hud-connection-dot ' + status
    label.textContent = text
  }

  /**
   * Start update loop
   */
  startUpdateLoop() {
    setInterval(() => this.update(), 250)
  }

  /**
   * Update HUD values
   */
  update() {
    if (!this.visible) return

    // Update stats
    const houses = this.worldState?.houses?.length || 0
    const agents = this.agentManager?.count || 0
    const files = this.fileManager?.count || 0
    const trees = this.worldState?.trees?.length || 0

    document.getElementById('hud-houses').textContent = houses
    document.getElementById('hud-agents').textContent = agents
    document.getElementById('hud-files').textContent = files
    document.getElementById('hud-trees').textContent = trees

    // Update agent list
    this.updateAgentList()
  }

  /**
   * Update agent list display
   */
  updateAgentList() {
    const container = document.getElementById('agent-list-content')
    if (!container || !this.agentManager) return

    const agents = this.agentManager.getAll()

    container.innerHTML = agents.map(agent => {
      const colorHex = '#' + agent.color.map(c =>
        Math.round(c * 255).toString(16).padStart(2, '0')
      ).join('')

      return `
        <div class="hud-agent">
          <div class="hud-agent-color" style="background: ${colorHex}"></div>
          <span class="hud-agent-name">${agent.name}</span>
          <span class="hud-agent-state ${agent.state}">${agent.state}</span>
        </div>
      `
    }).join('')
  }

  /**
   * Toggle HUD visibility
   */
  toggle() {
    this.visible = !this.visible

    Object.values(this.elements).forEach(el => {
      el.style.display = this.visible ? '' : 'none'
    })
  }

  /**
   * Show HUD
   */
  show() {
    this.visible = true
    Object.values(this.elements).forEach(el => {
      el.style.display = ''
    })
  }

  /**
   * Hide HUD
   */
  hide() {
    this.visible = false
    Object.values(this.elements).forEach(el => {
      el.style.display = 'none'
    })
  }
}
