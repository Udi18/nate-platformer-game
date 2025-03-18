// filepath: /home/udi/development/nate-platformer-game/tests/enemy-physics.test.ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { EnemyPhysics, EnemyMovementType } from '../src/game/physics/enemy-physics'
import * as THREE from 'three'

describe('EnemyPhysics', () => {
  let physics: EnemyPhysics
  
  // Default configuration for testing
  const defaultConfig = {
    width: 0.7,
    height: 0.7,
    position: { x: 0, y: 0 },
    speed: 2,
    gravity: 20,
    moveType: 'horizontal' as EnemyMovementType,
    moveRange: 5
  }
  
  beforeEach(() => {
    physics = new EnemyPhysics(
      defaultConfig.width,
      defaultConfig.height,
      defaultConfig.position,
      defaultConfig.speed,
      defaultConfig.gravity,
      defaultConfig.moveType,
      defaultConfig.moveRange
    )
  })
  
  it('should initialize with the correct values', () => {
    const state = physics.getState()
    
    expect(state.width).toBe(defaultConfig.width)
    expect(state.height).toBe(defaultConfig.height)
    expect(state.position.x).toBe(defaultConfig.position.x)
    expect(state.position.y).toBe(defaultConfig.position.y)
    expect(state.velocity.x).not.toBeUndefined()
    expect(state.velocity.y).toBe(0)
    expect(state.isGrounded).toBe(false)
  })
  
  it('should handle horizontal movement correctly', () => {
    // Set initial values for testing
    const horizontalPhysics = new EnemyPhysics(
      defaultConfig.width,
      defaultConfig.height,
      defaultConfig.position,
      defaultConfig.speed,
      defaultConfig.gravity,
      'horizontal',
      5
    )
    
    const deltaTime = 1/60
    
    // Update several times to observe movement pattern
    let lastX = horizontalPhysics.getState().position.x
    let directionChanges = 0
    
    // Get initial direction
    horizontalPhysics.updateEnemy(deltaTime)
    let currentDirection = Math.sign(horizontalPhysics.getState().velocity.x)
    
    // Run for a few seconds of simulated time to see direction changes
    for (let i = 0; i < 300; i++) {
      horizontalPhysics.updateEnemy(deltaTime)
      const newX = horizontalPhysics.getState().position.x
      const newDirection = Math.sign(horizontalPhysics.getState().velocity.x)
      
      // Check if position is updating
      if (i > 0) {
        expect(newX).not.toEqual(lastX)
      }
      
      // Check if direction has changed
      if (currentDirection !== newDirection && newDirection !== 0) {
        directionChanges++
        currentDirection = newDirection
      }
      
      lastX = newX
    }
    
    // Should have changed direction at least once in this time
    expect(directionChanges).toBeGreaterThan(0)
  })
  
  it('should handle stationary enemy correctly', () => {
    // Create a stationary enemy
    const stationaryPhysics = new EnemyPhysics(
      defaultConfig.width,
      defaultConfig.height,
      defaultConfig.position,
      defaultConfig.speed,
      defaultConfig.gravity,
      'stationary',
      0
    )
    
    const deltaTime = 1/60
    const initialPosition = stationaryPhysics.getState().position
    
    // Update several times
    for (let i = 0; i < 10; i++) {
      stationaryPhysics.updateEnemy(deltaTime)
    }
    
    // Position should not have changed horizontally
    const finalPosition = stationaryPhysics.getState().position
    expect(finalPosition.x).toBe(initialPosition.x)
    
    // Y position might change due to gravity until grounded
    if (!stationaryPhysics.getState().isGrounded) {
      expect(finalPosition.y).toBeLessThan(initialPosition.y)
    }
  })
  
  it('should detect platform collisions', () => {
    // Set the enemy position
    physics = new EnemyPhysics(
      defaultConfig.width,
      defaultConfig.height,
      { x: 0, y: 5 },
      defaultConfig.speed,
      defaultConfig.gravity,
      defaultConfig.moveType,
      defaultConfig.moveRange
    )
    
    // Create a platform below the enemy
    const platform = createMockPlatform(0, 0, 4, 1)
    
    // Apply gravity for a few frames to move enemy down
    const deltaTime = 1/60
    for (let i = 0; i < 10; i++) {
      physics.updateEnemy(deltaTime)
    }
    
    // Check collision with platform
    physics.checkPlatformCollisions([platform])
    const state = physics.getState()
    
    // Enemy should now be grounded on the platform
    expect(state.isGrounded).toBe(true)
    expect(state.velocity.y).toBe(0)
    
    // Y position should be at platform top + half enemy height
    const expectedY = platform.position.y + (platform.geometry as THREE.PlaneGeometry).parameters.height/2 + defaultConfig.height/2
    expect(state.position.y).toBeCloseTo(expectedY, 5)
  })
  
  it('should reverse direction when reaching movement bounds', () => {
    // Create a physics instance with small move range to test boundary behavior
    physics = new EnemyPhysics(
      defaultConfig.width,
      defaultConfig.height,
      { x: 0, y: 0 },
      defaultConfig.speed,
      defaultConfig.gravity,
      'horizontal',
      2 // Small movement range for quicker testing
    )
    
    const deltaTime = 1/60
    
    // Get initial direction
    physics.updateEnemy(deltaTime)
    const initialDirection = Math.sign(physics.getState().velocity.x)
    
    let foundReversal = false
    
    // Run for enough frames to see a direction change
    for (let i = 0; i < 200; i++) {
      physics.updateEnemy(deltaTime)
      
      // Check if direction has reversed
      const currentDirection = Math.sign(physics.getState().velocity.x)
      if (initialDirection !== 0 && currentDirection === -initialDirection) {
        foundReversal = true
        break
      }
    }
    
    // Should have detected a direction reversal
    expect(foundReversal).toBe(true)
  })
  
  it('should reverse direction when hitting a wall', () => {
    // Create physics with initial velocity
    physics = new EnemyPhysics(
      defaultConfig.width,
      defaultConfig.height,
      { x: 0, y: 0 },
      defaultConfig.speed,
      defaultConfig.gravity,
      'horizontal',
      10 // Large movement range
    )
    
    // Create a "wall" platform in the path
    const wall = createMockPlatform(2, 0, 1, 3)
    
    // Get initial direction
    physics.updateEnemy(1/60)
    const initialDirection = Math.sign(physics.getState().velocity.x)
    expect(initialDirection).not.toBe(0)
    
    // Update until collision occurs
    const deltaTime = 1/60
    let directionReversed = false
    
    for (let i = 0; i < 100; i++) {
      physics.updateEnemy(deltaTime)
      physics.checkPlatformCollisions([wall])
      
      // Check if direction has reversed due to wall collision
      const currentDirection = Math.sign(physics.getState().velocity.x)
      if (currentDirection === -initialDirection) {
        directionReversed = true
        break
      }
    }
    
    expect(directionReversed).toBe(true)
  })
  
  it('should handle vertical falling correctly', () => {
    // Create physics with no platform below
    physics = new EnemyPhysics(
      defaultConfig.width,
      defaultConfig.height,
      { x: 0, y: 5 },
      defaultConfig.speed,
      defaultConfig.gravity,
      'horizontal',
      5
    )
    
    const deltaTime = 1/60
    const initialY = physics.getState().position.y
    
    // Update for a few frames
    for (let i = 0; i < 10; i++) {
      physics.updateEnemy(deltaTime)
    }
    
    // Should have fallen due to gravity
    expect(physics.getState().position.y).toBeLessThan(initialY)
    expect(physics.getState().velocity.y).toBeLessThan(0)
    expect(physics.getState().isGrounded).toBe(false)
  })
  
  // Helper functions
  function createMockPlatform(x: number, y: number, width: number, height: number): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(width, height)
    const material = new THREE.MeshBasicMaterial()
    const platform = new THREE.Mesh(geometry, material)
    platform.position.set(x, y, 0)
    return platform
  }
})