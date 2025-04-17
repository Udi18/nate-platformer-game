// filepath: /home/udi/development/nate-platformer-game/tests/player-jump-arc.test.ts
import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { Player, DEFAULT_PLAYER } from '../src/game/player';
import * as THREE from 'three';

describe('Player Jump Arc', () => {
  let player: Player;
  const fps = 60;
  const frameDuration = 1 / fps;
  
  beforeEach(() => {
    // Create a new player for each test
    player = new Player({
      ...DEFAULT_PLAYER,
      position: { x: 0, y: 0 }
    });
    
    // Setup fake timers
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });
  
  it('should follow a smooth parabolic arc during jump', () => {
    // Record jump positions
    const positions: { x: number; y: number; time: number }[] = [];
    
    // Simulate player pressing jump button
    player.keys[' '] = true;
    
    // Store initial height
    positions.push({ 
      x: player.position.x, 
      y: player.position.y,
      time: 0
    });
    
    // Initialize player to be grounded since test environment doesn't have platforms
    (player as any).physics.isGrounded = true;
    
    // Simulate 1 second of gameplay (60 frames)
    for (let frame = 0; frame < 60; frame++) {
      player.update(frameDuration);
      vi.advanceTimersByTime(1000 / fps);
      
      // Record positions
      positions.push({ 
        x: player.position.x, 
        y: player.position.y,
        time: (frame + 1) * frameDuration
      });
    }
    
    // Release jump button midway
    if (positions.length > 20) {
      player.keys[' '] = false;
    }
    
    // Assertions to verify jump arc
    
    // 1. Should gain height initially
    expect(positions[5].y).toBeGreaterThan(positions[0].y);
    
    // 2. Should reach peak height
    let peakFrame = 0;
    let peakHeight = positions[0].y;
    
    for (let i = 0; i < positions.length; i++) {
      if (positions[i].y > peakHeight) {
        peakHeight = positions[i].y;
        peakFrame = i;
      }
    }
    
    // Peak should be somewhere in the middle, not at the start or end
    expect(peakFrame).toBeGreaterThan(5);
    expect(peakFrame).toBeLessThan(positions.length - 5);
    
    // 3. Should have a somewhat symmetrical arc
    const ascendingPhase = positions.slice(1, peakFrame);
    const descendingPhase = positions.slice(peakFrame + 1);
    
    // Ensure ascending phase has positive velocity (getting higher)
    for (let i = 1; i < ascendingPhase.length; i++) {
      const deltaY = ascendingPhase[i].y - ascendingPhase[i-1].y;
      expect(deltaY).toBeGreaterThanOrEqual(0);
    }
    
    // Ensure descending phase has negative velocity (getting lower)
    for (let i = 1; i < descendingPhase.length; i++) {
      const deltaY = descendingPhase[i].y - descendingPhase[i-1].y;
      expect(deltaY).toBeLessThanOrEqual(0);
    }
    
    // 4. Acceleration should be relatively constant due to gravity
    // This means the second derivative of position should be roughly constant
    const calculateAcceleration = (p1: number, p2: number, p3: number, dt: number): number => {
      const v1 = (p2 - p1) / dt;
      const v2 = (p3 - p2) / dt;
      return (v2 - v1) / dt;
    };
    
    const accelerations: number[] = [];
    for (let i = 2; i < positions.length; i++) {
      const acc = calculateAcceleration(
        positions[i-2].y,
        positions[i-1].y,
        positions[i].y,
        frameDuration
      );
      accelerations.push(acc);
    }
    
    // Accelerations should be negative (gravity pulling down)
    // and roughly constant after the initial jump
    for (let i = 5; i < accelerations.length; i++) {
      expect(accelerations[i]).toBeLessThan(0);
      // Allow for some numerical imprecision
      expect(Math.abs(accelerations[i] - accelerations[i-1])).toBeLessThan(1);
    }
  });
  
  it('should update direction marker when direction changes', () => {
    // Force the direction marker position to be non-zero for testing
    player.directionMarker.position.x = 0.5;
    
    // Initial setup - we just set it to be on the right side
    expect(player.directionMarker.position.x).toBeGreaterThan(0);
    
    // Simulate pressing left
    player.keys['ArrowLeft'] = true;
    player.update(frameDuration);
    
    // Direction marker should move to left side
    expect(player.directionMarker.position.x).toBeLessThan(0);
    
    // Change direction to right
    player.keys['ArrowLeft'] = false;
    player.keys['ArrowRight'] = true;
    player.update(frameDuration);
    
    // Direction marker should move back to right side
    expect(player.directionMarker.position.x).toBeGreaterThan(0);
  });
});