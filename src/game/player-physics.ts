import * as THREE from 'three';
import { Collectible } from './collectibles';
import { Enemy } from './enemies';

export interface PhysicsState {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  isGrounded: boolean;
  width: number;
  height: number;
  isMoving: boolean;
  facingLeft: boolean;
}

export class PlayerPhysics {
  private position: { x: number; y: number };
  private velocity: { x: number; y: number };
  private isGrounded: boolean;
  private width: number;
  private height: number;
  
  // Movement configuration
  private speed: number;
  private jumpForce: number;
  private gravity: number;
  
  // Input and direction state
  private isMoving: boolean = false;
  private facingLeft: boolean = false;
  
  constructor(
    width: number,
    height: number,
    initialPosition: { x: number; y: number },
    speed: number,
    jumpForce: number,
    gravity: number
  ) {
    this.width = width;
    this.height = height;
    this.position = { ...initialPosition };
    this.velocity = { x: 0, y: 0 };
    this.isGrounded = false;
    
    this.speed = speed;
    this.jumpForce = jumpForce;
    this.gravity = gravity;
  }
  
  /**
   * Get the current physics state
   */
  public getState(): PhysicsState {
    return {
      position: { ...this.position },
      velocity: { ...this.velocity },
      isGrounded: this.isGrounded,
      width: this.width,
      height: this.height,
      isMoving: this.isMoving,
      facingLeft: this.facingLeft
    };
  }
  
  /**
   * Update player movement and physics
   * @param keys Map of currently pressed keys
   * @param deltaTime Time since last frame in seconds
   */
  public update(keys: { [key: string]: boolean }, deltaTime: number): { isMoving: boolean; facingLeft: boolean } {
    // Apply horizontal movement
    this.velocity.x = 0;
    
    // Handle movement input
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
      this.velocity.x = -this.speed;
      this.isMoving = true;
      this.facingLeft = true;
    } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
      this.velocity.x = this.speed;
      this.isMoving = true;
      this.facingLeft = false;
    } else {
      this.isMoving = false;
    }
    
    // Apply jump if on ground and a jump key is pressed
    const jumpKeyPressed = keys['ArrowUp'] || keys[' '] || keys['w'] || keys['W'];
    
    if (jumpKeyPressed && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }
    
    // Apply gravity
    this.velocity.y -= this.gravity * deltaTime;
    
    // Update position based on velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    
    // Return animation-relevant state
    return {
      isMoving: this.isMoving,
      facingLeft: this.facingLeft
    };
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