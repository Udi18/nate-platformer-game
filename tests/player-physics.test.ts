import { describe, expect, it, beforeEach, vi } from 'vitest'
import { PlayerPhysics } from '../src/game/physics/player-physics'
import * as THREE from 'three'
import { Collectible } from '../src/game/collectibles'
import { Enemy } from '../src/game/enemies'

// Mock collectible and enemy classes
vi.mock('../src/game/collectibles', () => {
  return {
    Collectible: class MockCollectible {
      mesh: THREE.Mesh
      position: { x: number; y: number }
      radius: number
      isCollected: boolean
      
      constructor(x: number, y: number) {
        this.position = { x, y }
        this.radius = 0.5
        this.isCollected = false
        
        // Create a basic mesh
        const geometry = new THREE.CircleGeometry(0.5, 16)
        const material = new THREE.MeshBasicMaterial()
        this.mesh = new THREE.Mesh(geometry, material)
        this.updateMeshPosition()
      }
      
      updateMeshPosition() {
        this.mesh.position.set(this.position.x, this.position.y, 0)
      }
      
      collect() {
        this.isCollected = true
      }
    }
  }
})

vi.mock('../src/game/enemies', () => {
  return {
    Enemy: class MockEnemy {
      mesh: THREE.Mesh
      position: { x: number; y: number }
      width: number
      height: number
      physics: any
      
      constructor(x: number, y: number) {
        this.position = { x, y }
        this.width = 0.7
        this.height = 0.7
        this.physics = {
          position: this.position
        }
        
        // Create a basic mesh
        const geometry = new THREE.PlaneGeometry(this.width, this.height)
        const material = new THREE.MeshBasicMaterial()
        this.mesh = new THREE.Mesh(geometry, material)
        this.updateMeshPosition()
      }
      
      updateMeshPosition() {
        this.mesh.position.set(this.position.x, this.position.y, 0)
      }
      
      update(deltaTime: number) {
        // Mock update method
      }
      
      checkPlatformCollisions(platforms: THREE.Mesh[]) {
        // Mock collision method
      }
    }
  }
})

describe('PlayerPhysics', () => {
  let physics: PlayerPhysics
  
  // Default configuration for testing
  const defaultConfig = {
    width: 1.25,
    height: 1.25,
    position: { x: 0, y: 0 },
    speed: 5,
    jumpForce: 10,
    gravity: 20
  }
  
  beforeEach(() => {
    physics = new PlayerPhysics(
      defaultConfig.width,
      defaultConfig.height,
      defaultConfig.position,
      defaultConfig.speed,
      defaultConfig.jumpForce,
      defaultConfig.gravity
    )
  })
  
  it('should initialize with the correct values', () => {
    const state = physics.getState()
    
    expect(state.width).toBe(defaultConfig.width)
    expect(state.height).toBe(defaultConfig.height)
    expect(state.position.x).toBe(defaultConfig.position.x)
    expect(state.position.y).toBe(defaultConfig.position.y)
    expect(state.velocity.x).toBe(0)
    expect(state.velocity.y).toBe(0)
    expect(state.isGrounded).toBe(false)
    expect(state.isMoving).toBe(false)
  })
  
  it('should update position based on velocity', () => {
    const keys = {}
    const deltaTime = 1/60 // Simulating 60fps
    
    // Set initial velocity
    physics.updateWithInput(keys, deltaTime) // Apply gravity
    const initialState = physics.getState()
    
    // Manually calculate expected values
    const expectedY = initialState.position.y + initialState.velocity.y * deltaTime
    const expectedVelocityY = initialState.velocity.y - defaultConfig.gravity * deltaTime
    
    // Update again
    physics.updateWithInput(keys, deltaTime)
    const newState = physics.getState()
    
    // Y position should be updated by velocity + gravity
    expect(newState.position.y).toBeCloseTo(expectedY, 5)
    expect(newState.velocity.y).toBeCloseTo(expectedVelocityY, 5)
  })
  
  it('should respond to movement keys', () => {
    const deltaTime = 1/60
    const keys = { 'ArrowRight': true }
    
    // Move right
    physics.updateWithInput(keys, deltaTime)
    let state = physics.getState()
    expect(state.velocity.x).toBe(defaultConfig.speed)
    expect(state.isMoving).toBe(true)
    expect(state.facingLeft).toBe(false)
    
    // Move left
    const leftKeys = { 'ArrowLeft': true }
    physics.updateWithInput(leftKeys, deltaTime)
    state = physics.getState()
    expect(state.velocity.x).toBe(-defaultConfig.speed)
    expect(state.isMoving).toBe(true)
    expect(state.facingLeft).toBe(true)
    
    // No movement keys pressed
    physics.updateWithInput({}, deltaTime)
    state = physics.getState()
    expect(state.velocity.x).toBe(0)
    expect(state.isMoving).toBe(false)
  })
  
  it('should handle jumping correctly', () => {
    const deltaTime = 1/60
    const jumpKeys = { 'ArrowUp': true }
    
    // Cannot jump when not grounded
    physics.updateWithInput(jumpKeys, deltaTime)
    let state = physics.getState()
    expect(state.velocity.y).toBeLessThan(0) // Should just have gravity applied
    expect(state.isGrounded).toBe(false)
    
    // Should jump when grounded
    // Mock being on ground
    const mockPlatform = createMockPlatform(0, -2)
    physics.checkPlatformCollisions([mockPlatform])
    
    // Now should be able to jump
    physics.updateWithInput(jumpKeys, deltaTime)
    state = physics.getState()
    expect(state.velocity.y).toBeCloseTo(defaultConfig.jumpForce, 5)
    expect(state.isGrounded).toBe(false)
  })
  
  it('should detect platform collisions', () => {
    // Put the player above a platform
    physics = new PlayerPhysics(
      defaultConfig.width,
      defaultConfig.height,
      { x: 0, y: 0 },
      defaultConfig.speed,
      defaultConfig.jumpForce,
      defaultConfig.gravity
    )
    
    // Create a platform below the player
    const platform = createMockPlatform(0, -2)
    
    // Apply gravity to move player down
    const deltaTime = 1/60
    for (let i = 0; i < 10; i++) {
      physics.updateWithInput({}, deltaTime)
    }
    
    // Check collision with platform
    physics.checkPlatformCollisions([platform])
    const state = physics.getState()
    
    // Player should now be grounded on the platform
    expect(state.isGrounded).toBe(true)
    expect(state.velocity.y).toBe(0)
  })
  
  it('should handle collectible collisions', () => {
    // Position the player at the origin
    physics = new PlayerPhysics(
      defaultConfig.width,
      defaultConfig.height,
      { x: 0, y: 0 },
      defaultConfig.speed,
      defaultConfig.jumpForce,
      defaultConfig.gravity
    )
    
    // Create mock collectibles
    const collectibles = [
      new Collectible(0, 0), // Overlapping with player (should be collected)
      new Collectible(3, 0), // Far from player (should not be collected)
      new Collectible(0.5, 0.5) // Close to player (should be collected)
    ] as Collectible[]
    
    // Check collectible collision
    const collectedIndices = physics.checkCollectibleCollisions(collectibles)
    
    // Should have collected items at index 0 and 2
    expect(collectedIndices).toContain(0)
    expect(collectedIndices).toContain(2)
    expect(collectedIndices).not.toContain(1)
    expect(collectedIndices.length).toBe(2)
  })
  
  it('should detect enemy collisions', () => {
    // Position the player at the origin
    physics = new PlayerPhysics(
      defaultConfig.width,
      defaultConfig.height,
      { x: 0, y: 0 },
      defaultConfig.speed,
      defaultConfig.jumpForce,
      defaultConfig.gravity
    )
    
    // Create mock enemies
    const enemies = [
      new Enemy(2, 2), // Far from player
      new Enemy(0.5, 0)  // Overlapping with player
    ] as Enemy[]
    
    // Check enemy collision
    const hasCollision = physics.checkEnemyCollisions(enemies)
    
    // Should detect a collision with the second enemy
    expect(hasCollision).toBe(true)
    
    // Create another set of enemies that don't collide
    const nonCollidingEnemies = [
      new Enemy(2, 2),
      new Enemy(2, -2)
    ] as Enemy[]
    
    // Check enemy collision again
    const noCollision = physics.checkEnemyCollisions(nonCollidingEnemies)
    
    // Should not detect any collisions
    expect(noCollision).toBe(false)
  })
  
  it('should check if player is out of bounds', () => {
    // Set the player position
    physics = new PlayerPhysics(
      defaultConfig.width,
      defaultConfig.height,
      { x: 0, y: -10 },
      defaultConfig.speed,
      defaultConfig.jumpForce,
      defaultConfig.gravity
    )
    
    // Check out of bounds with a boundary at y = -5
    const isOutOfBounds = physics.checkFallOutOfBounds(-5)
    
    // Player is below -5, so should be out of bounds
    expect(isOutOfBounds).toBe(true)
    
    // Change player position to be in bounds
    physics = new PlayerPhysics(
      defaultConfig.width,
      defaultConfig.height,
      { x: 0, y: 0 },
      defaultConfig.speed,
      defaultConfig.jumpForce,
      defaultConfig.gravity
    )
    
    // Check out of bounds with the same boundary
    const isInBounds = physics.checkFallOutOfBounds(-5)
    
    // Player is above -5, so should be in bounds
    expect(isInBounds).toBe(false)
  })
  
  // Helper functions to create mocks for testing
  function createMockPlatform(x: number, y: number): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(4, 1)
    const material = new THREE.MeshBasicMaterial()
    const platform = new THREE.Mesh(geometry, material)
    platform.position.set(x, y, 0)
    return platform
  }
})