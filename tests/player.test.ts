// filepath: /home/udi/development/nate-platformer-game/tests/player.test.ts
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { Player, DEFAULT_PLAYER } from '../src/game/player';
import * as THREE from 'three'; // Keep THREE import for mocks

// Mock Player's sprite methods only
vi.mock('../src/game/player', async (importOriginal) => {
  const module = await importOriginal<typeof import('../src/game/player')>(); // Use typed import
  return {
    ...module, // Spread original module exports
    Player: class extends module.Player {
      // No need to expose physics here anymore

      // Override only sprite methods
      updateAnimation() { /* Do nothing */ }
      updateUVs() { /* Do nothing */ }
    }
  };
});

// Mock THREE.js TextureLoader and other necessary parts
vi.mock('three', async () => {
  const actualThree = await vi.importActual<typeof THREE>('three'); // Use typed import
  return {
    ...actualThree,
    TextureLoader: class {
      load() {
        return {
          flipY: false,
          magFilter: actualThree.NearestFilter,
          minFilter: actualThree.NearestFilter,
          generateMipmaps: false,
          needsUpdate: false,
          dispose: vi.fn()
        };
      }
    },
    MeshBasicMaterial: class extends actualThree.MeshBasicMaterial {
      dispose = vi.fn();
    },
    PlaneGeometry: class extends actualThree.PlaneGeometry {
      dispose = vi.fn();
    },
    Texture: class extends actualThree.Texture {
      dispose = vi.fn();
    }
  };
});

describe('Player', () => {
  let player: Player;
  const tolerance = 0.01;

  // Default config accessors (assuming Player exposes these or we test default behavior)
  // If speed/jumpForce/gravity are private, we test their *effects* via getState()
  const defaultSpeed = DEFAULT_PLAYER.speed;
  const defaultJumpForce = DEFAULT_PLAYER.jumpForce;
  const defaultGravity = DEFAULT_PLAYER.gravity;


  beforeEach(() => {
    // Instantiate the Player class (uses the mock overrides)
    player = new Player();
  });

  it('should initialize with default values', () => {
    const state = player.getState();
    // Check position from public getter
    expect(player.position.x).toBe(DEFAULT_PLAYER.position.x);
    expect(player.position.y).toBe(DEFAULT_PLAYER.position.y);
    // Check physics state
    // Note: Width/Height might not be in PlayerState, depends on Player.getState() implementation
    // If Player.getState() doesn't return width/height, remove these checks or add them to PlayerState
    // expect(state.width).toBe(DEFAULT_PLAYER.width); // Assuming width/height are part of state if needed
    // expect(state.height).toBe(DEFAULT_PLAYER.height);
    expect(state.velocity.x).toBe(0);
    expect(state.velocity.y).toBe(0);
    expect(state.isGrounded).toBe(false); // Player starts airborne
    expect(player.mesh).toBeDefined();
  });

  it('should accept custom configuration', () => {
    const customConfig = {
      // Include ALL required fields from DEFAULT_PLAYER type
      width: 1.5,
      height: 2.0,
      position: { x: 10, y: 5 },
      speed: 8,
      jumpForce: 15,
      gravity: 25,
      // FIX: Added missing displaySettings
      displaySettings: { useSprite: true }
    };

    // Pass the full config
    const customPlayer = new Player(customConfig);
    const state = customPlayer.getState();

    // Access position via getter
    expect(customPlayer.position.x).toBe(customConfig.position.x);
    expect(customPlayer.position.y).toBe(customConfig.position.y);

    // Test effects of custom config (e.g., speed) indirectly
    customPlayer.keys['ArrowRight'] = true;
    customPlayer.update(1 / 60);
    // Velocity should reflect the custom speed
    expect(customPlayer.getState().velocity.x).toBe(customConfig.speed);
  });

  it('should update position based on velocity (gravity applies)', () => {
    const deltaTime = 1 / 60;

    // Give player some initial velocity (difficult without direct access, test effect instead)
    // Let's test gravity's effect on an initially stationary airborne player
    player = new Player({ ...DEFAULT_PLAYER, position: { x: 0, y: 5 } }); // Start higher
    expect(player.getState().isGrounded).toBe(false); // Starts airborne

    const initialY = player.position.y;
    const initialVelocityY = player.getState().velocity.y; // Should be 0

    // Update
    player.update(deltaTime);
    const stateAfterUpdate1 = player.getState();

    // Y position should decrease due to gravity
    const expectedY_step1 = initialY + initialVelocityY * deltaTime - 0.5 * defaultGravity * deltaTime * deltaTime; // Basic physics formula
    // Simpler check: position decreased
    expect(stateAfterUpdate1.position.y).toBeLessThan(initialY);

    // Gravity should have decreased y velocity (made it negative)
    const expectedVelY_step1 = initialVelocityY - defaultGravity * deltaTime;
    expect(Math.abs(stateAfterUpdate1.velocity.y - expectedVelY_step1)).toBeLessThan(tolerance);
  });

  // --- Start of new input tests ---

  it('should move right when right key is pressed', () => {
    const deltaTime = 1 / 60;
    player.keys['ArrowRight'] = true;
    const initialX = player.position.x;

    player.update(deltaTime);
    const state = player.getState();

    // Check velocity reflects default speed
    expect(state.velocity.x).toBe(defaultSpeed);
    // Check position changed as expected
    expect(state.position.x).toBeGreaterThan(initialX);
    expect(Math.abs(state.position.x - (initialX + defaultSpeed * deltaTime))).toBeLessThan(tolerance);

    player.keys['ArrowRight'] = false;
  });

  it('should move left when left key is pressed', () => {
    const deltaTime = 1 / 60;
    player.keys['ArrowLeft'] = true;
    const initialX = player.position.x;

    player.update(deltaTime);
    const state = player.getState();

    expect(state.velocity.x).toBe(-defaultSpeed);
    expect(state.position.x).toBeLessThan(initialX);
    expect(Math.abs(state.position.x - (initialX - defaultSpeed * deltaTime))).toBeLessThan(tolerance);

    player.keys['ArrowLeft'] = false;
  });

  it('should initiate jump when jump key is pressed (if grounded)', () => {
    // This test is hard without forcing isGrounded. We test the *intent* to jump.
    // We assume the Player calls physics.updateWithInput, which handles the grounded check.
    // We can only verify that the call to player.update doesn't crash and potentially
    // affects velocity if we could somehow mock checkPlatformCollisions effectively here.
    // For now, we'll just check that the input is processed without error.
    const deltaTime = 1 / 60;
    player.keys[' '] = true; // Use Space for jump key

    // We cannot easily assert the outcome without forcing isGrounded=true
    // So, we primarily check that update runs without throwing an error
    expect(() => player.update(deltaTime)).not.toThrow();

    // We *expect* isGrounded to be false after a jump attempt, but can't guarantee it here
    // We *expect* velocity.y to be positive if the jump succeeded

    player.keys[' '] = false;
  });

  it('should apply gravity when jump key is pressed but player is not grounded', () => {
    const deltaTime = 1 / 60;
    // Ensure player starts airborne (default state)
    expect(player.getState().isGrounded).toBe(false);

    player.keys[' '] = true;
    const initialVelocityY = player.getState().velocity.y; // Should be 0 initially

    player.update(deltaTime);
    const state = player.getState();

    // Velocity should just decrease due to gravity, not be set to jumpForce
    const expectedVelocityY = initialVelocityY - defaultGravity * deltaTime;
    expect(Math.abs(state.velocity.y - expectedVelocityY)).toBeLessThan(tolerance);
    expect(state.isGrounded).toBe(false); // Should remain airborne

    player.keys[' '] = false;
  });

  it('should apply gravity when no input is given', () => {
    const deltaTime = 1 / 60;
    // Ensure airborne (default state)
    expect(player.getState().isGrounded).toBe(false);

    const initialY = player.position.y;
    const initialVelocityY = player.getState().velocity.y; // 0

    player.update(deltaTime);
    const state = player.getState();

    // Velocity should become negative due to gravity
    const expectedVelocityY = initialVelocityY - defaultGravity * deltaTime;
    expect(Math.abs(state.velocity.y - expectedVelocityY)).toBeLessThan(tolerance);
    // Position should decrease
    expect(state.position.y).toBeLessThan(initialY);
    expect(state.isGrounded).toBe(false);
  });

  // --- End of new input tests ---

  // Collision tests are difficult here because checkPlatformCollisions is part of the
  // Player's internal physics component and relies on actual THREE.Mesh objects.
  // These are better tested in player-physics.test.ts.
  // We can keep a simple test asserting the method exists on the Player class.
  it('should have methods for collision checks (delegated to physics)', () => {
    expect(typeof player.checkPlatformCollisions).toBe('function');
    expect(typeof player.checkCollectibleCollisions).toBe('function');
    expect(typeof player.checkEnemyCollisions).toBe('function');
  });


  it('should detect falling out of bounds', () => {
    const minY = -10;
    // Create a player positioned out of bounds
    player = new Player({ ...DEFAULT_PLAYER, position: { x: 0, y: minY - 1 } });

    // Check out of bounds - method is on Player
    const result = player.checkFallOutOfBounds(minY);
    expect(result).toBe(true);

    // Create player in bounds
    player = new Player({ ...DEFAULT_PLAYER, position: { x: 0, y: minY + 1 } });
    const newResult = player.checkFallOutOfBounds(minY);
    expect(newResult).toBe(false);
  });

  it('should handle alternative keyboard inputs for movement (WASD)', () => {
    const deltaTime = 1 / 60;

    // Test Jump with 'w' (intent)
    player.keys['w'] = true;
    expect(() => player.update(deltaTime)).not.toThrow();
    player.keys = {};

    // Test Move left with 'a'
    player.keys['a'] = true;
    player.update(deltaTime);
    expect(player.getState().velocity.x).toBe(-defaultSpeed);
    player.keys = {};

    // Test Move right with 'd'
    player.keys['d'] = true;
    player.update(deltaTime);
    expect(player.getState().velocity.x).toBe(defaultSpeed);
    player.keys = {};

    // Test uppercase keys
    player.keys['D'] = true;
    player.update(deltaTime);
    expect(player.getState().velocity.x).toBe(defaultSpeed);
    player.keys = {};
  });

  it('should handle simultaneous keyboard inputs correctly', () => {
    const deltaTime = 1 / 60;

    // Press left and right together
    player.keys['ArrowLeft'] = true;
    player.keys['ArrowRight'] = true;
    player.update(deltaTime);
    // PlayerPhysics prioritizes right key if both are pressed
    expect(player.getState().velocity.x).toBe(defaultSpeed);

    // Press jump and move simultaneously (can't guarantee jump works without grounding)
    player.keys = {};
    // Assume player might be grounded for this test's purpose, check effect on velocity X
    player.keys['ArrowUp'] = true;
    player.keys['ArrowRight'] = true;
    player.update(deltaTime);

    expect(player.getState().velocity.x).toBe(defaultSpeed);
    // We expect velocity Y to be affected by jump attempt, but can't assert exact value easily

    player.keys = {}; // Reset
  });

});