/**
 * World configuration and setup for noa-engine
 * Main entry point for the voxel engine
 */

import { Engine } from 'noa-engine'
import { registerBlocks, BlockTypes } from './blocks.js'
import { worldGenFn, generateHouse, generateTree } from './terrain.js'

// Engine configuration
const ENGINE_CONFIG = {
  debug: false,
  showFPS: true,
  chunkSize: 32,
  chunkAddDistance: [3, 2],
  chunkRemoveDistance: [4, 3],
  blockTestDistance: 10,
  texturePath: '',
  playerHeight: 1.8,
  playerWidth: 0.6,
  playerStart: [0, 5, 0],
  playerAutoStep: true,
  clearColor: [0.53, 0.81, 0.92], // Sky blue
  ambientColor: [0.9, 0.9, 0.9],
  lightDiffuse: [1, 1, 0.95],
  lightSpecular: [1, 1, 0.9],
  groundLightPenalty: 0.4,
  useAO: true,
  AOmultipliers: [0.92, 0.8, 0.5],
  reverseAOmultiplier: 1.0
}

// World state
let worldState = {
  houses: [],
  trees: [],
  agents: [],
  files: [],
  initialized: false
}

/**
 * Create and initialize the noa engine
 * @returns {Engine} Configured noa engine instance
 */
export function createWorld() {
  // Create engine with config
  const noa = new Engine(ENGINE_CONFIG)

  // Register block types
  registerBlocks(noa)

  // Set world generation function
  noa.world.on('worldDataNeeded', (requestID, data, x, y, z) => {
    // Fill chunk data with terrain
    const { shape } = data
    for (let i = 0; i < shape[0]; i++) {
      for (let j = 0; j < shape[1]; j++) {
        for (let k = 0; k < shape[2]; k++) {
          const blockId = worldGenFn(x + i, y + j, z + k)
          data.set(i, j, k, blockId)
        }
      }
    }
    // Signal that chunk is ready
    noa.world.setChunkData(requestID, data)
  })

  // Configure camera for third-person/overview
  setupCamera(noa)

  // Disable player physics for overview mode
  setupOverviewMode(noa)

  return noa
}

/**
 * Setup camera for overview/spectator mode
 */
function setupCamera(noa) {
  // Set initial camera position for overview
  const cam = noa.camera

  // Increase view distance
  cam.zoomDistance = 30

  // Set camera angle for isometric-ish view
  noa.camera.heading = Math.PI / 4
  noa.camera.pitch = -Math.PI / 6
}

/**
 * Setup overview/spectator mode (no player physics)
 */
function setupOverviewMode(noa) {
  // Get player entity
  const player = noa.playerEntity

  // Remove physics body to allow free camera movement
  if (noa.ents.hasPhysics(player)) {
    noa.ents.removeComponent(player, noa.ents.names.physics)
  }

  // Setup keyboard controls for camera movement
  const moveSpeed = 0.5

  noa.inputs.bind('forward', 'KeyW')
  noa.inputs.bind('backward', 'KeyS')
  noa.inputs.bind('left', 'KeyA')
  noa.inputs.bind('right', 'KeyD')
  noa.inputs.bind('up', 'Space')
  noa.inputs.bind('down', 'ShiftLeft')

  // Camera movement tick
  noa.on('tick', () => {
    const pos = noa.ents.getPosition(player)
    let dx = 0, dy = 0, dz = 0

    if (noa.inputs.state.forward) dz -= moveSpeed
    if (noa.inputs.state.backward) dz += moveSpeed
    if (noa.inputs.state.left) dx -= moveSpeed
    if (noa.inputs.state.right) dx += moveSpeed
    if (noa.inputs.state.up) dy += moveSpeed
    if (noa.inputs.state.down) dy -= moveSpeed

    // Apply rotation to movement
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

/**
 * Initialize the village with houses and trees
 * @param {Engine} noa - noa engine instance
 * @param {Object} options - Initialization options
 */
export function initializeVillage(noa, options = {}) {
  const numHouses = options.houses || 3
  const numTrees = options.trees || 8

  // Wait for initial chunks to load
  setTimeout(() => {
    // Generate houses in a circle pattern
    const houseRadius = 15
    for (let i = 0; i < numHouses; i++) {
      const angle = (i / numHouses) * Math.PI * 2
      const x = Math.floor(Math.cos(angle) * houseRadius)
      const z = Math.floor(Math.sin(angle) * houseRadius)

      // Find surface level
      let surfaceY = findSurfaceY(noa, x, z)

      const house = generateHouse(noa, x, surfaceY, z)
      worldState.houses.push(house)
    }

    // Generate trees randomly around the village
    const treeRadius = 25
    for (let i = 0; i < numTrees; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = 10 + Math.random() * treeRadius
      const x = Math.floor(Math.cos(angle) * dist)
      const z = Math.floor(Math.sin(angle) * dist)

      // Check it's not too close to houses
      let tooClose = false
      for (const house of worldState.houses) {
        const dx = x - house.x
        const dz = z - house.z
        if (Math.sqrt(dx * dx + dz * dz) < 8) {
          tooClose = true
          break
        }
      }

      if (!tooClose) {
        const surfaceY = findSurfaceY(noa, x, z)
        generateTree(noa, x, surfaceY, z)
        worldState.trees.push({ x, y: surfaceY, z })
      }
    }

    worldState.initialized = true
    console.log(`Village initialized: ${worldState.houses.length} houses, ${worldState.trees.length} trees`)
  }, 1000) // Wait for chunks to generate
}

/**
 * Find the surface Y level at a given X,Z position
 */
function findSurfaceY(noa, x, z) {
  for (let y = 10; y >= -10; y--) {
    const block = noa.getBlock(x, y, z)
    if (block === BlockTypes.GRASS || block === BlockTypes.DIRT || block === BlockTypes.STONE) {
      return y + 1
    }
  }
  return 1 // Default
}

/**
 * Add a new house to the village
 * @param {Engine} noa - noa engine instance
 * @returns {Object} House data
 */
export function addHouse(noa) {
  // Find position away from other buildings
  let x, z, attempts = 0
  const minDist = 12

  do {
    const angle = Math.random() * Math.PI * 2
    const dist = 10 + worldState.houses.length * 6 + Math.random() * 10
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

  const surfaceY = findSurfaceY(noa, x, z)
  const house = generateHouse(noa, x, surfaceY, z)
  worldState.houses.push(house)

  return house
}

/**
 * Add a tree to the village
 */
export function addTree(noa) {
  let x, z, attempts = 0

  do {
    const angle = Math.random() * Math.PI * 2
    const dist = 8 + Math.random() * 30
    x = Math.floor(Math.cos(angle) * dist)
    z = Math.floor(Math.sin(angle) * dist)
    attempts++

    let valid = true
    for (const house of worldState.houses) {
      const dx = x - house.x
      const dz = z - house.z
      if (Math.sqrt(dx * dx + dz * dz) < 6) {
        valid = false
        break
      }
    }
    for (const tree of worldState.trees) {
      const dx = x - tree.x
      const dz = z - tree.z
      if (Math.sqrt(dx * dx + dz * dz) < 4) {
        valid = false
        break
      }
    }
    if (valid) break
  } while (attempts < 50)

  const surfaceY = findSurfaceY(noa, x, z)
  generateTree(noa, x, surfaceY, z)
  worldState.trees.push({ x, y: surfaceY, z })
}

/**
 * Get current world state
 */
export function getWorldState() {
  return worldState
}

/**
 * Get a random house for agent assignment
 */
export function getRandomHouse() {
  if (worldState.houses.length === 0) return null
  return worldState.houses[Math.floor(Math.random() * worldState.houses.length)]
}
