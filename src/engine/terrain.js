/**
 * Procedural terrain generation for Agent Village
 */

import { BlockTypes, randomWoodType, randomLeafType } from './blocks.js'

// Terrain configuration
const TERRAIN_CONFIG = {
  groundLevel: 0,
  hillHeight: 3,
  treeChance: 0.02,
  flowerChance: 0.01
}

/**
 * Simple noise function for terrain variation
 */
function noise2D(x, z, seed = 12345) {
  const n = Math.sin(x * 0.1 + seed) * Math.cos(z * 0.1 + seed * 2)
  return (n + 1) / 2 // Normalize to 0-1
}

/**
 * World generation function for noa-engine
 * Called when chunks are generated
 * @param {number} x - Chunk X coordinate
 * @param {number} y - Chunk Y coordinate
 * @param {number} z - Chunk Z coordinate
 * @returns {number} Block ID at this position
 */
export function worldGenFn(x, y, z) {
  // Calculate height variation using simple noise
  const heightNoise = noise2D(x, z)
  const surfaceY = TERRAIN_CONFIG.groundLevel + Math.floor(heightNoise * TERRAIN_CONFIG.hillHeight)

  // Underground
  if (y < surfaceY - 3) {
    return BlockTypes.STONE
  }

  // Sub-surface dirt
  if (y < surfaceY) {
    return BlockTypes.DIRT
  }

  // Surface grass
  if (y === surfaceY) {
    return BlockTypes.GRASS
  }

  // Air above ground
  return BlockTypes.AIR
}

/**
 * Generate a tree at the given position
 * @param {Engine} noa - noa-engine instance
 * @param {number} x - Base X position
 * @param {number} y - Base Y position (ground level)
 * @param {number} z - Base Z position
 */
export function generateTree(noa, x, y, z) {
  const woodType = randomWoodType()
  const leafType = randomLeafType()
  const height = 4 + Math.floor(Math.random() * 3) // 4-6 blocks tall

  // Trunk
  for (let h = 0; h < height; h++) {
    noa.setBlock(woodType, x, y + h, z)
  }

  // Leaves - create a sphere-ish shape
  const leafRadius = 2
  const leafStart = height - 2

  for (let ly = 0; ly <= 3; ly++) {
    const radius = ly === 0 || ly === 3 ? 1 : leafRadius
    for (let lx = -radius; lx <= radius; lx++) {
      for (let lz = -radius; lz <= radius; lz++) {
        // Skip corners for more organic look
        if (Math.abs(lx) === radius && Math.abs(lz) === radius) continue
        // Don't overwrite trunk
        if (lx === 0 && lz === 0 && ly < 2) continue

        noa.setBlock(leafType, x + lx, y + leafStart + ly, z + lz)
      }
    }
  }
}

/**
 * Generate a house at the given position
 * @param {Engine} noa - noa-engine instance
 * @param {number} x - Base X position
 * @param {number} y - Base Y position (ground level)
 * @param {number} z - Base Z position
 * @param {Object} options - House options (width, depth, height)
 * @returns {Object} House data including dimensions and position
 */
export function generateHouse(noa, x, y, z, options = {}) {
  const width = options.width || 5 + Math.floor(Math.random() * 2)
  const depth = options.depth || 5 + Math.floor(Math.random() * 2)
  const wallHeight = options.height || 4

  const plankType = Math.random() > 0.5 ? BlockTypes.PLANKS_OAK : BlockTypes.PLANKS_BIRCH
  const roofType = Math.random() > 0.5 ? BlockTypes.ROOF_RED : BlockTypes.ROOF_BROWN

  // Floor
  for (let fx = 0; fx < width; fx++) {
    for (let fz = 0; fz < depth; fz++) {
      noa.setBlock(BlockTypes.COBBLESTONE, x + fx, y, z + fz)
    }
  }

  // Walls
  for (let h = 1; h <= wallHeight; h++) {
    for (let w = 0; w < width; w++) {
      // Front and back walls
      noa.setBlock(plankType, x + w, y + h, z)
      noa.setBlock(plankType, x + w, y + h, z + depth - 1)
    }
    for (let d = 1; d < depth - 1; d++) {
      // Side walls
      noa.setBlock(plankType, x, y + h, z + d)
      noa.setBlock(plankType, x + width - 1, y + h, z + d)
    }
  }

  // Door (front wall, center)
  const doorX = x + Math.floor(width / 2)
  noa.setBlock(BlockTypes.DOOR, doorX, y + 1, z)
  noa.setBlock(BlockTypes.DOOR, doorX, y + 2, z)

  // Windows
  const windowY = y + 2
  // Side windows
  if (depth > 3) {
    const windowZ = z + Math.floor(depth / 2)
    noa.setBlock(BlockTypes.GLASS, x, windowY, windowZ)
    noa.setBlock(BlockTypes.GLASS, x + width - 1, windowY, windowZ)
  }

  // Roof (simple pitched roof)
  const roofOverhang = 1
  for (let roofRow = 0; roofRow <= Math.ceil(width / 2); roofRow++) {
    const roofY = y + wallHeight + 1 + roofRow
    for (let rz = -roofOverhang; rz < depth + roofOverhang; rz++) {
      if (roofRow < Math.ceil(width / 2)) {
        // Roof slopes
        noa.setBlock(roofType, x - roofOverhang + roofRow, roofY, z + rz)
        noa.setBlock(roofType, x + width - 1 + roofOverhang - roofRow, roofY, z + rz)
      } else if (width % 2 === 1) {
        // Peak (only for odd width)
        noa.setBlock(roofType, x + Math.floor(width / 2), roofY, z + rz)
      }
    }
  }

  return {
    x, y, z,
    width, depth,
    height: wallHeight,
    doorPosition: { x: doorX, y: y, z: z - 1 }, // In front of door
    agents: []
  }
}

/**
 * Generate decorative elements around a position
 */
export function generateDecorations(noa, centerX, centerZ, radius = 30) {
  const treesToGenerate = []

  // Find positions for trees
  for (let x = centerX - radius; x <= centerX + radius; x += 4) {
    for (let z = centerZ - radius; z <= centerZ + radius; z += 4) {
      if (Math.random() < TERRAIN_CONFIG.treeChance * 10) {
        // Get surface height
        let surfaceY = 0
        for (let y = 10; y >= -10; y--) {
          if (noa.getBlock(x, y, z) === BlockTypes.GRASS) {
            surfaceY = y + 1
            break
          }
        }
        treesToGenerate.push({ x, y: surfaceY, z })
      }
    }
  }

  return treesToGenerate
}
