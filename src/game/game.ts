import * as THREE from 'three';
import { createGameScene, createGameCamera, handleResize } from './scene';
import { createPlatforms, PlatformDefinition, DEFAULT_PLATFORMS } from './platforms';
import { Player } from './player';
import { createCollectibles, Collectible, DEFAULT_COLLECTIBLES } from './collectibles';
import { createEnemies, Enemy, DEFAULT_ENEMIES } from './enemies';
import { UIManager } from './ui-manager';

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
  private collectibles: Collectible[] = [];
  private enemies: Enemy[] = [];
  
  // UI elements
  private uiManager: UIManager;
  
  // Game state
  private isPaused: boolean = false;
  
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
    
    // Initialize UI managers
    this.uiManager = new UIManager();
    
    // Setup game elements
    this.setupGameElements();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Add player to the scene
    this.scene.add(this.player.mesh);
    
    // Add enemies to the scene
    this.enemies = createEnemies(this.scene, DEFAULT_ENEMIES);
  }
  
  /**
   * Set up the initial game elements
   */
  private setupGameElements(): void {
    // Add platforms to the scene
    this.platforms = this.createPlatformsWithMeshes(DEFAULT_PLATFORMS);
    
    // Create and add collectibles
    this.collectibles = createCollectibles(this.scene, DEFAULT_COLLECTIBLES);
    
    // Create player but don't add to scene yet
    this.player = new Player();
    
    // Initialize enemies as empty array, they will be created when game starts
    this.enemies = [];
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
      // 'P' key to toggle pause
      if (event.key === 'p' || event.key === 'P') {
        this.togglePause();
        return;
      }
      
      // Only register keys when game is not paused
      if (!this.isPaused) {
        this.player.keys[event.key] = true;
      }
    });
    
    window.addEventListener('keyup', (event) => {
      // Always register key up events to prevent stuck keys
      this.player.keys[event.key] = false;
    });
    
    // Setup pause button
    const pauseButton = document.getElementById('pause-button');
    if (pauseButton) {
      pauseButton.addEventListener('click', () => {
        this.togglePause();
      });
    }
    
    // Setup restart button to require double-click
    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
      restartButton.addEventListener('dblclick', () => {
        // Require a double-click to restart
        this.restartGame();
      });
    }
  }
  
  // Removed startGame method
  
  /**
   * Start the game initialization (public API)
   */
  public start(): void {
    // Start the animation loop
    this.lastTime = performance.now();
    this.animate();
    
    console.log('Game started directly');
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
   * Toggle game pause state
   */
  public togglePause(): void {
    this.isPaused = !this.isPaused;
    
    // Get pause overlay and button
    const pauseOverlay = document.getElementById('pause-overlay');
    const pauseButton = document.getElementById('pause-button');
    
    if (this.isPaused) {
      // Show pause overlay
      if (pauseOverlay) {
        pauseOverlay.style.display = 'flex';
      }
      
      // Update pause button text
      if (pauseButton) {
        pauseButton.textContent = '▶️ Resume (P)';
      }
      
      console.log('Game paused');
    } else {
      // Hide pause overlay
      if (pauseOverlay) {
        pauseOverlay.style.display = 'none';
      }
      
      // Update pause button text
      if (pauseButton) {
        pauseButton.textContent = '⏸️ Pause (P)';
      }
      
      // Reset time to prevent large delta time after resuming
      this.lastTime = performance.now();
      
      console.log('Game resumed');
    }
  }
  
  /**
   * Restart the game
   */
  public restartGame(): void {
    console.log('Restarting game...');
    
    // Reset pause state if paused
    if (this.isPaused) {
      this.togglePause();
    }
    
    // Reset score
    this.uiManager.updateScore(0, false);
    
    // Remove existing player and enemies from scene
    this.scene.remove(this.player.mesh);
    this.enemies.forEach(enemy => {
      this.scene.remove(enemy.mesh);
    });
    
    // Remove existing collectibles from scene
    this.collectibles.forEach(collectible => {
      this.scene.remove(collectible.mesh);
    });
    
    // Recreate game elements
    this.setupGameElements();
    
    // Add player to scene
    this.scene.add(this.player.mesh);
    
    // Add enemies to scene
    this.enemies = createEnemies(this.scene, DEFAULT_ENEMIES);
    
    // Reset time tracking
    this.lastTime = performance.now();
    
    console.log('Game restarted');
  }
  
  /**
   * Animation loop
   */
  private animate = (time: number = 0): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    // Always render the scene, even when paused
    this.renderer.render(this.scene, this.camera);
    
    // If game is paused, don't update
    if (this.isPaused) {
      return;
    }
    
    // Calculate delta time in seconds
    const deltaTime = (time - this.lastTime) / 1000;
    this.lastTime = time;
    
    // Limit delta time to prevent large jumps after tab switching
    const cappedDeltaTime = Math.min(deltaTime, 0.1);
    
    // Update enemies
    this.enemies.forEach(enemy => {
      enemy.update(cappedDeltaTime);
      enemy.checkPlatformCollisions(this.platforms);
    });
    
    // Update player
    this.player.update(cappedDeltaTime);
    this.player.checkPlatformCollisions(this.platforms);
    
    // Check collectible collisions
    const collectedItems = this.player.checkCollectibleCollisions(this.collectibles);
    if (collectedItems.length > 0) {
      this.uiManager.updateScore(collectedItems.length, true);
      console.log(`Collected items: ${collectedItems.length}. Total score: ${this.uiManager.getScore()}`);
    }
    
    // Check enemy collisions
    this.player.checkEnemyCollisions(this.enemies);
  }
  
  // Comment removed
  
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
    
    // Remove button event listeners
    const pauseButton = document.getElementById('pause-button');
    if (pauseButton) {
      pauseButton.removeEventListener('click', () => {
        this.togglePause();
      });
    }
    
    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
      restartButton.removeEventListener('dblclick', () => {
        this.restartGame();
      });
    }
    
    // Remove renderer from DOM
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}