import { describe, expect, it, beforeEach, vi } from 'vitest';
import { EnemyPhysics, EnemyMovementType } from '../src/game/physics/enemy-physics';
import * as THREE from 'three';

// Helper to create mock platforms easily
function createMockPlatform(x: number, y: number, width: number, height: number): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(width, height);
  // Using MeshBasicMaterial as it requires no lighting setup
  const material = new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
  const platform = new THREE.Mesh(geometry, material);
  platform.position.set(x, y, 0);
  // Attach geometry dimensions directly for easier access in tests if needed
  (platform as any).geometryParams = { width, height };
  return platform;
}

describe('EnemyPhysics', () => {
  let physics: EnemyPhysics;
  const tolerance = 0.5; // Increase tolerance for floating point comparisons

  // Default configuration for testing
  const defaultConfig = {
    width: 0.7,
    height: 0.7,
    position: { x: 0, y: 0.75 }, // Start slightly above ground for grounding test
    speed: 2,
    gravity: 20,
    moveType: 'horizontal' as EnemyMovementType,
    moveRange: 5
  };

  // Mock platform for grounding tests
  const groundPlatform = createMockPlatform(0, 0, 10, 0.5);

  beforeEach(() => {
    physics = new EnemyPhysics(
      defaultConfig.width,
      defaultConfig.height,
      defaultConfig.position,
      defaultConfig.speed,
      defaultConfig.gravity,
      defaultConfig.moveType,
      defaultConfig.moveRange
    );
    
    // Place enemy directly on the ground to ensure it's grounded initially
    const expectedY = groundPlatform.position.y + 
                     (groundPlatform.geometry as THREE.PlaneGeometry).parameters.height / 2 + 
                     defaultConfig.height / 2;
    (physics as any).position.y = expectedY;
    
    // Ensure enemy is grounded for movement tests
    physics.checkPlatformCollisions([groundPlatform]);
    physics.updateEnemy(0); // Apply initial grounding
    
    // Verify grounded before movement tests
    expect(physics.getState().isGrounded).toBe(true); 
  });

  it('should initialize with the correct values', () => {
    // Re-initialize for this specific test to check pre-grounding state
    physics = new EnemyPhysics(
      defaultConfig.width,
      defaultConfig.height,
      defaultConfig.position,
      defaultConfig.speed,
      defaultConfig.gravity,
      defaultConfig.moveType,
      defaultConfig.moveRange
    );
    const state = physics.getState();

    expect(state.width).toBe(defaultConfig.width);
    expect(state.height).toBe(defaultConfig.height);
    expect(state.position.x).toBe(defaultConfig.position.x);
    expect(state.position.y).toBe(defaultConfig.position.y);
    expect(state.velocity.x).toBe(0); // Initial velocity x is 0
    expect(state.velocity.y).toBe(0); // Initial velocity y is 0
    expect(state.isGrounded).toBe(false); // Starts airborne
    expect(state.facingLeft).toBe(false); // Starts facing right by default
  });

  it('should handle horizontal movement correctly and stay grounded', () => {
    const deltaTime = 1 / 60;
    const initialY = physics.getState().position.y;

    // Update several times
    for (let i = 0; i < 10; i++) {
      physics.updateEnemy(deltaTime);
      physics.checkPlatformCollisions([groundPlatform]); // Re-check collisions
    }

    const state = physics.getState();
    expect(state.velocity.x).not.toBe(0); // Should be moving horizontally
    expect(state.isGrounded).toBe(true); // Should remain grounded
    expect(state.position.y).toBeCloseTo(initialY, tolerance); // Y position should be stable on the ground
  });

  it('should handle stationary enemy correctly', () => {
    const stationaryPhysics = new EnemyPhysics(
      defaultConfig.width,
      defaultConfig.height,
      defaultConfig.position,
      defaultConfig.speed,
      defaultConfig.gravity,
      'stationary',
      0
    );
    // Ground the stationary enemy
    stationaryPhysics.checkPlatformCollisions([groundPlatform]);
    stationaryPhysics.updateEnemy(0);

    const deltaTime = 1 / 60;
    const initialPosition = { ...stationaryPhysics.getState().position }; // Copy initial position

    // Update several times
    for (let i = 0; i < 10; i++) {
      stationaryPhysics.updateEnemy(deltaTime);
      stationaryPhysics.checkPlatformCollisions([groundPlatform]);
    }

    const finalState = stationaryPhysics.getState();
    expect(finalState.position.x).toBe(initialPosition.x); // X should not change
    expect(finalState.position.y).toBeCloseTo(initialPosition.y, tolerance); // Y should be stable
    expect(finalState.velocity.x).toBe(0);
    expect(finalState.isMoving).toBe(false);
  });

  it('should reverse direction upon reaching movement bounds', () => {
    const moveRange = 2; // Use a small range for quicker testing
    const speed = 1;
    const testPhysics = new EnemyPhysics(
      defaultConfig.width, defaultConfig.height, { x: 0, y: 1 }, // Start at center (x=0)
      speed, defaultConfig.gravity, 'horizontal', moveRange
    );
    testPhysics.checkPlatformCollisions([groundPlatform]); // Ground it
    testPhysics.updateEnemy(0);

    const deltaTime = 1 / 60;
    const initialDirection = Math.sign(testPhysics.getState().velocity.x) || 1; // Assume starts moving right if velocity is 0 initially
    const boundary = initialDirection > 0
      ? defaultConfig.position.x + moveRange / 2
      : defaultConfig.position.x - moveRange / 2;
    const distanceToBoundary = Math.abs(boundary - testPhysics.getState().position.x);
    const timeToReachBoundary = distanceToBoundary / speed;

    let elapsedTime = 0;
    let directionReversed = false;
    const maxTestTime = timeToReachBoundary * 1.5; // Allow some buffer time

    while (elapsedTime < maxTestTime) {
      testPhysics.updateEnemy(deltaTime);
      testPhysics.checkPlatformCollisions([groundPlatform]);
      elapsedTime += deltaTime;

      const currentDirection = Math.sign(testPhysics.getState().velocity.x);
      if (currentDirection === -initialDirection) {
        directionReversed = true;
        break;
      }
    }

    expect(directionReversed, `Direction did not reverse within expected time`).toBe(true);
    // Check that the reversal happened near the expected time
    expect(elapsedTime).toBeGreaterThan(timeToReachBoundary * 0.8);
    expect(elapsedTime).toBeLessThan(timeToReachBoundary * 1.2);
  });


  it('should handle vertical falling correctly when not grounded', () => {
    const airbornePhysics = new EnemyPhysics(
      defaultConfig.width, defaultConfig.height, { x: 0, y: 5 }, // Start high up
      defaultConfig.speed, defaultConfig.gravity, 'horizontal', 5
    );

    const deltaTime = 1 / 60;
    const initialY = airbornePhysics.getState().position.y;
    const initialVelocityY = airbornePhysics.getState().velocity.y;

    // Update for a few frames
    for (let i = 0; i < 10; i++) {
      airbornePhysics.updateEnemy(deltaTime);
    }

    const state = airbornePhysics.getState();
    // Should have fallen due to gravity
    expect(state.position.y).toBeLessThan(initialY);
    expect(state.velocity.y).toBeLessThan(initialVelocityY); // Velocity should decrease (become more negative)
    expect(state.isGrounded).toBe(false);
  });
});