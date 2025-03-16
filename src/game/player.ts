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
 * Sprite animation configuration
 */
export const SPRITE_CONFIG = {
  // Sprite sheet dimensions
  SHEET_WIDTH: 750,
  SHEET_HEIGHT: 250,
  // Single frame dimensions
  FRAME_WIDTH: 125,
  FRAME_HEIGHT: 125,
  // Number of frames in each row
  FRAMES_PER_ROW: 6,
  // Animation rows
  WALK_ROW: 0,
  IDLE_ROW: 1,
  // Animation speed (frames per second)
  ANIMATION_FPS: 8
};

/**
 * Default player configuration
 */
export const DEFAULT_PLAYER = {
  width: 1.25,  // Increased to match sprite dimensions
  height: 1.25, // Increased to match sprite dimensions
  // Color is now managed by the theme system
  // and will be applied in the constructor
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
  
  // Sprite animation properties
  private spriteTexture: THREE.Texture;
  private spriteMaterial: THREE.MeshBasicMaterial;
  private currentFrame: number = 0;
  private animationTimer: number = 0;
  private isMoving: boolean = false;
  private facingLeft: boolean = false;
  
  /**
   * Create a new player with given configuration
   */
  constructor(config = DEFAULT_PLAYER, playerColorName?: string) {
    this.width = config.width;
    this.height = config.height;
    this.position = { ...config.position };
    this.velocity = { x: 0, y: 0 };
    this.isGrounded = false;
    
    this.speed = config.speed;
    this.jumpForce = config.jumpForce;
    this.gravity = config.gravity;
    
    // Load sprite sheet texture
    const textureLoader = new THREE.TextureLoader();
    this.spriteTexture = textureLoader.load('/sprites/player-sprite.png', (texture) => {
      // Once the texture is loaded, ensure it uses the right filtering
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.needsUpdate = true;
      
      // Force material update
      if (this.spriteMaterial) {
        this.spriteMaterial.needsUpdate = true;
      }
    });
    
    // Set initial texture properties
    this.spriteTexture.magFilter = THREE.NearestFilter;
    this.spriteTexture.minFilter = THREE.NearestFilter;
    
    // Create mesh with sprite texture
    const geometry = new THREE.PlaneGeometry(this.width, this.height);
    
    // Apply UV mapping for the first idle frame
    this.updateUVs(geometry, 0, SPRITE_CONFIG.IDLE_ROW);
    
    // Determine player color tint (applied as a material color)
    let playerColor: number;
    
    if (playerColorName) {
      // Map color name to PlayerColor enum
      switch (playerColorName.toLowerCase()) {
        case 'blue':
          playerColor = PlayerColor.BLUE;
          break;
        case 'green':
          playerColor = PlayerColor.GREEN;
          break;
        case 'purple':
          playerColor = PlayerColor.PURPLE;
          break;
        case 'teal':
          playerColor = PlayerColor.TEAL;
          break;
        case 'red':
          playerColor = PlayerColor.RED;
          break;
        case 'orange':
        default:
          playerColor = PlayerColor.ORANGE;
      }
    } else {
      // Use theme's default player color
      playerColor = getCurrentTheme().player;
    }
    
    // Create material with sprite texture
    this.spriteMaterial = new THREE.MeshBasicMaterial({ 
      map: this.spriteTexture,
      transparent: true,
      side: THREE.DoubleSide,
      color: playerColor  // Apply color tint
    });
    
    this.mesh = new THREE.Mesh(geometry, this.spriteMaterial);
    this.updateMeshPosition();
  }
  
  /**
   * Update UV coordinates of the geometry to show the specific frame
   * @param geometry The geometry to update
   * @param frameIndex The frame index (0-5)
   * @param rowIndex The row index (0 for walking, 1 for idle)
   */
  private updateUVs(geometry: THREE.PlaneGeometry, frameIndex: number, rowIndex: number): void {
    // Calculate UV coordinates
    const frameU = SPRITE_CONFIG.FRAME_WIDTH / SPRITE_CONFIG.SHEET_WIDTH;
    const frameV = SPRITE_CONFIG.FRAME_HEIGHT / SPRITE_CONFIG.SHEET_HEIGHT;
    
    const startU = frameIndex * frameU;
    const startV = rowIndex * frameV;
    
    // Update UV coordinates only if the geometry has UV attributes
    if (geometry.attributes && geometry.attributes.uv) {
      const uvAttribute = geometry.attributes.uv;
      
      // Bottom-left
      uvAttribute.setXY(0, startU, startV + frameV);
      // Bottom-right
      uvAttribute.setXY(1, startU + frameU, startV + frameV);
      // Top-right
      uvAttribute.setXY(2, startU + frameU, startV);
      // Top-left
      if (uvAttribute.count > 3) {
        uvAttribute.setXY(3, startU, startV);
      }
      
      // Set the UV attributes as needing update
      uvAttribute.needsUpdate = true;
    }
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
    let wasMoving = this.isMoving;
    let wasFacingLeft = this.facingLeft;
    
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
      this.velocity.x = -this.speed;
      this.isMoving = true;
      this.facingLeft = true;
    } else if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      this.velocity.x = this.speed;
      this.isMoving = true;
      this.facingLeft = false;
    } else {
      this.isMoving = false;
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
    
    // Update sprite animation
    this.updateAnimation(deltaTime, wasMoving, wasFacingLeft);
    
    // Update the mesh position
    this.updateMeshPosition();
  }
  
  /**
   * Update sprite animation based on player state
   * @param deltaTime Time since last frame in seconds
   * @param wasMoving Whether the player was moving in the previous frame
   * @param wasFacingLeft Whether the player was facing left in the previous frame
   */
  private updateAnimation(deltaTime: number, wasMoving: boolean, wasFacingLeft: boolean): void {
    // Increment animation timer
    this.animationTimer += deltaTime;
    
    // Frame rate control - only update animation when timer exceeds frame duration
    const frameDuration = 1 / SPRITE_CONFIG.ANIMATION_FPS;
    
    // Determine if we need to update the frame
    let frameChanged = false;
    
    if (this.animationTimer >= frameDuration) {
      // Reset timer (maintaining any excess time)
      this.animationTimer = 0;
      
      // Advance to next frame only if moving or on the first frame of idle
      if (this.isMoving || this.currentFrame > 0) {
        this.currentFrame = (this.currentFrame + 1) % SPRITE_CONFIG.FRAMES_PER_ROW;
        frameChanged = true;
      }
    }
    
    // Always update UVs when state changes
    const stateChanged = 
      this.isMoving !== wasMoving;
    
    // If the player just started or stopped moving, reset frame counter
    if (stateChanged) {
      this.currentFrame = 0;
      frameChanged = true;
    }
    
    // Update the sprite sheet row based on movement state
    if (frameChanged || stateChanged) {
      const rowIndex = this.isMoving ? SPRITE_CONFIG.WALK_ROW : SPRITE_CONFIG.IDLE_ROW;
      this.updateUVs(this.mesh.geometry as THREE.PlaneGeometry, this.currentFrame, rowIndex);
    }
    
    // Always update player direction when it changes
    if (this.facingLeft !== wasFacingLeft) {
      this.mesh.scale.x = this.facingLeft ? -1 : 1;
    }
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