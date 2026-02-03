/**
 * File entity - represents files created/modified by agents
 * Visualized as special blocks with effects
 */

import * as BABYLON from '@babylonjs/core'
import { BlockTypes } from '../engine/blocks.js'

// File states
export const FileState = {
  CREATED: 'created',
  MODIFIED: 'modified',
  DELETED: 'deleted'
}

/**
 * File block representation in the world
 */
export class FileBlock {
  constructor(noa, options = {}) {
    this.noa = noa
    this.id = options.id || `file-${Date.now()}`
    this.name = options.name || 'unknown.js'
    this.state = options.state || FileState.CREATED
    this.agentId = options.agentId
    this.createdAt = Date.now()

    // Position
    this.position = {
      x: options.x || 0,
      y: options.y || 1,
      z: options.z || 0
    }

    // Visual state
    this.glowIntensity = 1
    this.glowTimer = 0
    this.isAnimating = true

    // Create the block
    this.createBlock()
  }

  /**
   * Create the file block in the world
   */
  createBlock() {
    const { x, y, z } = this.position

    // Place the file block
    this.noa.setBlock(BlockTypes.FILE_BLOCK, x, y, z)

    // Start appearance animation
    this.animateAppearance()
  }

  /**
   * Animate block appearing with glow effect
   */
  animateAppearance() {
    const scene = this.noa.rendering.getScene()

    // Create a temporary glow light
    const light = new BABYLON.PointLight(
      'fileLight-' + this.id,
      new BABYLON.Vector3(this.position.x + 0.5, this.position.y + 0.5, this.position.z + 0.5),
      scene
    )
    light.diffuse = new BABYLON.Color3(0.3, 0.6, 1)
    light.intensity = 2
    light.range = 5

    // Fade out the light
    let intensity = 2
    const fadeInterval = setInterval(() => {
      intensity -= 0.1
      light.intensity = intensity
      if (intensity <= 0) {
        light.dispose()
        clearInterval(fadeInterval)
      }
    }, 50)
  }

  /**
   * Mark file as modified (add glow effect)
   */
  markModified() {
    this.state = FileState.MODIFIED
    this.glowTimer = 0
    this.isAnimating = true
    this.animateAppearance()
  }

  /**
   * Update file visual state
   */
  update(dt) {
    if (!this.isAnimating) return

    this.glowTimer += dt
    this.glowIntensity = 0.5 + Math.sin(this.glowTimer * 4) * 0.5

    // Stop animating after a few seconds
    if (this.glowTimer > 3) {
      this.isAnimating = false
      this.glowIntensity = 0
    }
  }

  /**
   * Remove the file block
   */
  remove() {
    const { x, y, z } = this.position
    this.noa.setBlock(BlockTypes.AIR, x, y, z)
    this.state = FileState.DELETED
  }
}

/**
 * File manager - handles all file blocks
 */
export class FileManager {
  constructor(noa) {
    this.noa = noa
    this.files = new Map()
    this.filePositions = new Map()
  }

  /**
   * Create a new file block near an agent's house
   */
  createFile(house, fileName, agentId) {
    const position = this.findFilePosition(house)

    const file = new FileBlock(this.noa, {
      name: fileName,
      agentId: agentId,
      x: position.x,
      y: position.y,
      z: position.z
    })

    this.files.set(file.id, file)
    this.filePositions.set(`${position.x},${position.y},${position.z}`, file.id)

    return file
  }

  /**
   * Find a good position for a file near a house
   */
  findFilePosition(house) {
    // Place files behind/beside the house
    const baseX = house.x + house.width + 1
    const baseZ = house.z
    const baseY = house.y

    // Find unoccupied position
    for (let dx = 0; dx < 5; dx++) {
      for (let dz = 0; dz < 5; dz++) {
        const x = baseX + dx
        const z = baseZ + dz
        const y = baseY

        const key = `${x},${y},${z}`
        if (!this.filePositions.has(key)) {
          return { x, y, z }
        }
      }
    }

    // Fallback: stack vertically
    return {
      x: baseX,
      y: baseY + this.files.size,
      z: baseZ
    }
  }

  /**
   * Get file by ID
   */
  getFile(id) {
    return this.files.get(id)
  }

  /**
   * Get file by name
   */
  getFileByName(name) {
    for (const file of this.files.values()) {
      if (file.name === name) return file
    }
    return null
  }

  /**
   * Mark a file as modified
   */
  modifyFile(fileId) {
    const file = this.files.get(fileId)
    if (file) {
      file.markModified()
    }
  }

  /**
   * Update all files
   */
  update(dt) {
    for (const file of this.files.values()) {
      file.update(dt)
    }
  }

  /**
   * Get file count
   */
  get count() {
    return this.files.size
  }

  /**
   * Get all files
   */
  getAll() {
    return Array.from(this.files.values())
  }
}
