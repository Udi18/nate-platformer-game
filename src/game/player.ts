import * as THREE from 'three';
import { GAME_CONFIG } from './scene';
import type { Collectible } from './collectibles';
import type { Enemy } from './enemies';
import { getCurrentTheme, PlayerColor } from './color-config';
import { PlayerSprite } from './player-sprite';
import { PlayerPhysics } from './physics/player-physics';
import type { PhysicsState } from './physics/entity-physics';

export interface PlayerState {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  isGrounded: boolean;
}

export interface PlayerDisplaySettings {
  useSprite: boolean;
}

export const DEFAULT_PLAYER = {
  width: 0.9,
  height: 1.1,
  position: {
    x: 0,
    y: -3.5
  },
  speed: 5,
  jumpForce: 12.5,
  gravity: 25,
  displaySettings: {
    useSprite: false
  }
};

export class Player {
  // Visual representation
  public mesh: THREE.Mesh;
  public directionMarker: THREE.Mesh;
  
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
    
    // Create character material (for non-sprite mode)
    this.squareMaterial = new THREE.MeshBasicMaterial({ 
      color: playerColor,
      transparent: false,
      side: THREE.DoubleSide,
      wireframe: false
    });
    
    // Use appropriate material based on display settings
    const initialMaterial = this.displaySettings.useSprite && this.sprite 
      ? this.sprite.getMaterial() 
      : this.squareMaterial;
    
    // Create main mesh
    this.mesh = new THREE.Mesh(geometry, initialMaterial);
    this.updateMeshPosition();
    
    // Create direction marker (a more visible arrow pointing in the facing direction)
    const arrowWidth = config.width * 0.7;
    const arrowHeight = config.height * 0.4;
    
    // Create an arrow shape for clearer direction indication
    const markerGeometry = new THREE.PlaneGeometry(arrowWidth, arrowHeight);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000, // Black for contrast
      transparent: false,
      side: THREE.DoubleSide
    });
    this.directionMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    
    // Add a white outline or a different material to make it stand out
    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF, // White outline
      wireframe: true,
      side: THREE.DoubleSide
    });
    
    // Create an outline mesh slightly larger than the marker
    const outlineGeometry = new THREE.PlaneGeometry(arrowWidth * 1.1, arrowHeight * 1.1);
    const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
    outlineMesh.position.set(0, 0, 0.05); // Position slightly behind the marker
    this.directionMarker.add(outlineMesh);
    
    // Position marker on the right side of the player (default facing right)
    this.directionMarker.position.set(
      config.width * 0.7, // Offset from center
      0, // Centered vertically with player
      0.1 // Slightly in front of player
    );
    
    // Add direction marker as child of player mesh
    this.mesh.add(this.directionMarker);
    
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
    
    // Show/hide direction marker based on display mode
    if (this.directionMarker) {
      this.directionMarker.visible = !useSprite;
    }
    
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
    const { isMoving, facingLeft } = this.physics.updateWithInput(this.keys, deltaTime);
    
    // Update sprite animation if using sprites
    if (this.displaySettings.useSprite && this.sprite) {
      this.sprite.updateAnimation(deltaTime, isMoving, facingLeft, this.mesh);
      
      // Flip sprite based on direction
      if (facingLeft && this.mesh.scale.x > 0) {
        this.mesh.scale.x *= -1;
      } else if (!facingLeft && this.mesh.scale.x < 0) {
        this.mesh.scale.x *= -1;
      }
    } else {
      // Update direction marker for non-sprite mode
      const markerOffset = this.mesh.geometry.parameters.width * 0.7;
      
      if (facingLeft) {
        // Position marker on the left side
        this.directionMarker.position.x = -markerOffset;
      } else {
        // Position marker on the right side
        this.directionMarker.position.x = markerOffset;
      }
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

  /**
   * Get player position
   */
  public get position(): { x: number; y: number } {
    const state = this.getPhysicsState();
    return state.position;
  }
}