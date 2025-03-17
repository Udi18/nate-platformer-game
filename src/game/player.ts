import * as THREE from 'three';
import { GAME_CONFIG } from './scene';
import { Collectible } from './collectibles';
import { Enemy } from './enemies';
import { getCurrentTheme, PlayerColor } from './color-config';
import { PlayerSprite } from './player-sprite';
import { PlayerPhysics, PhysicsState } from './player-physics';

export interface PlayerState {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  isGrounded: boolean;
}

export interface PlayerDisplaySettings {
  useSprite: boolean;
}

export const DEFAULT_PLAYER = {
  width: 1.25,
  height: 1.25,
  position: {
    x: 0,
    y: -3.5
  },
  speed: 5,
  jumpForce: 10,
  gravity: 20,
  displaySettings: {
    useSprite: true
  }
};

export class Player {
  // Visual representation
  public mesh: THREE.Mesh;
  
  // Components
  private physics: PlayerPhysics;
  private sprite: PlayerSprite | null = null;
  
  // Display settings
  public displaySettings: PlayerDisplaySettings;
  
  // Input state
  public keys: { [key: string]: boolean } = {};
  
  // Material for non-sprite mode
  private squareMaterial: THREE.MeshBasicMaterial;
  
  constructor(config = DEFAULT_PLAYER, playerColorName?: string) {
    // Initialize physics
    this.physics = new PlayerPhysics(
      config.width,
      config.height,
      config.position,
      config.speed,
      config.jumpForce,
      config.gravity
    );
    
    // Initialize display settings
    this.displaySettings = {
      useSprite: config.displaySettings?.useSprite ?? true
    };
    
    // Create geometry for the player
    const geometry = new THREE.PlaneGeometry(config.width, config.height);
    
    // Initialize sprite if needed
    if (this.displaySettings.useSprite) {
      this.sprite = new PlayerSprite('/sprites/player-sprite-flip.png');
    }
    
    // Determine player color for the square material
    let playerColor: number;
    
    if (playerColorName) {
      switch (playerColorName.toLowerCase()) {
        case 'blue': playerColor = PlayerColor.BLUE; break;
        case 'green': playerColor = PlayerColor.GREEN; break;
        case 'purple': playerColor = PlayerColor.PURPLE; break;
        case 'teal': playerColor = PlayerColor.TEAL; break;
        case 'red': playerColor = PlayerColor.RED; break;
        case 'orange':
        default: playerColor = PlayerColor.ORANGE;
      }
    } else {
      playerColor = getCurrentTheme().player;
    }
    
    // Create square material (for non-sprite mode)
    this.squareMaterial = new THREE.MeshBasicMaterial({ 
      color: playerColor,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    // Use appropriate material based on display settings
    const initialMaterial = this.displaySettings.useSprite && this.sprite 
      ? this.sprite.getMaterial() 
      : this.squareMaterial;
    
    // Create mesh
    this.mesh = new THREE.Mesh(geometry, initialMaterial);
    this.updateMeshPosition();
    
    // Set initial sprite frame if using sprites
    if (this.displaySettings.useSprite && this.sprite) {
      this.sprite.setInitialFrame(this.mesh);
    }
  }
  
  /**
   * Switch between sprite and colored square display
   */
  public setDisplayMode(useSprite: boolean): void {
    this.displaySettings.useSprite = useSprite;
    
    // Create sprite if needed and not already created
    if (useSprite && !this.sprite) {
      this.sprite = new PlayerSprite('/sprites/player-sprite-flip.png');
    }
    
    // Update mesh material
    this.mesh.material = useSprite && this.sprite 
      ? this.sprite.getMaterial() 
      : this.squareMaterial;
    
    // Update sprite frame if switching to sprite mode
    if (useSprite && this.sprite) {
      const { isMoving } = this.getPhysicsState();
      this.sprite.setInitialFrame(this.mesh, isMoving);
    }
  }
  
  /**
   * Get current physics state
   */
  private getPhysicsState(): PhysicsState {
    return this.physics.getState();
  }
  
  /**
   * Update mesh position based on physics position
   */
  private updateMeshPosition(): void {
    const state = this.getPhysicsState();
    this.mesh.position.set(
      state.position.x,
      state.position.y,
      GAME_CONFIG.LAYERS.PLAYER
    );
  }
  
  /**
   * Update player based on keyboard input
   */
  public update(deltaTime: number): void {
    // Update physics and get animation state
    const { isMoving, facingLeft } = this.physics.update(this.keys, deltaTime);
    
    // Update sprite animation if using sprites
    if (this.displaySettings.useSprite && this.sprite) {
      this.sprite.updateAnimation(deltaTime, isMoving, facingLeft, this.mesh);
    }
    
    // Update the mesh position
    this.updateMeshPosition();
  }
  
  /**
   * Check collision with platforms and resolve
   */
  public checkPlatformCollisions(platforms: THREE.Mesh[]): void {
    this.physics.checkPlatformCollisions(platforms);
    this.updateMeshPosition();
  }
  
  /**
   * Check collision with collectibles
   */
  public checkCollectibleCollisions(collectibles: Collectible[]): number[] {
    return this.physics.checkCollectibleCollisions(collectibles);
  }
  
  /**
   * Check collision with enemies
   */
  public checkEnemyCollisions(enemies: Enemy[]): boolean {
    return this.physics.checkEnemyCollisions(enemies);
  }
  
  /**
   * Check if player has fallen below the visible play area
   */
  public checkFallOutOfBounds(minY: number): boolean {
    return this.physics.checkFallOutOfBounds(minY);
  }
  
  /**
   * Get the current player state (for game state tracking)
   */
  public getState(): PlayerState {
    const state = this.getPhysicsState();
    return {
      position: state.position,
      velocity: state.velocity,
      isGrounded: state.isGrounded
    };
  }
}