/**
 * API Connector - handles communication with MCP server
 * Translates API events to visual actions in the village
 */

import { AgentState } from '../entities/agent.js'

// Event types from MCP server
export const EventType = {
  AGENT_CREATED: 'agent_created',
  AGENT_DESTROYED: 'agent_destroyed',
  TASK_STARTED: 'task_started',
  TASK_COMPLETED: 'task_completed',
  TASK_FAILED: 'task_failed',
  FILE_CREATED: 'file_created',
  FILE_MODIFIED: 'file_modified',
  FILE_DELETED: 'file_deleted',
  AGENT_THINKING: 'agent_thinking',
  AGENT_IDLE: 'agent_idle'
}

/**
 * API Connector class
 * Connects to MCP server via WebSocket and dispatches events
 */
export class APIConnector {
  constructor(options = {}) {
    this.url = options.url || 'ws://localhost:8080'
    this.autoReconnect = options.autoReconnect !== false
    this.reconnectDelay = options.reconnectDelay || 3000

    this.ws = null
    this.connected = false
    this.handlers = new Map()
    this.messageQueue = []

    // Village references (set after initialization)
    this.agentManager = null
    this.fileManager = null
    this.worldState = null
  }

  /**
   * Connect managers for event handling
   */
  setManagers(agentManager, fileManager, worldState) {
    this.agentManager = agentManager
    this.fileManager = fileManager
    this.worldState = worldState
  }

  /**
   * Connect to the WebSocket server
   */
  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('Already connected')
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          console.log('Connected to MCP server')
          this.connected = true
          this.flushMessageQueue()
          this.emit('connected')
          resolve()
        }

        this.ws.onclose = (event) => {
          console.log('Disconnected from MCP server', event.code)
          this.connected = false
          this.emit('disconnected')

          if (this.autoReconnect && event.code !== 1000) {
            setTimeout(() => this.connect(), this.reconnectDelay)
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.emit('error', error)
          reject(error)
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            this.handleMessage(data)
          } catch (e) {
            console.error('Failed to parse message:', e)
          }
        }
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.ws) {
      this.autoReconnect = false
      this.ws.close(1000)
      this.ws = null
    }
  }

  /**
   * Handle incoming message
   */
  handleMessage(data) {
    const { type, payload } = data

    console.log('Received event:', type, payload)

    // Map event types to visual actions
    switch (type) {
      case EventType.AGENT_CREATED:
        this.handleAgentCreated(payload)
        break

      case EventType.TASK_STARTED:
        this.handleTaskStarted(payload)
        break

      case EventType.TASK_COMPLETED:
        this.handleTaskCompleted(payload)
        break

      case EventType.TASK_FAILED:
        this.handleTaskFailed(payload)
        break

      case EventType.FILE_CREATED:
        this.handleFileCreated(payload)
        break

      case EventType.FILE_MODIFIED:
        this.handleFileModified(payload)
        break

      case EventType.AGENT_THINKING:
        this.handleAgentThinking(payload)
        break

      case EventType.AGENT_IDLE:
        this.handleAgentIdle(payload)
        break

      default:
        console.log('Unknown event type:', type)
    }

    // Emit for custom handlers
    this.emit(type, payload)
  }

  /**
   * Handle agent created event
   */
  handleAgentCreated(payload) {
    if (!this.agentManager || !this.worldState) return

    const { agentId, name } = payload

    // Find or create a house for the agent
    let house = this.worldState.houses.find(h => h.agents.length === 0)

    if (!house && this.worldState.addHouse) {
      house = this.worldState.addHouse()
    }

    if (house) {
      this.agentManager.createAgent(house, {
        id: agentId,
        name: name
      })
    }
  }

  /**
   * Handle task started event
   */
  handleTaskStarted(payload) {
    if (!this.agentManager) return

    const { agentId, taskName } = payload
    const agent = this.agentManager.getAgent(agentId)

    if (agent) {
      agent.startTask(taskName)
    }
  }

  /**
   * Handle task completed event
   */
  handleTaskCompleted(payload) {
    if (!this.agentManager) return

    const { agentId } = payload
    const agent = this.agentManager.getAgent(agentId)

    if (agent) {
      agent.completeTask()
    }
  }

  /**
   * Handle task failed event
   */
  handleTaskFailed(payload) {
    if (!this.agentManager) return

    const { agentId, error } = payload
    const agent = this.agentManager.getAgent(agentId)

    if (agent) {
      agent.failTask(error)
    }
  }

  /**
   * Handle file created event
   */
  handleFileCreated(payload) {
    if (!this.fileManager || !this.agentManager || !this.worldState) return

    const { fileName, agentId } = payload
    const agent = this.agentManager.getAgent(agentId)

    if (agent && agent.house) {
      this.fileManager.createFile(agent.house, fileName, agentId)
    }
  }

  /**
   * Handle file modified event
   */
  handleFileModified(payload) {
    if (!this.fileManager) return

    const { fileName } = payload
    const file = this.fileManager.getFileByName(fileName)

    if (file) {
      file.markModified()
    }
  }

  /**
   * Handle agent thinking event
   */
  handleAgentThinking(payload) {
    if (!this.agentManager) return

    const { agentId } = payload
    const agent = this.agentManager.getAgent(agentId)

    if (agent) {
      agent.setState(AgentState.THINKING)
    }
  }

  /**
   * Handle agent idle event
   */
  handleAgentIdle(payload) {
    if (!this.agentManager) return

    const { agentId } = payload
    const agent = this.agentManager.getAgent(agentId)

    if (agent) {
      agent.setState(AgentState.IDLE)
    }
  }

  /**
   * Send message to server
   */
  send(type, payload) {
    const message = JSON.stringify({ type, payload })

    if (this.connected && this.ws) {
      this.ws.send(message)
    } else {
      this.messageQueue.push(message)
    }
  }

  /**
   * Flush queued messages
   */
  flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.connected) {
      const message = this.messageQueue.shift()
      this.ws.send(message)
    }
  }

  /**
   * Register event handler
   */
  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, [])
    }
    this.handlers.get(event).push(handler)
  }

  /**
   * Remove event handler
   */
  off(event, handler) {
    const handlers = this.handlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * Emit event to handlers
   */
  emit(event, data) {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }
}

/**
 * Demo mode - simulates events without server connection
 */
export class DemoConnector {
  constructor(options = {}) {
    this.interval = options.interval || 3000
    this.running = false
    this.timer = null

    this.agentManager = null
    this.fileManager = null
    this.worldState = null
    this.addHouse = null
    this.addTree = null

    this.demoAgentIds = []
    this.taskNames = [
      'Escribir función login',
      'Refactorizar módulo auth',
      'Crear tests unitarios',
      'Optimizar queries DB',
      'Implementar cache',
      'Documentar API',
      'Corregir bug #123',
      'Actualizar dependencias',
      'Crear componente Header',
      'Validar formulario'
    ]

    this.fileNames = [
      'auth.js',
      'login.ts',
      'user.model.js',
      'api.service.ts',
      'utils.js',
      'config.json',
      'index.html',
      'styles.css',
      'app.tsx',
      'database.sql'
    ]
  }

  /**
   * Set managers
   */
  setManagers(agentManager, fileManager, worldState) {
    this.agentManager = agentManager
    this.fileManager = fileManager
    this.worldState = worldState
  }

  /**
   * Set world functions
   */
  setWorldFunctions(addHouse, addTree) {
    this.addHouse = addHouse
    this.addTree = addTree
  }

  /**
   * Start demo mode
   */
  start() {
    if (this.running) return

    this.running = true
    console.log('Demo mode started')

    // Generate initial events
    this.generateEvent()

    // Continue generating events
    this.timer = setInterval(() => {
      this.generateEvent()
    }, this.interval)
  }

  /**
   * Stop demo mode
   */
  stop() {
    this.running = false
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    console.log('Demo mode stopped')
  }

  /**
   * Generate a random demo event
   */
  generateEvent() {
    const agents = this.agentManager?.getAll() || []
    const rand = Math.random()

    // Decide what event to generate
    if (agents.length === 0 || rand < 0.15) {
      // Create new agent
      this.createDemoAgent()
    } else if (rand < 0.4) {
      // Start task on random agent
      const agent = agents[Math.floor(Math.random() * agents.length)]
      if (agent.state === 'idle') {
        const taskName = this.taskNames[Math.floor(Math.random() * this.taskNames.length)]
        agent.startTask(taskName)

        // Schedule completion
        const duration = 2000 + Math.random() * 4000
        setTimeout(() => {
          if (agent.state === 'working') {
            if (Math.random() > 0.15) {
              agent.completeTask()
              // Maybe create a file
              if (Math.random() > 0.5) {
                const fileName = this.fileNames[Math.floor(Math.random() * this.fileNames.length)]
                this.fileManager?.createFile(agent.house, fileName, agent.id)
              }
            } else {
              agent.failTask('Error simulado')
            }
          }
        }, duration)
      }
    } else if (rand < 0.55) {
      // Agent thinking
      const agent = agents[Math.floor(Math.random() * agents.length)]
      if (agent.state === 'idle') {
        agent.setState('thinking')
        setTimeout(() => {
          if (agent.state === 'thinking') {
            agent.setState('idle')
          }
        }, 1500 + Math.random() * 2000)
      }
    } else if (rand < 0.7) {
      // Add tree
      if (this.addTree) {
        this.addTree()
      }
    } else if (rand < 0.8 && this.worldState?.houses?.length < 10) {
      // Add house
      if (this.addHouse) {
        this.addHouse()
      }
    }
  }

  /**
   * Create a demo agent
   */
  createDemoAgent() {
    if (!this.agentManager || !this.worldState) return

    // Find house with fewest agents
    let house = this.worldState.houses?.reduce((best, h) => {
      if (!best || h.agents.length < best.agents.length) return h
      return best
    }, null)

    // Create new house if needed
    if (!house || house.agents.length >= 2) {
      if (this.addHouse) {
        house = this.addHouse()
      }
    }

    if (house) {
      const agent = this.agentManager.createAgent(house, {
        id: `demo-agent-${Date.now()}`,
        name: `Agent ${this.agentManager.count + 1}`
      })
      this.demoAgentIds.push(agent.id)
    }
  }
}
