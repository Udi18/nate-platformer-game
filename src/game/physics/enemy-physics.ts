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
    // Call the parent method first
    super.checkPlatformCollisions(platforms);
    
    // In addition to normal collision resolution, change direction when hitting walls
    // This can be expanded with more sophisticated behavior
    if (this.moveType === 'horizontal' && this.velocity.x === 0) {
      this.direction *= -1;
      this.facingLeft = this.direction < 0;
    }
  }
}