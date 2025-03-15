import * as THREE from 'three';
import { GAME_CONFIG } from './scene';
import { getCurrentTheme, EnemyColor } from './color-config';

/**
 * Enemy definition interface
 */
export interface EnemyDefinition {
  width: number;
  height: number;
  position: {
    x: number;
    y: number;
  };
  color?: number;
  moveType?: 'stationary' | 'horizontal';
  moveSpeed?: number;
  moveRange?: number;
  gravity?: number;
}

/**
 * Default enemy configurations
 */
export const DEFAULT_ENEMIES: EnemyDefinition[] = [
  // Stationary enemy on ground platform
  {
    width: 0.7,
    height: 0.7,
    position: {
      x: -4,
      y: -3.8
    },
    // Colors are now managed by the theme system
    // and will be applied in the constructor
    moveType: 'stationary',
    gravity: 20
  },
  
  // Moving enemy on middle platform
  {
    width: 0.7,
    height: 0.7,
    position: {
      x: -2,
      y: 0.6
    },
    // Colors are now managed by the theme system
    // and will be applied in the constructor
    moveType: 'horizontal',
    moveSpeed: 2,
    moveRange: 5,
    gravity: 20
  },
  
  // Moving enemy on ground platform - different area
  {
    width: 0.7,
    height: 0.7,
    position: {
      x: 2,
      y: -3.8
    },
    // Colors are now managed by the theme system
    // and will be applied in the constructor
    moveType: 'horizontal',
    moveSpeed: 3,
    moveRange: 3,
    gravity: 20
  },
  
  // Another stationary enemy on middle platform
  {
    width: 0.7,
    height: 0.7,
    position: {
      x: -4.5,
      y: 0.6
    },
    // Colors are now managed by the theme system
    // and will be applied in the constructor
    moveType: 'stationary',
    gravity: 20
  }
];

/**
 * Enemy class to manage enemy objects
 */
export class Enemy {
  public mesh: THREE.Mesh;
  public width: number;
  public height: number;
  public position: { x: number; y: number };
  public velocity: { x: number; y: number } = { x: 0, y: 0 };
  public isGrounded: boolean = false;
  
  // Movement properties
  public moveType: 'stationary' | 'horizontal';
  public moveSpeed: number;
  public moveRange: number;
  public initialX: number;
  public direction: number = 1;  // 1 for right, -1 for left
  public gravity: number;
  
  constructor(definition: EnemyDefinition) {
    this.width = definition.width;
    this.height = definition.height;
    this.position = { ...definition.position };
    this.initialX = definition.position.x;
    
    this.moveType = definition.moveType || 'stationary';
    this.moveSpeed = definition.moveSpeed || 0;
    this.moveRange = definition.moveRange || 0;
    this.gravity = definition.gravity || 20;
    
    // Create mesh
    const geometry = new THREE.PlaneGeometry(this.width, this.height);
    const material = new THREE.MeshBasicMaterial({
      color: definition.color || getCurrentTheme().enemy,
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
      GAME_CONFIG.LAYERS.ENEMIES
    );
  }
  
  /**
   * Update enemy position and behavior
   * @param deltaTime Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    // Apply horizontal movement based on type
    if (this.moveType === 'horizontal' && this.isGrounded) {
      this.velocity.x = this.direction * this.moveSpeed;
      
      // Check if we've reached the movement bounds
      if (this.position.x > this.initialX + this.moveRange / 2) {
        this.position.x = this.initialX + this.moveRange / 2;
        this.direction = -1;
        this.velocity.x = this.direction * this.moveSpeed;
      } else if (this.position.x < this.initialX - this.moveRange / 2) {
        this.position.x = this.initialX - this.moveRange / 2;
        this.direction = 1;
        this.velocity.x = this.direction * this.moveSpeed;
      }
    } else {
      this.velocity.x = 0;
    }
    
    // Apply gravity if not grounded
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * deltaTime;
    }
    
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
    // Reset grounded state
    this.isGrounded = false;
    
    for (const platform of platforms) {
      // Get platform dimensions from its geometry
      const platformGeometry = platform.geometry as THREE.PlaneGeometry;
      const platformWidth = platformGeometry.parameters.width;
      const platformHeight = platformGeometry.parameters.height;
      
      // Calculate platform bounds
      const platformLeft = platform.position.x - platformWidth / 2;
      const platformRight = platform.position.x + platformWidth / 2;
      const platformTop = platform.position.y + platformHeight / 2;
      const platformBottom = platform.position.y - platformHeight / 2;
      
      // Calculate enemy bounds
      const enemyLeft = this.position.x - this.width / 2;
      const enemyRight = this.position.x + this.width / 2;
      const enemyTop = this.position.y + this.height / 2;
      const enemyBottom = this.position.y - this.height / 2;
      
      // Check for collision
      if (
        enemyRight > platformLeft &&
        enemyLeft < platformRight &&
        enemyBottom < platformTop &&
        enemyTop > platformBottom
      ) {
        // Calculate overlap amounts
        const bottomOverlap = platformTop - enemyBottom;
        const topOverlap = enemyTop - platformBottom;
        const leftOverlap = enemyRight - platformLeft;
        const rightOverlap = platformRight - enemyLeft;
        
        // Find smallest overlap to determine collision side
        const minOverlap = Math.min(bottomOverlap, topOverlap, leftOverlap, rightOverlap);
        
        // Resolve collision based on overlap
        if (minOverlap === bottomOverlap && this.velocity.y <= 0) {
          // Bottom collision - enemy landing on platform
          this.position.y = platformTop + this.height / 2;
          this.velocity.y = 0;
          this.isGrounded = true;
        } else if (minOverlap === topOverlap && this.velocity.y > 0) {
          // Top collision - enemy hitting head
          this.position.y = platformBottom - this.height / 2;
          this.velocity.y = 0;
        } else if (minOverlap === leftOverlap && this.velocity.x > 0) {
          // Left collision - enemy hitting right side of platform
          this.position.x = platformLeft - this.width / 2;
          this.velocity.x = 0;
          this.direction *= -1; // Change direction when hitting wall
        } else if (minOverlap === rightOverlap && this.velocity.x < 0) {
          // Right collision - enemy hitting left side of platform
          this.position.x = platformRight + this.width / 2;
          this.velocity.x = 0;
          this.direction *= -1; // Change direction when hitting wall
        }
        
        // Update the mesh position after collision resolution
        this.updateMeshPosition();
      }
    }
  }
}

/**
 * Create enemies from definitions
 * @param scene The scene to add enemies to
 * @param enemyDefinitions Array of enemy definitions
 * @returns Array of created enemy objects
 */
export function createEnemies(
  scene: THREE.Scene,
  enemyDefinitions: EnemyDefinition[] = DEFAULT_ENEMIES
): Enemy[] {
  const enemies: Enemy[] = [];
  
  enemyDefinitions.forEach(definition => {
    const enemy = new Enemy(definition);
    scene.add(enemy.mesh);
    enemies.push(enemy);
  });
  
  return enemies;
}