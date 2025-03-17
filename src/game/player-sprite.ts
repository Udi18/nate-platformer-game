import * as THREE from 'three';

export const SPRITE_CONFIG = {
  SHEET_WIDTH: 750,
  SHEET_HEIGHT: 250,
  FRAME_WIDTH: 125,
  FRAME_HEIGHT: 125,
  FRAMES_PER_ROW: 6,
  IDLE_ROW: 1,  // Bottom row - Idle animation
  WALK_ROW: 0,  // Top row - Walking animation
  IDLE_FPS: 4,
  WALK_FPS: 8,
  IDLE_FRAMES: 4,
  WALK_FRAMES: 6
};

export class PlayerSprite {
  private texture: THREE.Texture;
  private material: THREE.MeshBasicMaterial;
  private currentFrame: number = 0;
  private animationTimer: number = 0;
  private isMoving: boolean = false;
  private facingLeft: boolean = false;
  
  constructor(texturePath: string) {
    // Load the sprite sheet texture
    const textureLoader = new THREE.TextureLoader();
    this.texture = textureLoader.load(texturePath);
    
    // Fix texture settings for pixel-perfect rendering
    this.texture.flipY = false;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.generateMipmaps = false;
    
    // Create sprite material (showing original sprite colors)
    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      side: THREE.DoubleSide
    });
  }
  
  /**
   * Get the material for rendering the sprite
   */
  public getMaterial(): THREE.MeshBasicMaterial {
    return this.material;
  }
  
  /**
   * Update sprite animation based on player state
   * @param deltaTime Time since last frame in seconds
   * @param isMoving Whether the player is currently moving
   * @param facingLeft Whether the player is facing left
   * @param mesh The mesh to update UVs on
   */
  public updateAnimation(deltaTime: number, isMoving: boolean, facingLeft: boolean, mesh: THREE.Mesh): void {
    // Track state
    const wasMoving = this.isMoving;
    this.isMoving = isMoving;
    this.facingLeft = facingLeft;
    
    // Handle state change
    if (isMoving !== wasMoving) {
      // Reset animation when switching states
      this.animationTimer = 0;
      this.currentFrame = 0;
      
      // Update frame immediately with new animation state
      this.updateSpriteFrame(0, mesh, isMoving ? SPRITE_CONFIG.WALK_ROW : SPRITE_CONFIG.IDLE_ROW);
    }
    
    // Increment animation timer
    this.animationTimer += deltaTime;
    
    // Set frame rate based on animation state
    const fps = isMoving ? SPRITE_CONFIG.WALK_FPS : SPRITE_CONFIG.IDLE_FPS;
    const frameDuration = 1.0 / fps;
    
    // Update frame when timer exceeds frame duration
    if (this.animationTimer >= frameDuration) {
      // Calculate how many frames to advance (handles lag)
      const framesToAdvance = Math.floor(this.animationTimer / frameDuration);
      this.animationTimer %= frameDuration;
      
      // Get max frames for current animation
      const maxFrames = isMoving ? SPRITE_CONFIG.WALK_FRAMES : SPRITE_CONFIG.IDLE_FRAMES;
      
      // Update current frame and wrap around
      this.currentFrame = (this.currentFrame + framesToAdvance) % maxFrames;
      
      // Set the appropriate row index for current state
      const rowIndex = isMoving ? SPRITE_CONFIG.WALK_ROW : SPRITE_CONFIG.IDLE_ROW;
      
      // Update sprite frame
      this.updateSpriteFrame(this.currentFrame, mesh, rowIndex);
    }
  }
  
  /**
   * Update sprite frame UV coordinates
   * @param frameIndex The horizontal frame index (0-5)
   * @param mesh The mesh to update UVs on
   * @param rowIndex The vertical row index (0=top row, 1=bottom row)
   */
  private updateSpriteFrame(frameIndex: number, mesh: THREE.Mesh, rowIndex: number): void {
    if (!mesh?.geometry) {
      return;
    }
    
    try {
      frameIndex = frameIndex % (rowIndex === SPRITE_CONFIG.IDLE_ROW 
        ? SPRITE_CONFIG.IDLE_FRAMES 
        : SPRITE_CONFIG.WALK_FRAMES);
      
      const geometry = mesh.geometry as THREE.BufferGeometry;
      
      if (!geometry.attributes?.uv) {
        return;
      }
      
      const uvs = geometry.attributes.uv;
      const frameWidth = 1.0 / SPRITE_CONFIG.FRAMES_PER_ROW;
      
      const u0 = frameIndex * frameWidth;
      const u1 = u0 + frameWidth;
      
      // In UV coordinates, v=0 is bottom, v=1 is top
      // Row 0 (top row) maps to v0=0.5, v1=1.0
      // Row 1 (bottom row) maps to v0=0.0, v1=0.5
      let v0, v1;
      if (rowIndex === 0) { // Top row (walking)
        v0 = 0.5;
        v1 = 1.0;
      } else { // Bottom row (idle)
        v0 = 0.0;
        v1 = 0.5;
      }
      
      // Adjust UV coordinates based on facing direction
      if (this.facingLeft) {
        // Swap u0 and u1 to flip texture horizontally
        uvs.setXY(0, u1, v0); // Bottom right
        uvs.setXY(1, u0, v0); // Bottom left
        uvs.setXY(2, u1, v1); // Top right
        
        if (uvs.count >= 4) {
          uvs.setXY(3, u0, v1); // Top left
        }
      } else {
        // Normal UV assignment (facing right)
        uvs.setXY(0, u0, v0); // Bottom left
        uvs.setXY(1, u1, v0); // Bottom right
        uvs.setXY(2, u0, v1); // Top left
        
        if (uvs.count >= 4) {
          uvs.setXY(3, u1, v1); // Top right
        }
      }
      
      // Mark UVs as needing an update
      uvs.needsUpdate = true;
    } catch (error) {
      console.error('Error updating sprite frame:', error);
    }
  }
  
  /**
   * Set the initial sprite frame
   * @param mesh The mesh to update
   * @param isMoving Whether the player is moving
   */
  public setInitialFrame(mesh: THREE.Mesh, isMoving: boolean = false): void {
    this.isMoving = isMoving;
    this.updateSpriteFrame(0, mesh, isMoving ? SPRITE_CONFIG.WALK_ROW : SPRITE_CONFIG.IDLE_ROW);
  }
}