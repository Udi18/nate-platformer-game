// filepath: /home/udi/development/nate-platformer-game/tests/player-physics.test.ts
// FIX: Use explicit imports from vitest
import { describe, expect, it, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { PlayerPhysics } from '../src/game/physics/player-physics';
import { Collectible } from '../src/game/collectibles';
import { Enemy } from '../src/game/enemies';

// --- Mocks ---
vi.mock('../src/game/collectibles', () => {
  // Use an actual THREE type from the import
  class MockGeometry extends THREE.CircleGeometry { dispose = vi.fn(); }
  class MockMaterial extends THREE.MeshBasicMaterial { dispose = vi.fn(); }
  class MockMesh extends THREE.Mesh { /* Add necessary overrides if needed */ }

  return {
    Collectible: class MockCollectible {
      mesh: THREE.Mesh;
      position: { x: number; y: number };
      radius: number;
      isCollected: boolean;

      constructor(definition: { radius: number; position: { x: number; y: number }; color?: number }) {
        this.position = { ...definition.position };
        this.radius = definition.radius || 0.5;
        this.isCollected = false;

        const geometry = new MockGeometry(this.radius, 16);
        const material = new MockMaterial();
        // Use the imported THREE.Mesh constructor
        this.mesh = new MockMesh(geometry, material);
        this.updateMeshPosition();
      }
      updateMeshPosition() { this.mesh.position.set(this.position.x, this.position.y, 0); }
      collect() { this.isCollected = true; }
    }
  };
});

vi.mock('../src/game/enemies', () => {
  // Use actual THREE types from the import
  class MockGeometry extends THREE.PlaneGeometry { dispose = vi.fn(); }
  class MockMaterial extends THREE.MeshBasicMaterial { dispose = vi.fn(); }
  class MockMesh extends THREE.Mesh { /* Add necessary overrides if needed */ }
  return {
    Enemy: class MockEnemy {
      mesh: THREE.Mesh;
      width: number; 
      height: number; 
      physics: any;
      
      constructor(definition: { width: number; height: number; position: { x: number; y: number } }) {
        this.width = definition.width || 0.7;
        this.height = definition.height || 0.7;
        
        this.physics = { 
          getState: () => ({ 
            position: definition.position
          })
        };
        
        const geometry = new MockGeometry(this.width, this.height);
        const material = new MockMaterial();
        this.mesh = new MockMesh(geometry, material);
        this.updateMeshPosition();
      }
      
      updateMeshPosition() { 
        const position = this.physics.getState().position;
        this.mesh.position.set(position.x, position.y, 0); 
      }
      
      update(deltaTime: number) { /* Mock */ }
      checkPlatformCollisions(platforms: THREE.Mesh[]) { /* Mock */ }
    }
  };
});
// --- End Mocks ---


// Helper function using imported THREE types
function createMockPlatform(x: number, y: number, width: number = 4, height: number = 1): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(width, height); // Use imported THREE.PlaneGeometry
    const material = new THREE.MeshBasicMaterial({ color: 0xcccccc }); // Use imported THREE.MeshBasicMaterial
    const platform = new THREE.Mesh(geometry, material); // Use imported THREE.Mesh
    platform.position.set(x, y, 0);
    (platform.geometry as any).parameters = { width, height };
    (platform as any).geometryParams = { width, height };
    return platform;
}

describe('PlayerPhysics', () => {
  let physics: PlayerPhysics;
  const tolerance = 0.5; // Increase tolerance for floating point comparisons in tests
  
  const defaultConfig = {
    width: 1.25, height: 1.25, position: { x: 0, y: 0 },
    speed: 5, jumpForce: 10, gravity: 20
  };

  beforeEach(() => {
    physics = new PlayerPhysics(
      defaultConfig.width, defaultConfig.height, defaultConfig.position,
      defaultConfig.speed, defaultConfig.jumpForce, defaultConfig.gravity
    );
  });

  it('should initialize with the correct values', () => {
    const state = physics.getState();
    expect(state.width).toBe(defaultConfig.width);
    expect(state.height).toBe(defaultConfig.height);
    expect(state.position.x).toBe(defaultConfig.position.x);
    expect(state.position.y).toBe(defaultConfig.position.y);
    expect(state.velocity.x).toBe(0);
    expect(state.velocity.y).toBe(0);
    expect(state.isGrounded).toBe(false);
    expect(state.isMoving).toBe(false);
    expect(state.facingLeft).toBe(false);
  });

  it('should update position based on velocity', () => {
    const keys = {};
    const deltaTime = 1/60;
    physics.updateWithInput(keys, deltaTime);
    const initialState = physics.getState();
    const expectedY_after_1_step = initialState.position.y + initialState.velocity.y * deltaTime;
    const expectedVelocityY_after_1_step = initialState.velocity.y - defaultConfig.gravity * deltaTime;
    physics.updateWithInput(keys, deltaTime);
    const newState = physics.getState();
    expect(Math.abs(newState.position.y - expectedY_after_1_step)).toBeLessThan(tolerance);
    const expectedVelocityY_after_2_steps = expectedVelocityY_after_1_step - defaultConfig.gravity * deltaTime;
    expect(Math.abs(newState.velocity.y - expectedVelocityY_after_2_steps)).toBeLessThan(tolerance);
  });

  it('should respond to movement keys', () => {
    const deltaTime = 1/60;
    let keys: { [key: string]: boolean } = { 'ArrowRight': true };
    physics.updateWithInput(keys, deltaTime);
    let state = physics.getState();
    expect(state.velocity.x).toBe(defaultConfig.speed);
    expect(state.isMoving).toBe(true);
    expect(state.facingLeft).toBe(false);

    keys = { 'ArrowLeft': true };
    physics.updateWithInput(keys, deltaTime);
    state = physics.getState();
    expect(state.velocity.x).toBe(-defaultConfig.speed);
    expect(state.isMoving).toBe(true);
    expect(state.facingLeft).toBe(true);

    physics.updateWithInput({}, deltaTime);
    state = physics.getState();
    expect(state.velocity.x).toBe(0);
    expect(state.isMoving).toBe(false);
    expect(state.facingLeft).toBe(true);
  });

  it('should handle collectible collisions', () => {
    physics = new PlayerPhysics( defaultConfig.width, defaultConfig.height, { x: 0, y: 0 }, defaultConfig.speed, defaultConfig.jumpForce, defaultConfig.gravity );
    const collectibles = [ 
      new Collectible({ radius: 0.5, position: { x: 0, y: 0 } }), 
      new Collectible({ radius: 0.5, position: { x: 3, y: 0 } }), 
      new Collectible({ radius: 0.5, position: { x: 0.5, y: 0.5 } })
    ] as Collectible[];
    const collectedIndices = physics.checkCollectibleCollisions(collectibles);
    expect(collectedIndices).toContain(0);
    expect(collectedIndices).toContain(2);
    expect(collectedIndices).not.toContain(1);
    expect(collectedIndices.length).toBe(2);
  });

   it('should detect enemy collisions', () => {
     physics = new PlayerPhysics( defaultConfig.width, defaultConfig.height, { x: 0, y: 0 }, defaultConfig.speed, defaultConfig.jumpForce, defaultConfig.gravity );
     const enemies = [
       new Enemy({ width: 0.7, height: 0.7, position: { x: 0, y: 0 } }),
       new Enemy({ width: 0.7, height: 0.7, position: { x: 0.5, y: 0 } })
     ] as Enemy[];
     const hasCollision = physics.checkEnemyCollisions(enemies);
     expect(hasCollision).toBe(true);
     
     const nonCollidingEnemies = [
       new Enemy({ width: 0.7, height: 0.7, position: { x: 2, y: 2 } }),
       new Enemy({ width: 0.7, height: 0.7, position: { x: 2, y: -2 } })
     ] as Enemy[];
     const noCollision = physics.checkEnemyCollisions(nonCollidingEnemies);
     expect(noCollision).toBe(false);
   });

    it('should check if player is out of bounds', () => {
      physics = new PlayerPhysics( defaultConfig.width, defaultConfig.height, { x: 0, y: -10 }, defaultConfig.speed, defaultConfig.jumpForce, defaultConfig.gravity );
      const isOutOfBounds = physics.checkFallOutOfBounds(-5);
      expect(isOutOfBounds).toBe(true);
      physics = new PlayerPhysics( defaultConfig.width, defaultConfig.height, { x: 0, y: 0 }, defaultConfig.speed, defaultConfig.jumpForce, defaultConfig.gravity );
      const isInBounds = physics.checkFallOutOfBounds(-5);
      expect(isInBounds).toBe(false);
    });

}); // End of main describe block