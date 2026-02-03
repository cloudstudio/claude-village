/**
 * Block type definitions for Agent Village
 * Each block type has unique properties and appearance
 */

// Block type IDs
export const BlockTypes = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD_OAK: 4,
  WOOD_BIRCH: 5,
  LEAVES_DARK: 6,
  LEAVES_BRIGHT: 7,
  PLANKS_OAK: 8,
  PLANKS_BIRCH: 9,
  ROOF_RED: 10,
  ROOF_BROWN: 11,
  GLASS: 12,
  DOOR: 13,
  FILE_BLOCK: 14,
  CHEST: 15,
  FLAG_POLE: 16,
  WATER: 17,
  SAND: 18,
  COBBLESTONE: 19
}

// Material definitions (name -> options)
const MATERIALS = {
  grass: { color: [0.36, 0.61, 0.23] },
  dirt: { color: [0.55, 0.41, 0.08] },
  stone: { color: [0.5, 0.5, 0.5] },
  wood_oak: { color: [0.55, 0.35, 0.17] },
  wood_birch: { color: [0.87, 0.84, 0.75] },
  leaves_dark: { color: [0.18, 0.49, 0.2] },
  leaves_bright: { color: [0.3, 0.69, 0.31] },
  planks_oak: { color: [0.79, 0.65, 0.42] },
  planks_birch: { color: [0.87, 0.84, 0.75] },
  roof_red: { color: [0.7, 0.13, 0.13] },
  roof_brown: { color: [0.43, 0.3, 0.16] },
  glass: { color: [0.53, 0.8, 1.0, 0.6], texHasAlpha: true },
  door: { color: [0.29, 0.21, 0.13] },
  file_block: { color: [0.3, 0.6, 0.9] },
  chest: { color: [0.6, 0.4, 0.2] },
  flag_pole: { color: [0.4, 0.4, 0.4] },
  water: { color: [0.2, 0.4, 0.8, 0.7], texHasAlpha: true },
  sand: { color: [0.93, 0.87, 0.68] },
  cobblestone: { color: [0.45, 0.45, 0.45] }
}

// Block to material mapping
const BLOCK_MATERIALS = {
  [BlockTypes.GRASS]: 'grass',
  [BlockTypes.DIRT]: 'dirt',
  [BlockTypes.STONE]: 'stone',
  [BlockTypes.WOOD_OAK]: 'wood_oak',
  [BlockTypes.WOOD_BIRCH]: 'wood_birch',
  [BlockTypes.LEAVES_DARK]: 'leaves_dark',
  [BlockTypes.LEAVES_BRIGHT]: 'leaves_bright',
  [BlockTypes.PLANKS_OAK]: 'planks_oak',
  [BlockTypes.PLANKS_BIRCH]: 'planks_birch',
  [BlockTypes.ROOF_RED]: 'roof_red',
  [BlockTypes.ROOF_BROWN]: 'roof_brown',
  [BlockTypes.GLASS]: 'glass',
  [BlockTypes.DOOR]: 'door',
  [BlockTypes.FILE_BLOCK]: 'file_block',
  [BlockTypes.CHEST]: 'chest',
  [BlockTypes.FLAG_POLE]: 'flag_pole',
  [BlockTypes.WATER]: 'water',
  [BlockTypes.SAND]: 'sand',
  [BlockTypes.COBBLESTONE]: 'cobblestone'
}

// Block properties
const BLOCK_PROPS = {
  [BlockTypes.GLASS]: { opaque: false },
  [BlockTypes.WATER]: { opaque: false, solid: false, fluid: true },
  [BlockTypes.LEAVES_DARK]: { opaque: true },
  [BlockTypes.LEAVES_BRIGHT]: { opaque: true }
}

/**
 * Register all block types with the noa engine
 * @param {Engine} noa - noa-engine instance
 */
export function registerBlocks(noa) {
  // Register materials first
  Object.entries(MATERIALS).forEach(([name, opts]) => {
    noa.registry.registerMaterial(name, opts)
  })

  // Register blocks
  Object.entries(BLOCK_MATERIALS).forEach(([blockId, materialName]) => {
    const id = parseInt(blockId)
    const props = BLOCK_PROPS[id] || {}

    noa.registry.registerBlock(id, {
      material: materialName,
      opaque: props.opaque !== false,
      solid: props.solid !== false,
      fluid: props.fluid || false
    })
  })

  console.log('Blocks registered:', Object.keys(BlockTypes).length - 1) // -1 for AIR
}

/**
 * Get a random wood type
 */
export function randomWoodType() {
  return Math.random() > 0.5 ? BlockTypes.WOOD_OAK : BlockTypes.WOOD_BIRCH
}

/**
 * Get a random plank type
 */
export function randomPlankType() {
  return Math.random() > 0.5 ? BlockTypes.PLANKS_OAK : BlockTypes.PLANKS_BIRCH
}

/**
 * Get a random leaf type
 */
export function randomLeafType() {
  return Math.random() > 0.5 ? BlockTypes.LEAVES_DARK : BlockTypes.LEAVES_BRIGHT
}

/**
 * Get a random roof type
 */
export function randomRoofType() {
  return Math.random() > 0.5 ? BlockTypes.ROOF_RED : BlockTypes.ROOF_BROWN
}
