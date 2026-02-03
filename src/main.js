/**
 * Agent Village - Main Entry Point
 *
 * A 3D Minecraft-style visualization for representing Claude agent work in real-time.
 * Uses noa-engine for voxel rendering with Babylon.js backend.
 */

import { Engine } from 'noa-engine'
import { registerBlocks, BlockTypes } from './engine/blocks.js'
import { worldGenFn, generateHouse, generateTree } from './engine/terrain.js'
import { AgentManager, AgentState } from './entities/agent.js'
import { FileManager } from './entities/file.js'
import { APIConnector, DemoConnector } from './api/connector.js'
import { HUD } from './ui/hud.js'

// ============================================================
// Configuration
// ============================================================

const CONFIG = {
  // noa-engine settings
  engine: {
    debug: false,
    showFPS: true,
    chunkSize: 32,
    chunkAddDistance: [3, 2],
    chunkRemoveDistance: [4, 3],
    blockTestDistance: 10,
    texturePath: '',
    playerHeight: 1.8,
    playerWidth: 0.6,
    playerStart: [0, 15, 25],
    playerAutoStep: false,
    clearColor: [0.53, 0.81, 0.92], // Sky blue
    ambientColor: [0.85, 0.85, 0.85],
    lightDiffuse: [1, 1, 0.95],
    lightSpecular: [1, 1, 0.9],
    groundLightPenalty: 0.4,
    useAO: true,
    AOmultipliers: [0.92, 0.8, 0.5],
    reverseAOmultiplier: 1.0
  },

  // Initial village setup
  village: {
    initialHouses: 3,
    initialTrees: 8,
    initialAgents: 3
  },

  // API connection
  api: {
    url: 'ws://localhost:8080',
    autoReconnect: true,
    demoMode: true // Start in demo mode by default
  }
}

// ============================================================
// World State
// ============================================================

const worldState = {
  houses: [],
  trees: [],
  initialized: false
}

// ============================================================
// Initialize Engine
// ============================================================

console.log('Initializing Agent Village...')

const noa = new Engine(CONFIG.engine)

// Register block types
registerBlocks(noa)

// ============================================================
// World Generation
// ============================================================

noa.world.on('worldDataNeeded', (requestID, data, x, y, z) => {
  const { shape } = data

  for (let i = 0; i < shape[0]; i++) {
    for (let j = 0; j < shape[1]; j++) {
      for (let k = 0; k < shape[2]; k++) {
        const blockId = worldGenFn(x + i, y + j, z + k)
        data.set(i, j, k, blockId)
      }
    }
  }

  noa.world.setChunkData(requestID, data)
})

// ============================================================
// Camera Setup (Spectator/Overview Mode)
// ============================================================

function setupCamera() {
  const player = noa.playerEntity

  // Disable physics for free camera
  if (noa.ents.hasPhysics(player)) {
    noa.ents.removeComponent(player, noa.ents.names.physics)
  }

  // Camera settings
  noa.camera.zoomDistance = 0 // First person style for now

  // Keyboard bindings
  noa.inputs.bind('forward', 'KeyW')
  noa.inputs.bind('backward', 'KeyS')
  noa.inputs.bind('left', 'KeyA')
  noa.inputs.bind('right', 'KeyD')
  noa.inputs.bind('up', 'Space')
  noa.inputs.bind('down', 'ShiftLeft')

  // Movement speed
  const moveSpeed = 0.3

  // Camera movement
  noa.on('tick', () => {
    const pos = noa.ents.getPosition(player)
    if (!pos) return

    let dx = 0, dy = 0, dz = 0

    if (noa.inputs.state.forward) dz -= moveSpeed
    if (noa.inputs.state.backward) dz += moveSpeed
    if (noa.inputs.state.left) dx -= moveSpeed
    if (noa.inputs.state.right) dx += moveSpeed
    if (noa.inputs.state.up) dy += moveSpeed
    if (noa.inputs.state.down) dy -= moveSpeed

    // Apply camera rotation to movement
    const cos = Math.cos(noa.camera.heading)
    const sin = Math.sin(noa.camera.heading)
    const rotatedX = dx * cos - dz * sin
    const rotatedZ = dx * sin + dz * cos

    noa.ents.setPosition(player, [
      pos[0] + rotatedX,
      pos[1] + dy,
      pos[2] + rotatedZ
    ])
  })
}

// ============================================================
// Entity Managers
// ============================================================

const agentManager = new AgentManager(noa)
const fileManager = new FileManager(noa)

// ============================================================
// Village Building Functions
// ============================================================

/**
 * Find surface Y level at position
 */
function findSurfaceY(x, z) {
  for (let y = 20; y >= -10; y--) {
    const block = noa.getBlock(x, y, z)
    if (block === BlockTypes.GRASS || block === BlockTypes.DIRT || block === BlockTypes.STONE) {
      return y + 1
    }
  }
  return 1
}

/**
 * Add a house to the village
 */
function addHouse() {
  let x, z, attempts = 0
  const minDist = 12

  // Find valid position
  do {
    const angle = Math.random() * Math.PI * 2
    const dist = 8 + worldState.houses.length * 5 + Math.random() * 8
    x = Math.floor(Math.cos(angle) * dist)
    z = Math.floor(Math.sin(angle) * dist)
    attempts++

    let valid = true
    for (const house of worldState.houses) {
      const dx = x - house.x
      const dz = z - house.z
      if (Math.sqrt(dx * dx + dz * dz) < minDist) {
        valid = false
        break
      }
    }
    if (valid) break
  } while (attempts < 50)

  const surfaceY = findSurfaceY(x, z)
  const house = generateHouse(noa, x, surfaceY, z)
  worldState.houses.push(house)

  console.log(`House added at (${x}, ${surfaceY}, ${z})`)
  return house
}

/**
 * Add a tree to the village
 */
function addTree() {
  let x, z, attempts = 0
  const minDistHouse = 8
  const minDistTree = 4

  do {
    const angle = Math.random() * Math.PI * 2
    const dist = 5 + Math.random() * 35
    x = Math.floor(Math.cos(angle) * dist)
    z = Math.floor(Math.sin(angle) * dist)
    attempts++

    let valid = true

    // Check houses
    for (const house of worldState.houses) {
      const dx = x - house.x
      const dz = z - house.z
      if (Math.sqrt(dx * dx + dz * dz) < minDistHouse) {
        valid = false
        break
      }
    }

    // Check other trees
    if (valid) {
      for (const tree of worldState.trees) {
        const dx = x - tree.x
        const dz = z - tree.z
        if (Math.sqrt(dx * dx + dz * dz) < minDistTree) {
          valid = false
          break
        }
      }
    }

    if (valid) break
  } while (attempts < 50)

  const surfaceY = findSurfaceY(x, z)
  generateTree(noa, x, surfaceY, z)
  worldState.trees.push({ x, y: surfaceY, z })

  console.log(`Tree added at (${x}, ${surfaceY}, ${z})`)
}

/**
 * Add an agent to the village
 */
function addAgent() {
  // Find house with room
  let house = worldState.houses.find(h => h.agents.length < 2)

  if (!house) {
    house = addHouse()
  }

  const agent = agentManager.createAgent(house, {
    name: `Agent ${agentManager.count + 1}`
  })

  console.log(`Agent created: ${agent.name}`)
  return agent
}

// ============================================================
// Initialize Village
// ============================================================

function initializeVillage() {
  console.log('Waiting for world to generate...')

  // Wait for chunks to load, then build
  setTimeout(() => {
    console.log('Building initial village...')

    // Add trees first (background)
    for (let i = 0; i < CONFIG.village.initialTrees; i++) {
      addTree()
    }

    // Add houses
    for (let i = 0; i < CONFIG.village.initialHouses; i++) {
      addHouse()
    }

    // Add agents
    for (let i = 0; i < CONFIG.village.initialAgents; i++) {
      addAgent()
    }

    worldState.initialized = true
    console.log('Village initialized!')
  }, 1500)
}

// ============================================================
// HUD Setup
// ============================================================

const hud = new HUD()
hud.setDataSources(worldState, agentManager, fileManager)

// ============================================================
// API / Demo Connector
// ============================================================

let connector
let autoMode = false

if (CONFIG.api.demoMode) {
  connector = new DemoConnector({ interval: 2500 })
  connector.setManagers(agentManager, fileManager, worldState)
  connector.setWorldFunctions(addHouse, addTree)
  hud.setConnectionStatus('demo', 'Demo Mode')
} else {
  connector = new APIConnector(CONFIG.api)
  connector.setManagers(agentManager, fileManager, worldState)

  connector.on('connected', () => {
    hud.setConnectionStatus('connected', 'Conectado')
  })

  connector.on('disconnected', () => {
    hud.setConnectionStatus('disconnected', 'Desconectado')
  })

  connector.connect().catch(err => {
    console.log('Could not connect to API, using demo mode')
    hud.setConnectionStatus('demo', 'Demo Mode (API unavailable)')
  })
}

// ============================================================
// Button Handlers
// ============================================================

hud.setButtonHandlers({
  addHouse: () => {
    if (worldState.initialized) addHouse()
  },
  addAgent: () => {
    if (worldState.initialized) addAgent()
  },
  addTree: () => {
    if (worldState.initialized) addTree()
  },
  toggleAuto: () => {
    autoMode = !autoMode
    if (autoMode) {
      connector.start()
    } else {
      connector.stop()
    }
    return autoMode
  }
})

// ============================================================
// Main Update Loop
// ============================================================

let lastTime = performance.now()

noa.on('tick', () => {
  const now = performance.now()
  const dt = (now - lastTime) / 1000
  lastTime = now

  // Update agents
  agentManager.update(dt)

  // Update files
  fileManager.update(dt)
})

// ============================================================
// Keyboard Shortcuts
// ============================================================

document.addEventListener('keydown', (e) => {
  // H - Toggle HUD
  if (e.code === 'KeyH' && !e.ctrlKey && !e.metaKey) {
    hud.toggle()
  }

  // Number keys for quick actions (when HUD visible)
  if (worldState.initialized && hud.visible) {
    if (e.code === 'Digit1') addHouse()
    if (e.code === 'Digit2') addAgent()
    if (e.code === 'Digit3') addTree()
  }
})

// ============================================================
// Startup
// ============================================================

setupCamera()
initializeVillage()

console.log('Agent Village ready!')
console.log('Controls: WASD to move, Space/Shift for up/down, Mouse to look')
console.log('Press H to toggle HUD')

// Export for debugging
window.agentVillage = {
  noa,
  worldState,
  agentManager,
  fileManager,
  connector,
  addHouse,
  addTree,
  addAgent
}
