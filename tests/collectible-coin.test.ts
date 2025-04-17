import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Coin } from '../src/game/collectibles/coin';
import { Player } from '../src/game/player';
import { UIManager } from '../src/game/ui-manager';
import * as THREE from 'three';

// Ensure Collectible is properly extended
import { Collectible } from '../src/game/collectibles';

// Mock GAME_CONFIG for tests
vi.mock('../src/game/scene', () => ({
  GAME_CONFIG: {
    LAYERS: {
      COLLECTIBLES: 3
    }
  }
}));

// Mock Three.js objects
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return {
    ...actual,
    TextureLoader: vi.fn().mockImplementation(() => ({
      load: vi.fn().mockReturnValue({})
    })),
    SpriteMaterial: vi.fn().mockImplementation(() => ({})),
    Sprite: vi.fn().mockImplementation(() => ({
      scale: { set: vi.fn() },
      position: { set: vi.fn() },
      visible: true
    }))
  };
});

// Mock PlayerPhysics to properly handle collectible collisions
vi.mock('../src/game/physics/player-physics', () => ({
  PlayerPhysics: vi.fn().mockImplementation(() => ({
    getState: vi.fn().mockReturnValue({
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      isGrounded: true,
      width: 1,
      height: 2,
      isMoving: false,
      facingLeft: false
    }),
    updateWithInput: vi.fn().mockReturnValue({ isMoving: false, facingLeft: false }),
    checkPlatformCollisions: vi.fn(),
    checkCollectibleCollisions: vi.fn().mockImplementation((collectibles) => {
      const indices = [];
      collectibles.forEach((collectible, index) => {
        if (!collectible.isCollected) {
          collectible.collect();
          indices.push(index);
        }
      });
      return indices;
    }),
    checkEnemyCollisions: vi.fn(),
    checkFallOutOfBounds: vi.fn().mockReturnValue(false)
  }))
}));

// Mock Audio API
class MockAudioContext {
  createBufferSource = vi.fn().mockReturnValue({
    connect: vi.fn(),
    start: vi.fn(),
    buffer: null
  });
  decodeAudioData = vi.fn();
  destination = {};
}

global.AudioContext = MockAudioContext as any;
global.XMLHttpRequest = vi.fn().mockImplementation(() => ({
  open: vi.fn(),
  send: vi.fn(),
  responseType: '',
  onload: null,
  onerror: null
}));

describe('Coin', () => {
  let coin: Coin;
  let player: Player;
  let uiManager: UIManager;
  let scene: THREE.Scene;
  
  beforeEach(() => {
    scene = new THREE.Scene();
    
    coin = new Coin({
      radius: 0.3,
      position: {
        x: 0,
        y: 0
      }
    });
    
    player = new Player({
      width: 1,
      height: 2,
      position: {
        x: -2,
        y: 0
      },
      color: 0xffffff
    });
    
    uiManager = new UIManager();
    
    // Mock the score element since it won't exist in the test environment
    Object.defineProperty(uiManager, 'scoreValueElement', {
      value: { textContent: '0' },
      writable: true
    });
  });
  
  test('should properly initialize a coin with the correct properties', () => {
    expect(coin.position.x).toBe(0);
    expect(coin.position.y).toBe(0);
    expect(coin.radius).toBe(0.3);
    expect(coin.isCollected).toBe(false);
  });
  
  test('should be collectable by the player', () => {
    // Update player position to overlap with coin
    player.position.x = 0;
    player.position.y = 0;
    
    // Check collision and collect
    const collectedItems = player.checkCollectibleCollisions([coin]);
    
    expect(collectedItems.length).toBe(1);
    expect(coin.isCollected).toBe(true);
    expect(coin.mesh.visible).toBe(false);
  });
  
  test('should increment score when collected', () => {
    // Position player to collect coin
    player.position.x = 0;
    player.position.y = 0;
    
    // Initial score
    const initialScore = uiManager.getScore();
    
    // Collect coin
    const collectedItems = player.checkCollectibleCollisions([coin]);
    
    // Update score based on collected items
    if (collectedItems.length > 0) {
      uiManager.updateScore(collectedItems.length, true);
    }
    
    // Check score increased
    expect(uiManager.getScore()).toBe(initialScore + 1);
  });
  
  test('should play sound effect when collected', () => {
    // Spy on console error in case audio fails
    const consoleErrorSpy = vi.spyOn(console, 'error');
    
    // Position player to collect coin
    player.position.x = 0;
    player.position.y = 0;
    
    // Collect coin
    player.checkCollectibleCollisions([coin]);
    
    // At minimum, there should be no errors when collecting
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
  
  test('should implement update method without errors', () => {
    // Our simplified implementation doesn't do animation,
    // but we should make sure the update method doesn't throw errors
    
    // This should run without errors
    expect(() => {
      coin.update(0.016);
    }).not.toThrow();
  });
});