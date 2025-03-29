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

  it('should detect platform collisions and become grounded', () => {
    // Start enemy higher up
    const airbornePhysics = new EnemyPhysics(
      defaultConfig.width, defaultConfig.height,
      { x: 0, y: 5 }, // Start at y=5
      defaultConfig.speed, defaultConfig.gravity, defaultConfig.moveType, defaultConfig.moveRange
    );

    const platformBelow = createMockPlatform(0, 0, 4, 1);
    const deltaTime = 1 / 60;

    // Let the enemy fall for a bit
    for (let i = 0; i < 30; i++) { // ~0.5 seconds of falling
      airbornePhysics.updateEnemy(deltaTime);
      if (airbornePhysics.getState().position.y < 1) break; // Stop if close to ground
    }

    // Check collision with the platform
    airbornePhysics.checkPlatformCollisions([platformBelow]);
    const state = airbornePhysics.getState();

    // Enemy should now be grounded on the platform
    expect(state.isGrounded).toBe(true);
    expect(state.velocity.y).toBe(0); // Vertical velocity should be zeroed

    // Y position should be at platform top + half enemy height
    const expectedY = platformBelow.position.y + (platformBelow.geometry as THREE.PlaneGeometry).parameters.height / 2 + defaultConfig.height / 2;
    expect(state.position.y).toBeCloseTo(expectedY, 2); // Use toBeCloseTo due to potential float inaccuracies
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


  it('should reverse direction when hitting a wall platform', () => {
    const speed = 2;
    const testPhysics = new EnemyPhysics(
      defaultConfig.width, defaultConfig.height, { x: 0, y: 1 },
      speed, defaultConfig.gravity, 'horizontal', 10 // Large movement range
    );
    testPhysics.checkPlatformCollisions([groundPlatform]); // Ground it
    testPhysics.updateEnemy(0);

    // Create a "wall" platform in the path
    const wallX = 1.5; // Place wall slightly to the right
    const wall = createMockPlatform(wallX + 0.5, 1, 1, 2); // Wall position x=2, width=1

    const initialDirection = Math.sign(testPhysics.getState().velocity.x) || 1;
    expect(initialDirection).toBe(1); // Should start moving right

    const wallHitPosition = wall.position.x - (wall.geometry as THREE.PlaneGeometry).parameters.width / 2 - testPhysics.getState().width / 2;
    const distanceToWall = wallHitPosition - testPhysics.getState().position.x;
    const timeToHitWall = distanceToWall / speed;

    const deltaTime = 1 / 60;
    let elapsedTime = 0;
    let directionReversed = false;
    const maxTestTime = timeToHitWall * 2; // Allow more buffer

    while (elapsedTime < maxTestTime) {
      testPhysics.updateEnemy(deltaTime);
      // Check collisions with BOTH ground and wall
      testPhysics.checkPlatformCollisions([groundPlatform, wall]);
      elapsedTime += deltaTime;

      const currentDirection = Math.sign(testPhysics.getState().velocity.x);
      if (currentDirection === -initialDirection) {
        directionReversed = true;
        break;
      }
      // Safety break if it gets stuck or goes too far past the wall
      if (testPhysics.getState().position.x > wallX + 1) break;
    }

    expect(directionReversed, `Direction did not reverse after hitting wall`).toBe(true);
    // Position should be near the wall after reversal
    expect(testPhysics.getState().position.x).toBeLessThan(wallHitPosition + 0.1);
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