import * as THREE from 'three';
import { createGameScene, createGameCamera, handleResize, GAME_CONFIG } from './scene';
import { createPlatforms, PlatformDefinition, DEFAULT_PLATFORMS } from './platforms';
import { Player } from './player';
import { createCollectibles, Collectible, DEFAULT_COLLECTIBLES } from './collectibles';
import { createEnemies, Enemy, DEFAULT_ENEMIES } from './enemies';
import { UIManager } from './ui-manager';
import { generateLevel, DEFAULT_LEVEL_PARAMS } from './level-generator';

// Camera follow configuration
const CAMERA_CONFIG = {
  // Horizontal bounds of the level
  MIN_X: -40, // Extended left boundary for procedural level
  MAX_X: 40,  // Extended right boundary for procedural level
  
  // Follow smoothness (lower = smoother)
  FOLLOW_SPEED: 5,
  
  // Vertical offset (to adjust camera height)
  VERTICAL_OFFSET: 0
};

// Define game options interface
interface GameOptions {
  developmentMode?: boolean;
  useProceduralLevel?: boolean; // Option to use procedural level instead of defaults
}

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
  private isPaused: boolean = true; // Start paused by default
  private isGameOver: boolean = false;
  private developmentMode: boolean = false;
  private useProceduralLevel: boolean = false;
  
  // Level generation
  private currentLevelSeed: number | undefined = undefined; // Store current level seed
  
  // Camera boundaries and tracking
  private minVisibleY: number = -GAME_CONFIG.HEIGHT / 2 - 1; // 1 unit below visible area
  private targetCameraX: number = 0; // Target X position for camera
  
  // Time tracking for animation
  private lastTime: number = 0;
  
  // Animation frame ID for cleanup
  private animationFrameId: number | null = null;
  
  /**
   * Initialize the game with the Three.js setup
   * @param container HTML element to attach the renderer to (defaults to document.body)
   * @param options Game configuration options
   */
  constructor(container: HTMLElement = document.body, options: GameOptions = {}) {
    // Set options
    this.developmentMode = options.developmentMode || false;
    this.useProceduralLevel = options.useProceduralLevel || false;
    
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
    
    // Create a new player
    this.player = new Player();
    
    // Setup game elements
    this.setupGameElements();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Add player to the scene
    this.scene.add(this.player.mesh);
    
    // Add enemies to the scene if not already added by procedural generator
    if (!this.useProceduralLevel) {
      this.enemies = createEnemies(this.scene, DEFAULT_ENEMIES);
    }
    
    // In development mode, skip the main menu but remain paused
    if (this.developmentMode) {
      // Stay paused but don't show the main menu
      this.uiManager.hideMainMenu(); // Explicitly hide the main menu
      console.log('Game initialized in development mode (skipping start screen)');
    } else {
      // Show the main menu at start
      this.uiManager.showMainMenu();
      console.log('Game initialized in normal mode (showing start screen)');
    }
  }
  
  /**
   * Set up the initial game elements
   */
  private setupGameElements(): void {
    if (this.useProceduralLevel) {
      // Generate a procedural level with seed for consistency
      console.log('Generating procedural level...');
      
      // For consistency on restart, keep using the same seed
      const params = {...DEFAULT_LEVEL_PARAMS, seed: this.currentLevelSeed};
      const level = generateLevel(params);
      
      // Save the seed for consistent regeneration
      this.currentLevelSeed = level.seed;
      
      // Add platforms to the scene
      this.platforms = this.createPlatformsWithMeshes(level.platforms);
      
      // Create and add collectibles
      this.collectibles = createCollectibles(this.scene, level.collectibles);
      
      // Create enemies and add to the scene
      this.enemies = createEnemies(this.scene, level.enemies);
      
      console.log(`Procedural level created with seed ${level.seed}, ${level.platforms.length} platforms, ${level.enemies.length} enemies, and ${level.collectibles.length} collectibles`);
    } else {
      // Use default level
      // Add platforms to the scene
      this.platforms = this.createPlatformsWithMeshes(DEFAULT_PLATFORMS);
      
      // Create and add collectibles
      this.collectibles = createCollectibles(this.scene, DEFAULT_COLLECTIBLES);
      
      // Initialize enemies as empty array, they will be created when game starts
      this.enemies = [];
    }
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
      // Make sure we use the current camera
      handleResize(this.camera, this.renderer);
    });
    
    // Handle keyboard input for player movement
    window.addEventListener('keydown', (event) => {
      // 'P' key to toggle pause
      if (event.key === 'p' || event.key === 'P') {
        // Only pause/unpause if the game is not in game over state
        if (!this.isGameOver) {
          this.togglePause();
        }
        return;
      }
      
      // Only register keys when game is not paused and not game over
      if (!this.isPaused && !this.isGameOver) {
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
        if (!this.isGameOver) {
          this.togglePause();
        }
      });
    }
    
    // Setup restart button to require double-click
    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
      restartButton.addEventListener('dblclick', () => {
        // Require a double-click to restart
        this.restartGame(false); // Restart with same level
      });
    }
    
    // Setup new level button if it exists
    const newLevelButton = document.getElementById('new-level-button');
    if (newLevelButton && this.useProceduralLevel) {
      newLevelButton.addEventListener('click', () => {
        this.generateNewLevel();
      });
      // Only show this button if procedural level is enabled
      newLevelButton.style.display = 'inline-block';
    }
    
    // Setup start button
    const startButton = document.getElementById('start-button');
    if (startButton) {
      startButton.addEventListener('click', () => {
        this.startGame();
      });
    }
    
    // Setup the restart from game over button
    const restartFromGameOverButton = document.getElementById('restart-from-game-over-button');
    if (restartFromGameOverButton) {
      restartFromGameOverButton.addEventListener('click', () => {
        this.restartGame(false); // Restart with same level
      });
    }
    
    // Setup the new level from game over button if it exists
    const newLevelFromGameOverButton = document.getElementById('new-level-from-game-over-button');
    if (newLevelFromGameOverButton && this.useProceduralLevel) {
      newLevelFromGameOverButton.addEventListener('click', () => {
        this.generateNewLevel();
      });
      // Only show if procedural level is enabled
      newLevelFromGameOverButton.style.display = 'inline-block';
    }
  }
  
  /**
   * Start the game from the main menu
   */
  public startGame(): void {
    // Hide main menu
    this.uiManager.hideMainMenu();
    
    // Unpause the game
    this.isPaused = false;
    
    // Reset state if needed
    this.isGameOver = false;
    
    // Reset time to prevent large delta time
    this.lastTime = performance.now();
    
    console.log('Game started from main menu');
  }
  
  /**
   * Start the game initialization (public API)
   */
  public start(): void {
    // Start the animation loop
    this.lastTime = performance.now();
    this.animate();
    
    if (this.developmentMode) {
      console.log('Game animation loop started (development mode)');
    } else {
      console.log('Game animation loop started (normal mode - paused at start)');
    }
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
    // Don't toggle pause if in game over state
    if (this.isGameOver) {
      return;
    }
    
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      // Show pause overlay via UI manager
      this.uiManager.showPauseOverlay();
      
      // Update pause button text
      const pauseButton = document.getElementById('pause-button');
      if (pauseButton) {
        pauseButton.textContent = '▶️ Resume (P)';
      }
      
      console.log('Game paused');
    } else {
      // Hide pause overlay via UI manager
      this.uiManager.hidePauseOverlay();
      
      // Update pause button text
      const pauseButton = document.getElementById('pause-button');
      if (pauseButton) {
        pauseButton.textContent = '⏸️ Pause (P)';
      }
      
      // Reset time to prevent large delta time after resuming
      this.lastTime = performance.now();
      
      console.log('Game resumed');
    }
  }
  
  /**
   * Update camera position to smoothly follow the player
   * @param deltaTime Time since last frame in seconds
   */
  private updateCamera(deltaTime: number): void {
    // Calculate target camera position based on player position
    this.targetCameraX = this.player.position.x;
    
    // Clamp camera position within level boundaries
    this.targetCameraX = Math.max(
      CAMERA_CONFIG.MIN_X + GAME_CONFIG.WIDTH / 2, 
      Math.min(
        CAMERA_CONFIG.MAX_X - GAME_CONFIG.WIDTH / 2,
        this.targetCameraX
      )
    );
    
    // Smoothly interpolate current camera position toward target position
    const currentX = this.camera.position.x;
    const newX = currentX + (this.targetCameraX - currentX) * Math.min(1, deltaTime * CAMERA_CONFIG.FOLLOW_SPEED);
    
    // Update camera position (only X axis, keep Y and Z unchanged)
    this.camera.position.set(
      newX,
      this.camera.position.y + CAMERA_CONFIG.VERTICAL_OFFSET,
      this.camera.position.z
    );
  }

  /**
   * Handle game over state
   */
  private handleGameOver(): void {
    if (this.isGameOver) {
      return; // Already in game over state
    }
    
    console.log('Game over triggered!');
    this.isGameOver = true;
    
    // Show game over overlay
    this.uiManager.showGameOver();
  }
  
  /**
   * Generate a new level with a different seed
   * This is useful when the player wants a completely new level layout
   */
  public generateNewLevel(): void {
    console.log('Generating new level...');
    
    // Only applicable if using procedural level
    if (!this.useProceduralLevel) return;
    
    // Clear the current seed to force generation of a new one
    this.currentLevelSeed = undefined;
    
    // Perform a full restart with a new seed
    this.restartGame(true);
    
    console.log('New level generated with seed:', this.currentLevelSeed);
  }

  /**
   * Clean up game elements from the scene
   * This must be thorough to prevent duplicated objects
   */
  private cleanupGameElements(): void {
    // First, remove all meshes from the scene except the camera
    // This ensures no game elements remain
    while (this.scene.children.length > 0) {
      const child = this.scene.children[0];
      if (child !== this.camera) {
        this.scene.remove(child);
      } else {
        // If it's the camera, move it to the end of the array
        this.scene.remove(child);
        this.scene.add(child);
      }
    }
    
    // Re-add camera if it was removed
    if (!this.scene.children.includes(this.camera)) {
      this.scene.add(this.camera);
    }
    
    // Explicitly remove each game element to be thorough
    // Remove existing player if it exists
    if (this.player && this.player.mesh) {
      this.scene.remove(this.player.mesh);
      // Dispose of player mesh resources
      if (this.player.mesh.geometry) this.player.mesh.geometry.dispose();
      if (this.player.mesh.material) {
        if (Array.isArray(this.player.mesh.material)) {
          this.player.mesh.material.forEach(m => m.dispose());
        } else {
          this.player.mesh.material.dispose();
        }
      }
      // Clear player references
      this.player.keys = {}; // Clear any key states
    }
    
    // Remove existing enemies
    this.enemies.forEach(enemy => {
      if (enemy.mesh) {
        this.scene.remove(enemy.mesh);
        // Dispose of geometries and materials to prevent memory leaks
        if (enemy.mesh.geometry) enemy.mesh.geometry.dispose();
        if (enemy.mesh.material) {
          if (Array.isArray(enemy.mesh.material)) {
            enemy.mesh.material.forEach(m => m.dispose());
          } else {
            enemy.mesh.material.dispose();
          }
        }
      }
    });
    
    // Remove existing collectibles
    this.collectibles.forEach(collectible => {
      if (collectible.mesh) {
        this.scene.remove(collectible.mesh);
        // Dispose of geometries and materials
        if (collectible.mesh.geometry) collectible.mesh.geometry.dispose();
        if (collectible.mesh.material) {
          if (Array.isArray(collectible.mesh.material)) {
            collectible.mesh.material.forEach(m => m.dispose());
          } else {
            collectible.mesh.material.dispose();
          }
        }
      }
    });
    
    // Remove existing platforms
    this.platforms.forEach(platform => {
      this.scene.remove(platform);
      // Dispose of geometries and materials
      if (platform.geometry) platform.geometry.dispose();
      if (platform.material) {
        if (Array.isArray(platform.material)) {
          platform.material.forEach(m => m.dispose());
        } else {
          platform.material.dispose();
        }
      }
    });
    
    // Clear arrays
    this.enemies = [];
    this.collectibles = [];
    this.platforms = [];
    
    // Force a garbage collection hint (not guaranteed to run)
    // This is just a hint and may not be available in all browsers
    try {
      if (window && (window as any).gc) {
        (window as any).gc();
      }
    } catch (e) {
      // Ignore errors with garbage collection
    }
  }

  /**
   * Restart the game
   * @param generateNewLevel If true, generates a completely new level layout
   */
  public restartGame(generateNewLevel: boolean = false): void {
    console.log('Restarting game...');
    
    // Hide game over overlay if shown
    this.uiManager.hideGameOver();
    
    // Reset game state
    this.isGameOver = false;
    
    // Reset pause state if paused
    if (this.isPaused) {
      this.isPaused = false;
      this.uiManager.hidePauseOverlay();
      
      // Update pause button text
      const pauseButton = document.getElementById('pause-button');
      if (pauseButton) {
        pauseButton.textContent = '⏸️ Pause (P)';
      }
    }
    
    // Reset score
    this.uiManager.updateScore(0, false);
    
    // Clean up all existing scene elements
    this.cleanupGameElements();
    
    // If requested, clear the level seed to get a new level
    if (generateNewLevel && this.useProceduralLevel) {
      this.currentLevelSeed = undefined;
    }
    
    // Recreate the scene from scratch to ensure full cleanup
    this.scene = createGameScene();
    
    // Store the current camera to preserve its settings
    const oldCamera = this.camera;
    
    // Create a new camera
    this.camera = createGameCamera();
    
    // Copy position from old camera if it exists
    if (oldCamera) {
      this.camera.position.z = oldCamera.position.z;
    }
    
    // Reset camera position
    this.camera.position.x = 0;
    this.camera.position.y = 0;
    this.targetCameraX = 0;
    
    // Recreate game elements (using the same seed if not generating new level)
    this.setupGameElements();
    
    // Recreate the player from scratch with default position (important for reset)
    this.player = new Player();
    
    // Add player to scene
    this.scene.add(this.player.mesh);
    
    // Add enemies to scene if not using procedural level (otherwise they're already added)
    if (!this.useProceduralLevel) {
      this.enemies = createEnemies(this.scene, DEFAULT_ENEMIES);
    }
    
    // Reset camera position to focus on player's starting position
    this.targetCameraX = this.player.position.x;
    this.camera.position.x = this.targetCameraX;
    
    // Make sure the camera is being used by the renderer
    this.renderer.render(this.scene, this.camera);
    
    // Reset time tracking
    this.lastTime = performance.now();
    
    console.log('Game restarted with clean scene');
  }
  
  /**
   * Animation loop
   */
  private animate = (time: number = 0): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    // Always render the scene, even when paused
    this.renderer.render(this.scene, this.camera);
    
    // If game is paused or game over, don't update
    if (this.isPaused || this.isGameOver) {
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
    
    // Update camera to follow player
    this.updateCamera(cappedDeltaTime);
    
    // Check collectible collisions
    const collectedItems = this.player.checkCollectibleCollisions(this.collectibles);
    if (collectedItems.length > 0) {
      this.uiManager.updateScore(collectedItems.length, true);
      console.log(`Collected items: ${collectedItems.length}. Total score: ${this.uiManager.getScore()}`);
    }
    
    // Check enemy collisions (but don't end game on enemy collision)
    this.player.checkEnemyCollisions(this.enemies);
    
    // Check if player has fallen below the play area (game over condition)
    if (this.player.checkFallOutOfBounds(this.minVisibleY)) {
      this.handleGameOver();
    }
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
        this.restartGame(false);
      });
    }
    
    const newLevelButton = document.getElementById('new-level-button');
    if (newLevelButton) {
      newLevelButton.removeEventListener('click', () => {
        this.generateNewLevel();
      });
    }
    
    const startButton = document.getElementById('start-button');
    if (startButton) {
      startButton.removeEventListener('click', () => {
        this.startGame();
      });
    }
    
    const restartFromGameOverButton = document.getElementById('restart-from-game-over-button');
    if (restartFromGameOverButton) {
      restartFromGameOverButton.removeEventListener('click', () => {
        this.restartGame(false);
      });
    }
    
    const newLevelFromGameOverButton = document.getElementById('new-level-from-game-over-button');
    if (newLevelFromGameOverButton) {
      newLevelFromGameOverButton.removeEventListener('click', () => {
        this.generateNewLevel();
      });
    }
    
    // Remove renderer from DOM
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}