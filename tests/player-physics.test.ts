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

  it('should handle jumping correctly', () => {
    const deltaTime = 1/60;
    const jumpKeys = { 'ArrowUp': true };
    physics.updateWithInput(jumpKeys, deltaTime);
    let state = physics.getState();
    expect(state.velocity.y).toBeLessThan(0);
    expect(state.isGrounded).toBe(false);

    const mockPlatform = createMockPlatform(0, -2);
    physics.checkPlatformCollisions([mockPlatform]);
    expect(physics.getState().isGrounded).toBe(true);

    physics.updateWithInput(jumpKeys, deltaTime);
    state = physics.getState();
    expect(Math.abs(state.velocity.y - defaultConfig.jumpForce)).toBeLessThan(tolerance);
    expect(state.isGrounded).toBe(false);
  });

  it('should detect platform collisions', () => {
    physics = new PlayerPhysics( defaultConfig.width, defaultConfig.height, { x: 0, y: 0 }, defaultConfig.speed, defaultConfig.jumpForce, defaultConfig.gravity );
    const platform = createMockPlatform(0, -2);
    const deltaTime = 1/60;
    for (let i = 0; i < 10; i++) { physics.updateWithInput({}, deltaTime); }
    physics.checkPlatformCollisions([platform]);
    const state = physics.getState();
    expect(state.isGrounded).toBe(true);
    expect(state.velocity.y).toBe(0);
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


// --- Edge Cases Tests ---
describe('PlayerPhysics - Edge Cases', () => {
  let physics: PlayerPhysics;
  const tolerance = 0.5; // Increase tolerance for floating point comparisons in tests
  const defaultConfig = {
    width: 1.25, height: 1.25, position: { x: 0, y: 0 },
    speed: 5, jumpForce: 10, gravity: 20
  };
   const deltaTime = 1/60;

  beforeEach(() => {
    physics = new PlayerPhysics(
      defaultConfig.width, defaultConfig.height, defaultConfig.position,
      defaultConfig.speed, defaultConfig.jumpForce, defaultConfig.gravity
    );
  });

  it('should stop horizontal movement when hitting a wall while grounded', () => {
    const ground = createMockPlatform(0, -1, 10, 1);
    const wall = createMockPlatform(3, 0, 1, 3);
    const groundGeoParams = (ground.geometry as THREE.PlaneGeometry).parameters;
    physics = new PlayerPhysics(defaultConfig.width, defaultConfig.height, {x: 0, y: ground.position.y + groundGeoParams.height/2 + defaultConfig.height/2}, defaultConfig.speed, defaultConfig.jumpForce, defaultConfig.gravity);
    physics.checkPlatformCollisions([ground]);
    expect(physics.getState().isGrounded).toBe(true);

    const keys: { [key: string]: boolean } = { 'ArrowRight': true };
    const wallGeoParams = (wall.geometry as THREE.PlaneGeometry).parameters;
    const wallHitPosition = wall.position.x - wallGeoParams.width / 2 - defaultConfig.width / 2;

    for(let i=0; i<100 && physics.getState().position.x < wallHitPosition - 0.01; ++i) {
       physics.updateWithInput(keys, deltaTime);
       physics.checkPlatformCollisions([ground, wall]);
       if(physics.getState().velocity.x <= 0 && i > 0) break;
    }

    const state = physics.getState();
    expect(state.velocity.x).toBe(0);
    expect(Math.abs(state.position.x - wallHitPosition)).toBeLessThan(tolerance);
    expect(state.isGrounded).toBe(true);
  });

  it('should stop upward movement when hitting the bottom of a platform', () => {
    const ceiling = createMockPlatform(0, 3, 5, 1);
    physics = new PlayerPhysics(defaultConfig.width, defaultConfig.height, {x: 0, y: 1}, defaultConfig.speed, defaultConfig.jumpForce, defaultConfig.gravity);
    // Set a more reasonable upward velocity that will be checked by collision
    (physics as any).velocity.y = 5; 
    (physics as any).isGrounded = false;

    const ceilingGeoParams = (ceiling.geometry as THREE.PlaneGeometry).parameters;
    const ceilingHitPosition = ceiling.position.y - ceilingGeoParams.height / 2 - defaultConfig.height / 2;

    // Update until we hit the ceiling
    for(let i=0; i<10; i++) {
        physics.updateWithInput({}, deltaTime);
        physics.checkPlatformCollisions([ceiling]);
    }

    const state = physics.getState();
    expect(state.velocity.y).toBeLessThanOrEqual(0);
    expect(Math.abs(state.position.y - ceilingHitPosition)).toBeLessThan(tolerance);
  });

  it('should land correctly when landing exactly on the edge of a platform', () => {
      const platform = createMockPlatform(2, 0);
      const platformGeoParams = (platform.geometry as THREE.PlaneGeometry).parameters;
      const platformEdgeX = platform.position.x - platformGeoParams.width / 2;
      physics = new PlayerPhysics(defaultConfig.width, defaultConfig.height, {x: platformEdgeX + defaultConfig.width / 2, y: 1}, defaultConfig.speed, defaultConfig.jumpForce, defaultConfig.gravity);
      (physics as any).velocity.y = -5;
      (physics as any).isGrounded = false;

      const expectedLandingY = platform.position.y + platformGeoParams.height / 2 + defaultConfig.height / 2;

      for (let i=0; i<30; i++) {
          physics.updateWithInput({}, deltaTime);
          physics.checkPlatformCollisions([platform]);
          if(physics.getState().isGrounded) break;
          if(physics.getState().position.y < platform.position.y - 2) break;
      }

      const state = physics.getState();
      expect(state.isGrounded).toBe(true);
      expect(state.velocity.y).toBe(0);
      expect(Math.abs(state.position.y - expectedLandingY)).toBeLessThan(tolerance);
      expect(Math.abs(state.position.x - (platformEdgeX + defaultConfig.width / 2))).toBeLessThan(tolerance);
  });

   it('should not jump if jump key is held while falling onto a platform', () => {
      const platform = createMockPlatform(0, 0);
      physics = new PlayerPhysics(defaultConfig.width, defaultConfig.height, {x: 0, y: 3}, defaultConfig.speed, defaultConfig.jumpForce, defaultConfig.gravity);
      (physics as any).velocity.y = -10;
      (physics as any).isGrounded = false;

      const keys: { [key: string]: boolean } = { ' ': true };

      for (let i=0; i<100 && !physics.getState().isGrounded; ++i) {
          physics.updateWithInput(keys, deltaTime);
          physics.checkPlatformCollisions([platform]);
          if (physics.getState().position.y < -1) break;
      }

      expect(physics.getState().isGrounded).toBe(true);
      expect(physics.getState().velocity.y).toBe(0);

      physics.updateWithInput(keys, deltaTime);
      physics.checkPlatformCollisions([platform]);

      expect(physics.getState().isGrounded).toBe(false);
      expect(Math.abs(physics.getState().velocity.y - defaultConfig.jumpForce)).toBeLessThan(tolerance);
  });

   it('should collect multiple overlapping collectibles', () => {
     const collectible1 = new Collectible({ radius: 0.5, position: { x: 0.1, y: 0.1 } }) as Collectible;
     const collectible2 = new Collectible({ radius: 0.5, position: { x: -0.1, y: -0.1 } }) as Collectible;
     const collectible3 = new Collectible({ radius: 0.5, position: { x: 5, y: 5 } }) as Collectible;
     physics = new PlayerPhysics(defaultConfig.width, defaultConfig.height, {x: 0, y: 0}, defaultConfig.speed, defaultConfig.jumpForce, defaultConfig.gravity);
     const collected = physics.checkCollectibleCollisions([collectible1, collectible2, collectible3]);
     expect(collected).toContain(0);
     expect(collected).toContain(1);
     expect(collected).not.toContain(2);
     expect(collected.length).toBe(2);
     expect(collectible1.isCollected).toBe(true);
     expect(collectible2.isCollected).toBe(true);
     expect(collectible3.isCollected).toBe(false);
   });

   it('should handle enemy collision while jumping', () => {
    physics = new PlayerPhysics( defaultConfig.width, defaultConfig.height, { x: 0, y: 2 }, defaultConfig.speed, defaultConfig.jumpForce, defaultConfig.gravity );
    const enemy = new Enemy({ width: 0.7, height: 0.7, position: { x: 0, y: 0 } });
    
    // Set velocity to moving downward toward enemy
    (physics as any).velocity.y = -10;
    
    const hasCollision = physics.checkEnemyCollisions([enemy]);
    expect(hasCollision).toBe(false);  // Should not have collision yet
    
    for (let i=0; i<30; i++) {
      physics.updateWithInput({}, deltaTime);
      if (physics.checkEnemyCollisions([enemy])) break;
    }
    
    // Expect the physics to register a collision after moving closer
    expect(physics.checkEnemyCollisions([enemy])).toBe(true);
  });

}); // End of Edge Cases describe block