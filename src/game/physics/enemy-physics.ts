import * as THREE from 'three';
import { EntityPhysics } from './entity-physics';

/**
 * Movement types for enemies
 */
export type EnemyMovementType = 'stationary' | 'horizontal';

/**
 * Enemy-specific physics component that extends the base entity physics
 */
export class EnemyPhysics extends EntityPhysics {
  // Enemy-specific properties
  private moveType: EnemyMovementType;
  private moveRange: number;
  private initialX: number;
  private direction: number = 1; // 1 for right, -1 for left
  
  constructor(
    width: number,
    height: number,
    initialPosition: { x: number; y: number },
    speed: number,
    gravity: number,
    moveType: EnemyMovementType = 'stationary',
    moveRange: number = 0
  ) {
    // We set jumpForce to 0 for most enemies as they don't typically jump
    super(width, height, initialPosition, speed, 0, gravity);
    
    this.moveType = moveType;
    this.moveRange = moveRange;
    this.initialX = initialPosition.x;
  }
  
  /**
   * Update enemy movement behavior
   * @param deltaTime Time since last frame in seconds
   */
  public updateEnemy(deltaTime: number): void {
    // Apply horizontal movement based on type
    if (this.moveType === 'horizontal' && this.isGrounded) {
      this.velocity.x = this.direction * this.speed;
      
      // Check if we've reached the movement bounds
      if (this.position.x > this.initialX + this.moveRange / 2) {
        this.position.x = this.initialX + this.moveRange / 2;
        this.direction = -1;
        this.velocity.x = this.direction * this.speed;
        this.facingLeft = true;
      } else if (this.position.x < this.initialX - this.moveRange / 2) {
        this.position.x = this.initialX - this.moveRange / 2;
        this.direction = 1;
        this.velocity.x = this.direction * this.speed;
        this.facingLeft = false;
      }
      
      this.isMoving = this.velocity.x !== 0;
    } else {
      this.velocity.x = 0;
      this.isMoving = false;
    }
    
    // Call the base update method to apply gravity and update position
    super.update(deltaTime);
  }
  
  /**
   * Set the movement type of this enemy
   */
  public setMovementType(type: EnemyMovementType, range: number = 0): void {
    this.moveType = type;
    this.moveRange = range;
  }
  
  /**
   * Override platform collision to handle direction change
   */
  public checkPlatformCollisions(platforms: THREE.Mesh[]): void {
    const previousVelocityX = this.velocity.x;

    super.checkPlatformCollisions(platforms);

    if (this.moveType === 'horizontal' && this.isGrounded) {
      if (previousVelocityX !== 0 && this.velocity.x === 0) {
        this.direction *= -1;
        this.facingLeft = this.direction < 0;
        this.velocity.x = this.direction * this.speed;
      }
    }

    // Ensure the enemy doesn't get stuck in walls by slightly adjusting position
    platforms.forEach(platform => {
      const platformGeometry = platform.geometry as THREE.PlaneGeometry;
      const platformWidth = platformGeometry.parameters.width;
      const platformLeft = platform.position.x - platformWidth / 2;
      const platformRight = platform.position.x + platformWidth / 2;

      if (this.position.x < platformLeft) {
        this.position.x = platformLeft - this.width / 2;
      } else if (this.position.x > platformRight) {
        this.position.x = platformRight + this.width / 2;
      }
    });
  }

  /**
   * Get the current movement direction
   * @returns 1 for right, -1 for left
   */
  public getDirection(): number {
    return this.direction;
  }
}