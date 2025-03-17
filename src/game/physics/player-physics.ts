import { EntityPhysics } from './entity-physics';
import * as THREE from 'three';
import { Collectible } from '../collectibles';
import { Enemy } from '../enemies';

/**
 * Player-specific physics component that extends the base entity physics
 */
export class PlayerPhysics extends EntityPhysics {
  /**
   * Update player movement based on keyboard input
   * @param keys Map of currently pressed keys
   * @param deltaTime Time since last frame in seconds
   */
  public updateWithInput(keys: { [key: string]: boolean }, deltaTime: number): { isMoving: boolean; facingLeft: boolean } {
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
    
    // Call the base update method to apply gravity and update position
    super.update(deltaTime);
    
    // Return animation-relevant state
    return {
      isMoving: this.isMoving,
      facingLeft: this.facingLeft
    };
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
}