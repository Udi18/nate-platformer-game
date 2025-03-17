import * as THREE from 'three';
import { getCurrentTheme, EnemyColor } from './color-config';
import { GAME_CONFIG } from './scene';
import { EnemyPhysics, EnemyMovementType } from './physics/enemy-physics';

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
  moveType?: EnemyMovementType;
  moveSpeed?: number;
  moveRange?: number;
  gravity?: number;
}

/**
 * Default enemy configurations
 */
export const DEFAULT_ENEMIES: EnemyDefinition[] = [
  // Stationary enemy on top platform
  {
    width: 0.7,
    height: 0.7,
    position: {
      x: -3.5,
      y: 3.6
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
      x: 0,
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
  
  // Use the new physics component
  private physics: EnemyPhysics;
  
  constructor(definition: EnemyDefinition) {
    this.width = definition.width;
    this.height = definition.height;
    
    // Create physics component
    this.physics = new EnemyPhysics(
      definition.width,
      definition.height,
      definition.position,
      definition.moveSpeed || 0,
      definition.gravity || 20,
      definition.moveType || 'stationary',
      definition.moveRange || 0
    );
    
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
    const state = this.physics.getState();
    this.mesh.position.set(
      state.position.x,
      state.position.y,
      GAME_CONFIG.LAYERS.ENEMIES
    );
  }
  
  /**
   * Update enemy position and behavior
   * @param deltaTime Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    // Update physics
    this.physics.updateEnemy(deltaTime);
    
    // Update the mesh position
    this.updateMeshPosition();
  }
  
  /**
   * Check collision with platforms and resolve
   * @param platforms Array of platform meshes
   */
  public checkPlatformCollisions(platforms: THREE.Mesh[]): void {
    this.physics.checkPlatformCollisions(platforms);
    this.updateMeshPosition();
  }
  
  /**
   * Get enemy position accessor
   */
  public get position(): { x: number; y: number } {
    const state = this.physics.getState();
    return state.position;
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