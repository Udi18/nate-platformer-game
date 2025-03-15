import * as THREE from 'three';
import { GAME_CONFIG } from './scene';
import { Collectible } from './collectibles';
import { Enemy } from './enemies';
import { getCurrentTheme, PlayerColor } from './color-config';

/**
 * Player state interface
 */
export interface PlayerState {
  position: {
    x: number;
    y: number;
  };
  velocity: {
    x: number;
    y: number;
  };
  isGrounded: boolean;
}

/**
 * Default player configuration
 */
export const DEFAULT_PLAYER = {
  width: 0.8,
  height: 0.8,
  // Blue (default)
  // color: 0x3498db,
  // Green
  // color: 0x2ecc71,
  // Purple
  // color: 0x9b59b6,
  // Orange
  color: 0xe67e22,
  // Teal
  // color: 0x1abc9c,
  position: {
    x: 0,
    y: -3.5  // Just above the ground platform
  },
  speed: 5,
  jumpForce: 10,
  gravity: 20
};

/**
 * Player class to manage the character and movement
 */
export class Player {
  // Visual representation
  public mesh: THREE.Mesh;
  
  // Physical properties
  public width: number;
  public height: number;
  public position: { x: number; y: number };
  public velocity: { x: number; y: number };
  public isGrounded: boolean;
  
  // Movement configuration
  public speed: number;
  public jumpForce: number;
  public gravity: number;
  
  // Input state
  public keys: { [key: string]: boolean } = {};
  
  /**
   * Create a new player with given configuration
   */
  constructor(config = DEFAULT_PLAYER) {
    this.width = config.width;
    this.height = config.height;
    this.position = { ...config.position };
    this.velocity = { x: 0, y: 0 };
    this.isGrounded = false;
    
    this.speed = config.speed;
    this.jumpForce = config.jumpForce;
    this.gravity = config.gravity;
    
    // Create mesh
    const geometry = new THREE.PlaneGeometry(this.width, this.height);
    const material = new THREE.MeshBasicMaterial({ 
      color: config.color || getCurrentTheme().player, 
      side: THREE.DoubleSide 
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.updateMeshPosition();
  }
  
  /**
   * Update mesh position based on physics position
   */
  private updateMeshPosition(): void {
    this.mesh.position.set(
      this.position.x,
      this.position.y,
      GAME_CONFIG.LAYERS.PLAYER
    );
  }
  
  /**
   * Handle player movement based on keyboard input
   * @param deltaTime Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    // Apply horizontal movement
    this.velocity.x = 0;
    
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
      this.velocity.x = -this.speed;
    }
    
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      this.velocity.x = this.speed;
    }
    
    // Apply jump if on ground and a jump key is pressed
    const jumpKeyPressed = this.keys['ArrowUp'] || this.keys[' '] || this.keys['w'] || this.keys['W'];
    
    if (jumpKeyPressed && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      
      // Clear the space key immediately after jumping to prevent it from being "held down" between state transitions
      this.keys[' '] = false;
    }
    
    // Apply gravity
    this.velocity.y -= this.gravity * deltaTime;
    
    // Update position based on velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    
    // Update the mesh position
    this.updateMeshPosition();
  }
  
  /**
   * Check collision with platforms and resolve
   * @param platforms Array of platform meshes
   */
  public checkPlatformCollisions(platforms: THREE.Mesh[]): void {
    this.isGrounded = false;
    
    platforms.forEach(platform => {
      // Get platform dimensions from its geometry
      const platformGeometry = platform.geometry as THREE.PlaneGeometry;
      const platformWidth = platformGeometry.parameters.width;
      const platformHeight = platformGeometry.parameters.height;
      
      // Calculate platform bounds
      const platformLeft = platform.position.x - platformWidth / 2;
      const platformRight = platform.position.x + platformWidth / 2;
      const platformTop = platform.position.y + platformHeight / 2;
      const platformBottom = platform.position.y - platformHeight / 2;
      
      // Calculate player bounds
      const playerLeft = this.position.x - this.width / 2;
      const playerRight = this.position.x + this.width / 2;
      const playerTop = this.position.y + this.height / 2;
      const playerBottom = this.position.y - this.height / 2;
      
      // Check for horizontal overlap
      const horizontalOverlap = 
        playerRight > platformLeft && 
        playerLeft < platformRight;
      
      // Check for vertical overlap
      const verticalOverlap = 
        playerBottom < platformTop && 
        playerTop > platformBottom;
      
      // Full collision check
      if (horizontalOverlap && verticalOverlap) {
        // Calculate overlap amounts
        const bottomOverlap = platformTop - playerBottom;
        const topOverlap = playerTop - platformBottom;
        const leftOverlap = playerRight - platformLeft;
        const rightOverlap = platformRight - playerLeft;
        
        // Find smallest overlap to determine collision side
        const minOverlap = Math.min(bottomOverlap, topOverlap, leftOverlap, rightOverlap);
        
        // Resolve based on smallest overlap
        if (minOverlap === bottomOverlap && this.velocity.y <= 0) {
          // Bottom collision - player landing on platform
          this.position.y = platformTop + this.height / 2;
          this.velocity.y = 0;
          this.isGrounded = true;
        } else if (minOverlap === topOverlap && this.velocity.y > 0) {
          // Top collision - player hitting head
          this.position.y = platformBottom - this.height / 2;
          this.velocity.y = 0;
        } else if (minOverlap === leftOverlap && this.velocity.x > 0) {
          // Left collision - player hitting right side of platform
          this.position.x = platformLeft - this.width / 2;
          this.velocity.x = 0;
        } else if (minOverlap === rightOverlap && this.velocity.x < 0) {
          // Right collision - player hitting left side of platform
          this.position.x = platformRight + this.width / 2;
          this.velocity.x = 0;
        }
        
        // Update mesh position after collision resolution
        this.updateMeshPosition();
      }
    });
  }
  
  /**
   * Check collision with collectibles
   * @param collectibles Array of collectible objects
   * @returns Array of collected item indices
   */
  public checkCollectibleCollisions(collectibles: Collectible[]): number[] {
    const collectedIndices: number[] = [];
    
    // Calculate player bounds
    const playerLeft = this.position.x - this.width / 2;
    const playerRight = this.position.x + this.width / 2;
    const playerTop = this.position.y + this.height / 2;
    const playerBottom = this.position.y - this.height / 2;
    
    collectibles.forEach((collectible, index) => {
      // Skip already collected items
      if (collectible.isCollected) {
        return;
      }
      
      // Simple circle-rectangle collision detection
      // Find closest point on rectangle to circle center
      const closestX = Math.max(playerLeft, Math.min(collectible.position.x, playerRight));
      const closestY = Math.max(playerBottom, Math.min(collectible.position.y, playerTop));
      
      // Calculate distance between circle center and closest point
      const distanceX = collectible.position.x - closestX;
      const distanceY = collectible.position.y - closestY;
      
      // Check if distance is less than circle radius
      const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
      
      if (distanceSquared < (collectible.radius * collectible.radius)) {
        // Collision detected, mark as collected
        collectible.collect();
        collectedIndices.push(index);
      }
    });
    
    return collectedIndices;
  }
  
  /**
   * Check collision with enemies
   * @param enemies Array of enemy objects
   * @returns True if collision detected
   */
  public checkEnemyCollisions(enemies: Enemy[]): boolean {
    // Calculate player bounds
    const playerLeft = this.position.x - this.width / 2;
    const playerRight = this.position.x + this.width / 2;
    const playerTop = this.position.y + this.height / 2;
    const playerBottom = this.position.y - this.height / 2;
    
    for (const enemy of enemies) {
      // Calculate enemy bounds
      const enemyLeft = enemy.position.x - enemy.width / 2;
      const enemyRight = enemy.position.x + enemy.width / 2;
      const enemyTop = enemy.position.y + enemy.height / 2;
      const enemyBottom = enemy.position.y - enemy.height / 2;
      
      // AABB collision check
      if (
        playerRight > enemyLeft &&
        playerLeft < enemyRight &&
        playerTop > enemyBottom &&
        playerBottom < enemyTop
      ) {
        // Log collision (as per requirements)
        console.log('Enemy collision detected!');
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if player has fallen below the visible play area
   * @param minY The minimum Y value of the visible area
   * @returns True if player is below the visible area
   */
  public checkFallOutOfBounds(minY: number): boolean {
    return this.position.y < minY;
  }
}