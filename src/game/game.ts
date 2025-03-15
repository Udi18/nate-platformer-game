import * as THREE from 'three';
import { createGameScene, createGameCamera, handleResize } from './scene';
import { createPlatforms, PlatformDefinition, DEFAULT_PLATFORMS } from './platforms';
import { Player } from './player';

/**
 * Main game class that manages the game state and rendering
 */
export class Game {
  // Core Three.js components
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  
  // Game elements
  private player!: Player; // Will be initialized in setupGameElements
  private platforms: THREE.Mesh[] = [];
  
  // Time tracking for animation
  private lastTime: number = 0;
  
  // Animation frame ID for cleanup
  private animationFrameId: number | null = null;
  
  /**
   * Initialize the game with the Three.js setup
   * @param container HTML element to attach the renderer to (defaults to document.body)
   */
  constructor(container: HTMLElement = document.body) {
    // Create core Three.js components
    this.scene = createGameScene();
    this.camera = createGameCamera();
    
    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false 
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight, true);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);
    
    // Ensure the canvas takes up the full container
    this.renderer.domElement.style.display = 'block';
    
    // Setup game elements
    this.setupGameElements();
    
    // Setup event listeners
    this.setupEventListeners();
  }
  
  /**
   * Set up the initial game elements
   */
  private setupGameElements(): void {
    // Add platforms to the scene
    this.platforms = this.createPlatformsWithMeshes(DEFAULT_PLATFORMS);
    
    // Create and add player
    this.player = new Player();
    this.scene.add(this.player.mesh);
  }
  
  /**
   * Create platforms and return their meshes for collision detection
   */
  private createPlatformsWithMeshes(platformDefinitions: PlatformDefinition[]): THREE.Mesh[] {
    const platformMeshes: THREE.Mesh[] = [];
    
    platformDefinitions.forEach(platformDef => {
      const platform = createPlatforms(this.scene, [platformDef]);
      // Track the mesh for collision detection
      platformMeshes.push(platform[0]);
    });
    
    return platformMeshes;
  }
  
  /**
   * Set up window event listeners
   */
  private setupEventListeners(): void {
    // Handle window resize
    window.addEventListener('resize', () => {
      handleResize(this.camera, this.renderer);
    });
    
    // Handle keyboard input for player movement
    window.addEventListener('keydown', (event) => {
      this.player.keys[event.key] = true;
    });
    
    window.addEventListener('keyup', (event) => {
      this.player.keys[event.key] = false;
    });
  }
  
  /**
   * Start the game loop
   */
  public start(): void {
    if (this.animationFrameId !== null) {
      return; // Already running
    }
    
    this.lastTime = performance.now();
    this.animate();
  }
  
  /**
   * Stop the game loop
   */
  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Animation loop
   */
  private animate = (time: number = 0): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    // Calculate delta time in seconds
    const deltaTime = (time - this.lastTime) / 1000;
    this.lastTime = time;
    
    // Limit delta time to prevent large jumps after tab switching
    const cappedDeltaTime = Math.min(deltaTime, 0.1);
    
    // Update player
    this.player.update(cappedDeltaTime);
    
    // Check collisions
    this.player.checkPlatformCollisions(this.platforms);
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Clean up resources when game is destroyed
   */
  public destroy(): void {
    this.stop();
    
    // Remove event listeners
    window.removeEventListener('resize', () => {
      handleResize(this.camera, this.renderer);
    });
    
    window.removeEventListener('keydown', () => {});
    window.removeEventListener('keyup', () => {});
    
    // Remove renderer from DOM
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}