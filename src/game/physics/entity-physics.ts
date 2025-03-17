import * as THREE from 'three';

/**
 * Base interface for physics properties
 */
export interface PhysicsState {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  isGrounded: boolean;
  width: number;
  height: number;
  isMoving: boolean;
  facingLeft: boolean;
}

/**
 * Base physics component that can be used by various game entities
 * This handles basic physics like gravity, movement and collision detection
 */
export class EntityPhysics {
  protected position: { x: number; y: number };
  protected velocity: { x: number; y: number };
  protected isGrounded: boolean;
  protected width: number;
  protected height: number;
  
  // Movement configuration
  protected speed: number;
  protected jumpForce: number;
  protected gravity: number;
  
  // Input and direction state
  protected isMoving: boolean = false;
  protected facingLeft: boolean = false;
  
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
   * Apply gravity and update position based on velocity
   * @param deltaTime Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    // Apply gravity
    this.velocity.y -= this.gravity * deltaTime;
    
    // Update position based on velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
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
      
      // Calculate entity bounds
      const entityLeft = this.position.x - this.width / 2;
      const entityRight = this.position.x + this.width / 2;
      const entityTop = this.position.y + this.height / 2;
      const entityBottom = this.position.y - this.height / 2;
      
      // Check for horizontal overlap
      const horizontalOverlap = 
        entityRight > platformLeft && 
        entityLeft < platformRight;
      
      // Check for vertical overlap
      const verticalOverlap = 
        entityBottom < platformTop && 
        entityTop > platformBottom;
      
      // Full collision check
      if (horizontalOverlap && verticalOverlap) {
        // Calculate overlap amounts
        const bottomOverlap = platformTop - entityBottom;
        const topOverlap = entityTop - platformBottom;
        const leftOverlap = entityRight - platformLeft;
        const rightOverlap = platformRight - entityLeft;
        
        // Find smallest overlap to determine collision side
        const minOverlap = Math.min(bottomOverlap, topOverlap, leftOverlap, rightOverlap);
        
        // Resolve based on smallest overlap
        if (minOverlap === bottomOverlap && this.velocity.y <= 0) {
          // Bottom collision - entity landing on platform
          this.position.y = platformTop + this.height / 2;
          this.velocity.y = 0;
          this.isGrounded = true;
        } else if (minOverlap === topOverlap && this.velocity.y > 0) {
          // Top collision - entity hitting head
          this.position.y = platformBottom - this.height / 2;
          this.velocity.y = 0;
        } else if (minOverlap === leftOverlap && this.velocity.x > 0) {
          // Left collision - entity hitting right side of platform
          this.position.x = platformLeft - this.width / 2;
          this.velocity.x = 0;
        } else if (minOverlap === rightOverlap && this.velocity.x < 0) {
          // Right collision - entity hitting left side of platform
          this.position.x = platformRight + this.width / 2;
          this.velocity.x = 0;
        }
      }
    });
  }
  
  /**
   * Check if entity has fallen below the visible play area
   * @param minY The minimum Y value of the visible area
   * @returns True if entity is below the visible area
   */
  public checkFallOutOfBounds(minY: number): boolean {
    return this.position.y < minY;
  }
}