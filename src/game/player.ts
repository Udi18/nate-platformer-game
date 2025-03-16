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
 * 
 * The sprite sheet is laid out as follows:
 * - 750px width × 250px height total image size
 * - 6 frames per row, each 125px × 125px
 * - Row 0 (top row): Walking/Running animation (6 frames, columns 0-5)
 * - Row 1 (bottom row): Standing still animation (4 frames, columns 0-3)
 * 
 * NOTE: The bottom row has 4 idle animation frames in columns 0-3
 */
export const SPRITE_CONFIG = {
  // Sprite sheet dimensions (pixels)
  SHEET_WIDTH: 750,
  SHEET_HEIGHT: 250,
  // Single frame dimensions (pixels)
  FRAME_WIDTH: 125,
  FRAME_HEIGHT: 125,
  // Number of frames in each row
  FRAMES_PER_ROW: 6,
  // Animation rows - 0-indexed, so 0=first row, 1=second row
  WALK_ROW: 0,  // FIRST ROW - Walking animation
  IDLE_ROW: 1,  // SECOND ROW - Idle animation
  // Animation speed (frames per second)
  ANIMATION_FPS: 6,
  // Number of frames to use for each animation (may be less than FRAMES_PER_ROW)
  WALK_FRAMES: 6,  // Use all 6 frames for walking (frames 0-5)
  IDLE_FRAMES: 4   // Use all 4 frames for idle animation
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
    
    // Create geometry for the player
    const geometry = new THREE.PlaneGeometry(this.width, this.height);
    
    // Load the sprite sheet texture
    const textureLoader = new THREE.TextureLoader();
    this.spriteTexture = textureLoader.load('/sprites/player-sprite.png');
    
    // Fix vertical orientation
    this.spriteTexture.flipY = false;

    this.spriteTexture.magFilter = THREE.NearestFilter; 
    this.spriteTexture.minFilter = THREE.NearestFilter;
    this.spriteTexture.generateMipmaps = false;
    this.spriteTexture.needsUpdate = true;
    
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
    
    // Create material with sprite texture (WITHOUT color tint for now)
    this.spriteMaterial = new THREE.MeshBasicMaterial({ 
      map: this.spriteTexture,
      transparent: true,
      side: THREE.DoubleSide
      // color tint removed to fix sprite visibility
    });
    
    this.mesh = new THREE.Mesh(geometry, this.spriteMaterial);
    this.updateMeshPosition();
    
    // Force the idle sprite to show initially
    this.showIdleSprite();
  }
  
  /**
   * Update UV coordinates of the geometry to show the specific frame
   * @param geometry The geometry to update
   * @param frameIndex The frame index (0-5)
   */
  private updateUVs(geometry: THREE.PlaneGeometry, frameIndex: number): void {
    // Ensure frame indices are within bounds
    if (frameIndex === SPRITE_CONFIG.IDLE_ROW) {
      // Always use first frame for idle
      frameIndex = 0;  
    } else if (frameIndex === SPRITE_CONFIG.WALK_ROW) {
      // Keep walking animation frames in bounds
      frameIndex = frameIndex % SPRITE_CONFIG.WALK_FRAMES; 
    }
    
    // IMPORTANT: Fix for sprite sheet orientation
    // In our sprite sheet:
    // - Row 0 (TOP row) has the walking animation frames
    // - Row 1 (BOTTOM row) has the idle animation frame
    // - But in THREE.js UV space, v=0 is bottom and v=1 is top, so we need to flip
    
    // Fixed constants for sprite sheet layout
    const FRAMES_HORIZONTAL = 6;   // 6 frames across
    const FRAMES_VERTICAL = 2;     // 2 rows (walk + idle)
    
    // Calculate frame size as fraction of the full texture
    const frameWidth = 1.0 / FRAMES_HORIZONTAL;
    
    // Calculate UV coordinates for the current frame
    // CORRECTED: In UV space, v=0 is the BOTTOM of the texture
    const u0 = frameIndex * frameWidth;
    const u1 = u0 + frameWidth;
    
    // FIXED: For Row 0 (walking animation, TOP row), v coordinates should be (0.5, 1.0)
    // For Row 1 (idle animation, BOTTOM row), v coordinates should be (0.0, 0.5)
    let v0, v1;
    if (frameIndex === SPRITE_CONFIG.WALK_ROW) { // TOP row (walking)
      v0 = 0.5;  // Start 50% down from top
      v1 = 1.0;  // End at bottom of texture
    } else { // BOTTOM row (idle)
      v0 = 0.0;  // Start at top of texture 
      v1 = 0.5;  // End 50% down from top
    }
    
    console.log(`Setting UVs for frame: ${frameIndex}`);
    console.log(`FIXED UV coordinates: (${u0.toFixed(4)}, ${v0.toFixed(4)}) to (${u1.toFixed(4)}, ${v1.toFixed(4)})`);
    
    // Skip if geometry has no UV attribute
    if (!geometry.attributes || !geometry.attributes.uv) {
      console.warn('Geometry has no UV attributes for sprite animation');
      return;
    }
    
    // Get the UV attribute
    const uvs = geometry.attributes.uv;
    
    try {
      // CORRECTED UV mapping that matches the sprite sheet orientation:
      
      // Bottom left vertex (lower left corner of frame)
      uvs.setXY(0, u0, v0);
      
      // Bottom right vertex (lower right corner of frame)
      uvs.setXY(1, u1, v0);
      
      // Top left vertex (upper left corner of frame)
      uvs.setXY(2, u0, v1);
      
      // Top right vertex (upper right corner of frame)
      if (uvs.count >= 4) {
        uvs.setXY(3, u1, v1);
      }
      
      // Mark UVs as needing an update
      uvs.needsUpdate = true;
      // Mark UVs as needing an update
      uvs.needsUpdate = true;
      
    } catch (error) {
      console.error('Error updating UVs:', error);
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
   * Explicitly sets up the idle sprite
   * Call this manually when you want to force the idle sprite to display
   */
  public showIdleSprite(): void {
    console.log("SHOWING IDLE SPRITE");
    
    // Skip UV operations if we're in a test environment (no real geometry)
    if (!this.mesh || !this.mesh.geometry) {
      console.log("No mesh or geometry found - skipping UV update (likely in test environment)");
      return;
    }
    
    try {
      // Let's try the most basic UV mapping for the idle frame
      const idleFrameIndex = 0;
      const idleRowIndex = SPRITE_CONFIG.IDLE_ROW; // Row 1 (second row)
      
      // Standard mapping calculation
      const frameWidth = 1.0 / SPRITE_CONFIG.FRAMES_PER_ROW;
      const frameHeight = 1.0 / 2; // Two rows in sprite sheet
      
      // Calculate coordinates for the first frame in second row
      const u0 = idleFrameIndex * frameWidth;
      const v0 = idleRowIndex * frameHeight;
      const u1 = u0 + frameWidth;
      const v1 = v0 + frameHeight;
      
      console.log(`IDLE FRAME UVs: (${u0.toFixed(4)}, ${v0.toFixed(4)}) to (${u1.toFixed(4)}, ${v1.toFixed(4)})`);
      
      // Get UVs from the current geometry, with careful null checking
      const geometry = this.mesh.geometry as THREE.BufferGeometry;
      
      // Skip if we don't have attributes or UV data
      if (!geometry.attributes || !geometry.attributes.uv) {
        console.log("No UV attributes available - skipping update");
        return;
      }
      
      const uvs = geometry.attributes.uv;
      
      // Try a different mapping order that might work better with the sprite sheet
      // These are the correct values found through experimentation
      
      // Set each corner of the quad to show the correct part of the sprite sheet
      
      // Let's try a completely different approach for the idle sprite
      // If there are 4 idle frames in the bottom row, we should use them
      
      // Cycle through idle animation frames over time
      // Instead of using a fixed frame, we'll derive the current frame based on time
      // This creates a smooth idle animation using all 4 frames
      
      // Calculate which idle frame to show (0-3)
      // Use a safer approach for getting current time that works in tests too
      let now;
      try {
        now = performance.now() / 1000;  // Current time in seconds
      } catch (e) {
        now = Date.now() / 1000;  // Fallback for environments without performance API
      }
      
      const idleAnimSpeed = 1.5;  // Slower than walking animation for a subtle idle
      
      // Calculate the frame index (0-3) based on time
      const currentIdleFrame = Math.floor((now * idleAnimSpeed) % SPRITE_CONFIG.IDLE_FRAMES);
      
      // Each frame is 1/6 of the texture width
      const frameWidthUV = 1.0 / 6; 
      
      // Calculate U coordinates for this frame
      const idleFrameU0 = currentIdleFrame * frameWidthUV;
      const idleFrameU1 = idleFrameU0 + frameWidthUV;
      
      // Let's use a different approach for vertical coordinates
      // Bottom row - in THREE.js UV space (0,0) is bottom-left
      const idleFrameV0 = 0.0; // Bottom of texture
      const idleFrameV1 = 0.5; // Halfway up texture
      
      console.log(`IDLE ANIMATION: Frame ${currentIdleFrame}/4, UVs: (${idleFrameU0.toFixed(4)}, ${idleFrameV0.toFixed(4)}) to (${idleFrameU1.toFixed(4)}, ${idleFrameV1.toFixed(4)})`);
      
      // Bottom left
      uvs.setXY(0, idleFrameU0, idleFrameV0);
      
      // Bottom right
      uvs.setXY(1, idleFrameU1, idleFrameV0);
      
      // Top left
      uvs.setXY(2, idleFrameU0, idleFrameV1);
      
      // Top right
      uvs.setXY(3, idleFrameU1, idleFrameV1);
      
      uvs.needsUpdate = true;
      console.log("IDLE SPRITE UVs UPDATED");
    } catch (error) {
      console.error("Error updating idle sprite:", error);
    }
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
    // Handle movement state changes
    const stateChanged = (this.isMoving !== wasMoving);
    
    // When state changes, reset animation
    if (stateChanged) {
      this.currentFrame = 0;
      this.animationTimer = 0;
    }
    
    // Animation timing
    this.animationTimer += deltaTime;
    const frameDuration = 1 / SPRITE_CONFIG.ANIMATION_FPS;
    
    // Set appropriate row index for current state
    const rowIndex = this.isMoving ? SPRITE_CONFIG.WALK_ROW : SPRITE_CONFIG.IDLE_ROW;
    
    if (this.isMoving) {
      // For walking animation, cycle through frames
      if (this.animationTimer >= frameDuration) {
        this.animationTimer = 0; // Reset timer
        // Advance frame and loop within walk animation frames
        this.currentFrame = (this.currentFrame + 1) % SPRITE_CONFIG.WALK_FRAMES;
        
        // Update the walking animation frame
        this.updateUVs(this.mesh.geometry as THREE.PlaneGeometry, this.currentFrame, SPRITE_CONFIG.WALK_ROW);
      }
    } else {
      // When not moving, explicitly show the idle sprite
      // This is a special case handled separately
      this.showIdleSprite();
      
      // Continue with direction handling, but skip normal UV updating
    }
    
    // Handle direction changes
    if (this.facingLeft !== wasFacingLeft) {
      this.mesh.scale.x = this.facingLeft ? 1 : -1;
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