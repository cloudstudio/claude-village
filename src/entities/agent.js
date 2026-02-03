/**
 * Agent entity - represents a Claude agent in the village
 * Handles agent states, animations, and visual representation
 */

import * as BABYLON from '@babylonjs/core'

// Agent states
export const AgentState = {
  IDLE: 'idle',
  THINKING: 'thinking',
  WORKING: 'working',
  WALKING: 'walking',
  SUCCESS: 'success',
  ERROR: 'error'
}

// Agent colors (for unique identification)
const AGENT_COLORS = [
  [0.42, 0.36, 0.91], // Purple
  [0.00, 0.72, 0.58], // Teal
  [0.99, 0.67, 0.37], // Orange
  [0.88, 0.44, 0.33], // Coral
  [0.00, 0.81, 0.79], // Cyan
  [1.00, 0.46, 0.46], // Red
  [0.64, 0.61, 1.00], // Lavender
  [0.33, 0.64, 1.00]  // Blue
]

// Agent class
export class Agent {
  constructor(noa, house, options = {}) {
    this.noa = noa
    this.house = house
    this.id = options.id || `agent-${Date.now()}`
    this.name = options.name || `Agent ${Math.floor(Math.random() * 100)}`

    // State
    this.state = AgentState.IDLE
    this.currentTask = null
    this.taskBubbleText = ''

    // Position near house door
    this.position = {
      x: house.doorPosition.x,
      y: house.doorPosition.y + 0.1,
      z: house.doorPosition.z
    }
    this.targetPosition = { ...this.position }
    this.speed = 0.08 + Math.random() * 0.04

    // Animation state
    this.walkCycle = 0
    this.bobCycle = 0
    this.particleTimer = 0

    // Visual color
    this.colorIndex = Math.floor(Math.random() * AGENT_COLORS.length)
    this.color = AGENT_COLORS[this.colorIndex]

    // Create visual mesh
    this.createMesh()

    // Timers
    this.stateTimer = 0
    this.moveTimer = 2 + Math.random() * 3
  }

  /**
   * Create the Babylon.js mesh for this agent
   */
  createMesh() {
    const scene = this.noa.rendering.getScene()

    // Create agent mesh group
    this.mesh = new BABYLON.TransformNode('agent-' + this.id, scene)

    // Materials
    const bodyMat = new BABYLON.StandardMaterial('bodyMat-' + this.id, scene)
    bodyMat.diffuseColor = new BABYLON.Color3(...this.color)
    bodyMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1)

    const skinMat = new BABYLON.StandardMaterial('skinMat-' + this.id, scene)
    skinMat.diffuseColor = new BABYLON.Color3(1, 0.8, 0.6)
    skinMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1)

    const eyeMat = new BABYLON.StandardMaterial('eyeMat-' + this.id, scene)
    eyeMat.diffuseColor = new BABYLON.Color3(1, 1, 1)
    eyeMat.emissiveColor = new BABYLON.Color3(0.3, 0.3, 0.3)

    const legMat = new BABYLON.StandardMaterial('legMat-' + this.id, scene)
    legMat.diffuseColor = new BABYLON.Color3(...this.color).scale(0.8)
    legMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1)

    // Body
    const body = BABYLON.MeshBuilder.CreateBox('body', {
      width: 0.5,
      height: 0.7,
      depth: 0.3
    }, scene)
    body.position.y = 0.85
    body.material = bodyMat
    body.parent = this.mesh

    // Head
    const head = BABYLON.MeshBuilder.CreateBox('head', {
      width: 0.4,
      height: 0.4,
      depth: 0.4
    }, scene)
    head.position.y = 1.4
    head.material = skinMat
    head.parent = this.mesh
    this.headMesh = head

    // Hat
    const hat = BABYLON.MeshBuilder.CreateBox('hat', {
      width: 0.45,
      height: 0.12,
      depth: 0.45
    }, scene)
    hat.position.y = 1.66
    hat.material = bodyMat
    hat.parent = this.mesh

    // Eyes
    const eye1 = BABYLON.MeshBuilder.CreateBox('eye1', {
      width: 0.08,
      height: 0.08,
      depth: 0.02
    }, scene)
    eye1.position.set(-0.1, 1.45, 0.21)
    eye1.material = eyeMat
    eye1.parent = this.mesh

    const eye2 = BABYLON.MeshBuilder.CreateBox('eye2', {
      width: 0.08,
      height: 0.08,
      depth: 0.02
    }, scene)
    eye2.position.set(0.1, 1.45, 0.21)
    eye2.material = eyeMat
    eye2.parent = this.mesh

    // Legs
    this.leftLeg = BABYLON.MeshBuilder.CreateBox('leftLeg', {
      width: 0.18,
      height: 0.5,
      depth: 0.18
    }, scene)
    this.leftLeg.position.set(-0.12, 0.25, 0)
    this.leftLeg.material = legMat
    this.leftLeg.parent = this.mesh

    this.rightLeg = BABYLON.MeshBuilder.CreateBox('rightLeg', {
      width: 0.18,
      height: 0.5,
      depth: 0.18
    }, scene)
    this.rightLeg.position.set(0.12, 0.25, 0)
    this.rightLeg.material = legMat
    this.rightLeg.parent = this.mesh

    // Position mesh
    this.mesh.position.set(this.position.x, this.position.y, this.position.z)

    // Create simple particle emitters for states
    this.createParticles(scene)
  }

  /**
   * Create particle systems for different states
   */
  createParticles(scene) {
    // Thinking particles (yellow)
    this.thinkingParticles = new BABYLON.ParticleSystem('thinking-' + this.id, 20, scene)
    this.thinkingParticles.emitter = this.mesh
    this.thinkingParticles.minEmitBox = new BABYLON.Vector3(-0.2, 1.8, -0.2)
    this.thinkingParticles.maxEmitBox = new BABYLON.Vector3(0.2, 2.0, 0.2)
    this.thinkingParticles.color1 = new BABYLON.Color4(1, 1, 0.3, 1)
    this.thinkingParticles.color2 = new BABYLON.Color4(1, 0.8, 0, 1)
    this.thinkingParticles.colorDead = new BABYLON.Color4(1, 0.6, 0, 0)
    this.thinkingParticles.minSize = 0.08
    this.thinkingParticles.maxSize = 0.15
    this.thinkingParticles.minLifeTime = 0.4
    this.thinkingParticles.maxLifeTime = 0.8
    this.thinkingParticles.emitRate = 5
    this.thinkingParticles.direction1 = new BABYLON.Vector3(-0.3, 0.5, -0.3)
    this.thinkingParticles.direction2 = new BABYLON.Vector3(0.3, 1, 0.3)
    this.thinkingParticles.gravity = new BABYLON.Vector3(0, -0.5, 0)

    // Success particles (green)
    this.successParticles = new BABYLON.ParticleSystem('success-' + this.id, 50, scene)
    this.successParticles.emitter = this.mesh
    this.successParticles.minEmitBox = new BABYLON.Vector3(-0.5, 0, -0.5)
    this.successParticles.maxEmitBox = new BABYLON.Vector3(0.5, 1.5, 0.5)
    this.successParticles.color1 = new BABYLON.Color4(0.2, 1, 0.4, 1)
    this.successParticles.color2 = new BABYLON.Color4(0.5, 1, 0.3, 1)
    this.successParticles.colorDead = new BABYLON.Color4(0, 0.5, 0, 0)
    this.successParticles.minSize = 0.05
    this.successParticles.maxSize = 0.12
    this.successParticles.minLifeTime = 0.3
    this.successParticles.maxLifeTime = 0.7
    this.successParticles.emitRate = 0
    this.successParticles.direction1 = new BABYLON.Vector3(-1, 2, -1)
    this.successParticles.direction2 = new BABYLON.Vector3(1, 3, 1)
    this.successParticles.gravity = new BABYLON.Vector3(0, -2, 0)

    // Error particles (red)
    this.errorParticles = new BABYLON.ParticleSystem('error-' + this.id, 30, scene)
    this.errorParticles.emitter = this.mesh
    this.errorParticles.minEmitBox = new BABYLON.Vector3(-0.3, 1.6, -0.3)
    this.errorParticles.maxEmitBox = new BABYLON.Vector3(0.3, 1.8, 0.3)
    this.errorParticles.color1 = new BABYLON.Color4(1, 0.2, 0.2, 1)
    this.errorParticles.color2 = new BABYLON.Color4(1, 0.4, 0.1, 1)
    this.errorParticles.colorDead = new BABYLON.Color4(0.5, 0, 0, 0)
    this.errorParticles.minSize = 0.08
    this.errorParticles.maxSize = 0.15
    this.errorParticles.minLifeTime = 0.4
    this.errorParticles.maxLifeTime = 0.8
    this.errorParticles.emitRate = 0
    this.errorParticles.direction1 = new BABYLON.Vector3(-0.5, 0.3, -0.5)
    this.errorParticles.direction2 = new BABYLON.Vector3(0.5, 0.8, 0.5)
    this.errorParticles.gravity = new BABYLON.Vector3(0, 0.5, 0)
  }

  /**
   * Set agent state
   */
  setState(newState, data = {}) {
    const oldState = this.state
    this.state = newState
    this.stateTimer = 0

    // Stop all particles
    this.thinkingParticles.stop()
    this.successParticles.stop()
    this.errorParticles.stop()

    // Handle state transitions
    switch (newState) {
      case AgentState.THINKING:
        this.thinkingParticles.start()
        break

      case AgentState.WORKING:
        this.currentTask = data.task || 'Working...'
        break

      case AgentState.SUCCESS:
        this.successParticles.emitRate = 80
        this.successParticles.start()
        setTimeout(() => {
          this.successParticles.stop()
          if (this.state === AgentState.SUCCESS) {
            this.setState(AgentState.IDLE)
          }
        }, 2000)
        break

      case AgentState.ERROR:
        this.errorParticles.emitRate = 40
        this.errorParticles.start()
        setTimeout(() => {
          this.errorParticles.stop()
          if (this.state === AgentState.ERROR) {
            this.setState(AgentState.IDLE)
          }
        }, 2000)
        break

      case AgentState.WALKING:
        this.targetPosition = data.target || this.targetPosition
        break
    }

    console.log(`Agent ${this.id}: ${oldState} -> ${newState}`)
  }

  /**
   * Start a task
   */
  startTask(taskName) {
    this.taskBubbleText = taskName
    this.setState(AgentState.WORKING, { task: taskName })
  }

  /**
   * Complete current task
   */
  completeTask() {
    this.taskBubbleText = ''
    this.currentTask = null
    this.setState(AgentState.SUCCESS)
  }

  /**
   * Fail current task
   */
  failTask(error) {
    this.taskBubbleText = ''
    this.currentTask = null
    this.setState(AgentState.ERROR, { error })
  }

  /**
   * Update agent each frame
   */
  update(dt) {
    this.stateTimer += dt

    switch (this.state) {
      case AgentState.IDLE:
        this.updateIdle(dt)
        break
      case AgentState.THINKING:
        this.updateThinking(dt)
        break
      case AgentState.WORKING:
        this.updateWorking(dt)
        break
      case AgentState.WALKING:
        this.updateWalking(dt)
        break
      case AgentState.SUCCESS:
        this.updateSuccess(dt)
        break
      case AgentState.ERROR:
        this.updateError(dt)
        break
    }

    // Update mesh position
    this.mesh.position.set(this.position.x, this.position.y, this.position.z)
  }

  updateIdle(dt) {
    // Gentle bobbing
    this.bobCycle += dt * 2
    this.position.y = this.house.doorPosition.y + 0.1 + Math.sin(this.bobCycle) * 0.02

    // Occasionally walk to a new spot
    this.moveTimer -= dt
    if (this.moveTimer <= 0) {
      const angle = Math.random() * Math.PI * 2
      const dist = 2 + Math.random() * 4
      this.targetPosition = {
        x: this.house.x + this.house.width / 2 + Math.cos(angle) * dist,
        y: this.position.y,
        z: this.house.z + this.house.depth / 2 + Math.sin(angle) * dist
      }
      this.setState(AgentState.WALKING, { target: this.targetPosition })
      this.moveTimer = 3 + Math.random() * 4
    }
  }

  updateThinking(dt) {
    // Look around
    this.bobCycle += dt * 3
    if (this.headMesh) {
      this.headMesh.rotation.y = Math.sin(this.bobCycle) * 0.3
      this.headMesh.rotation.x = Math.sin(this.bobCycle * 0.7) * 0.1
    }
  }

  updateWorking(dt) {
    // Bouncing animation
    this.bobCycle += dt * 8
    this.position.y = this.house.doorPosition.y + 0.1 + Math.abs(Math.sin(this.bobCycle)) * 0.05
  }

  updateWalking(dt) {
    const dx = this.targetPosition.x - this.position.x
    const dz = this.targetPosition.z - this.position.z
    const dist = Math.sqrt(dx * dx + dz * dz)

    if (dist > 0.2) {
      // Move towards target
      this.position.x += (dx / dist) * this.speed
      this.position.z += (dz / dist) * this.speed

      // Face movement direction
      this.mesh.rotation.y = Math.atan2(dx, dz)

      // Walk animation
      this.walkCycle += dt * 10
      const swing = Math.sin(this.walkCycle) * 0.5
      this.leftLeg.rotation.x = swing
      this.rightLeg.rotation.x = -swing
    } else {
      // Arrived
      this.leftLeg.rotation.x = 0
      this.rightLeg.rotation.x = 0
      this.setState(AgentState.IDLE)
    }
  }

  updateSuccess(dt) {
    // Jump animation
    this.bobCycle += dt * 15
    const jump = Math.abs(Math.sin(this.bobCycle)) * 0.3
    this.position.y = this.house.doorPosition.y + 0.1 + jump
  }

  updateError(dt) {
    // Head shake
    this.bobCycle += dt * 20
    if (this.headMesh) {
      this.headMesh.rotation.y = Math.sin(this.bobCycle) * 0.4
    }
  }

  /**
   * Dispose of agent resources
   */
  dispose() {
    this.thinkingParticles.dispose()
    this.successParticles.dispose()
    this.errorParticles.dispose()
    this.mesh.dispose()
  }
}

/**
 * Agent manager - handles all agents in the world
 */
export class AgentManager {
  constructor(noa) {
    this.noa = noa
    this.agents = new Map()
  }

  /**
   * Create a new agent
   */
  createAgent(house, options = {}) {
    const agent = new Agent(this.noa, house, options)
    this.agents.set(agent.id, agent)
    house.agents.push(agent)
    return agent
  }

  /**
   * Get agent by ID
   */
  getAgent(id) {
    return this.agents.get(id)
  }

  /**
   * Update all agents
   */
  update(dt) {
    for (const agent of this.agents.values()) {
      agent.update(dt)
    }
  }

  /**
   * Get agent count
   */
  get count() {
    return this.agents.size
  }

  /**
   * Get all agents
   */
  getAll() {
    return Array.from(this.agents.values())
  }
}
