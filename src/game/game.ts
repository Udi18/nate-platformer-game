import * as THREE from 'three';
import { createGameScene, createGameCamera, handleResize, GAME_CONFIG } from './scene';
import { createPlatforms, DEFAULT_PLATFORMS } from './platforms';
import type { PlatformDefinition } from './platforms';
import { Player, DEFAULT_PLAYER } from './player';
import { createCollectibles, DEFAULT_COLLECTIBLES } from './collectibles';
import type { Collectible } from './collectibles';
import { createEnemies, DEFAULT_ENEMIES } from './enemies';
import type { Enemy } from './enemies';
import { UIManager } from './ui-manager';
import { generateLevel, DEFAULT_LEVEL_PARAMS } from './level-generator';
import { getCurrentTheme } from './color-config';

const CAMERA_CONFIG = {
  MIN_X: -40,
  MAX_X: 40,
  FOLLOW_SPEED: 5,
  VERTICAL_OFFSET: 0
};

interface GameOptions {
  developmentMode?: boolean;
  useProceduralLevel?: boolean;
  playerColor?: string;
}

const DEFAULT_GAME_OPTIONS: GameOptions = {
  developmentMode: false,
  useProceduralLevel: false,
  playerColor: undefined
};

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  
  private player!: Player;
  private platforms: THREE.Mesh[] = [];
  private collectibles: Collectible[] = [];
  private enemies: Enemy[] = [];
  
  private uiManager: UIManager;
  
  private isPaused: boolean = true;
  private isGameOver: boolean = false;
  private developmentMode: boolean = false;
  private useProceduralLevel: boolean = false;
  
  private currentLevelSeed: number | undefined = undefined;
  
  private minVisibleY: number = -GAME_CONFIG.HEIGHT / 2 - 1;
  private targetCameraX: number = 0;
  
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  
  constructor(engine: any, container: HTMLElement | null = document.getElementById('game-canvas'), options: GameOptions = {}) {
    const mergedOptions = { ...DEFAULT_GAME_OPTIONS, ...options };
    this.developmentMode = mergedOptions.developmentMode;
    this.useProceduralLevel = mergedOptions.useProceduralLevel;
    
    this.scene = createGameScene();
    this.camera = createGameCamera();
    
    try {
      this.renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: false,
        canvas: container instanceof HTMLCanvasElement ? container : undefined
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight, true);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      
      // Only append to container if it's not a canvas element and is a valid HTML element
      if (container && !(container instanceof HTMLCanvasElement)) {
        container.appendChild(this.renderer.domElement);
      } else if (!container) {
        // If no container is provided and we're not using an existing canvas,
        // append to body as a fallback
        document.body.appendChild(this.renderer.domElement);
      }
      
      this.renderer.domElement.style.display = 'block';
      
      // Set clear color explicitly
      const themeColor = getCurrentTheme().background;
      this.renderer.setClearColor(themeColor, 1);
    } catch (error) {
      console.error('Error creating renderer:', error);
      // Fallback to a basic renderer if possible
      this.renderer = new THREE.WebGLRenderer({ antialias: false });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(this.renderer.domElement);
    }
    
    this.uiManager = new UIManager();
    this.player = new Player(DEFAULT_PLAYER, mergedOptions.playerColor);
    
    this.setupGameElements();
    this.setupEventListeners();
    
    this.scene.add(this.player.mesh);
    
    if (!this.useProceduralLevel) {
      this.enemies = createEnemies(this.scene, DEFAULT_ENEMIES);
    }
    
    if (this.developmentMode) {
      this.uiManager.hideMainMenu();
    } else {
      this.uiManager.showMainMenu();
    }
  }
  
  private setupGameElements(): void {
    if (this.useProceduralLevel) {
      const params = {...DEFAULT_LEVEL_PARAMS, seed: this.currentLevelSeed};
      const level = generateLevel(params);
      
      this.currentLevelSeed = level.seed;
      this.platforms = this.createPlatformsWithMeshes(level.platforms);
      this.collectibles = createCollectibles(this.scene, level.collectibles);
      this.enemies = createEnemies(this.scene, level.enemies);
    } else {
      this.platforms = this.createPlatformsWithMeshes(DEFAULT_PLATFORMS);
      this.collectibles = createCollectibles(this.scene, DEFAULT_COLLECTIBLES);
      this.enemies = [];
    }
  }
  
  private createPlatformsWithMeshes(platformDefinitions: PlatformDefinition[]): THREE.Mesh[] {
    const platformMeshes: THREE.Mesh[] = [];
    
    platformDefinitions.forEach(platformDef => {
      const platform = createPlatforms(this.scene, [platformDef]);
      platformMeshes.push(platform[0]);
    });
    
    return platformMeshes;
  }
  
  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      handleResize(this.camera, this.renderer);
    });
    
    window.addEventListener('keydown', (event) => {
      // Prevent default behavior for game control keys to avoid page scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
        event.preventDefault();
      }
      
      // Handle pause key
      if (event.key === 'p' || event.key === 'P') {
        if (!this.isGameOver) {
          this.togglePause();
        }
        return;
      }
      
      // Only register other keys when game is active
      if (!this.isPaused && !this.isGameOver) {
        // Make sure keys object is initialized
        if (!this.player.keys) {
          this.player.keys = {};
        }
        this.player.keys[event.key] = true;
      }
    });
    
    window.addEventListener('keyup', (event) => {
      // Make sure keys object is initialized
      if (!this.player.keys) {
        this.player.keys = {};
      }
      this.player.keys[event.key] = false;
    });
    
    const pauseButton = document.getElementById('pause-button');
    if (pauseButton) {
      pauseButton.addEventListener('click', () => {
        if (!this.isGameOver) {
          this.togglePause();
        }
      });
    }
    
    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
      restartButton.addEventListener('dblclick', () => {
        this.restartGame(false);
      });
    }
    
    const newLevelButton = document.getElementById('new-level-button');
    if (newLevelButton && this.useProceduralLevel) {
      newLevelButton.addEventListener('click', () => {
        this.generateNewLevel();
      });
      newLevelButton.style.display = 'inline-block';
    }
    
    const startButton = document.getElementById('start-button');
    if (startButton) {
      startButton.addEventListener('click', () => {
        this.startGame();
      });
    }
    
    const restartFromGameOverButton = document.getElementById('restart-from-game-over-button');
    if (restartFromGameOverButton) {
      restartFromGameOverButton.addEventListener('click', () => {
        this.restartGame(false);
      });
    }
    
    const newLevelFromGameOverButton = document.getElementById('new-level-from-game-over-button');
    if (newLevelFromGameOverButton && this.useProceduralLevel) {
      newLevelFromGameOverButton.addEventListener('click', () => {
        this.generateNewLevel();
      });
      newLevelFromGameOverButton.style.display = 'inline-block';
    }
  }
  
  public startGame(): void {
    this.uiManager.hideMainMenu();
    this.isPaused = false;
    this.isGameOver = false;
    this.lastTime = performance.now();
  }
  
  /**
   * Load assets and setup game - called by the engine
   */
  public async loadAssets(): Promise<void> {
    // This would normally load assets, but for now just start the game
    
    // Ensure UI manager starts in the right state
    this.uiManager.hideMainMenu();
    this.uiManager.updateScore(0, false);
    
    // Set game state to running
    this.isPaused = false;
    this.isGameOver = false;
    
    // Make sure platforms and entities are visible
    this.scene.add(this.player.mesh);
    
    return Promise.resolve();
  }
  
  /**
   * Update game state - called by the engine each frame
   * @param deltaTime Time in seconds since last frame
   */
  public update(deltaTime: number): void {
    if (this.isPaused || this.isGameOver) {
      return;
    }
    
    const cappedDeltaTime = Math.min(deltaTime, 0.1);
    
    this.enemies.forEach(enemy => {
      enemy.update(cappedDeltaTime);
      enemy.checkPlatformCollisions(this.platforms);
    });
    
    this.player.update(cappedDeltaTime);
    this.player.checkPlatformCollisions(this.platforms);
    
    this.updateCamera(cappedDeltaTime);
    
    const collectedItems = this.player.checkCollectibleCollisions(this.collectibles);
    if (collectedItems.length > 0) {
      this.uiManager.updateScore(collectedItems.length, true);
    }
    
    this.player.checkEnemyCollisions(this.enemies);
    
    if (this.player.checkFallOutOfBounds(this.minVisibleY)) {
      this.handleGameOver();
    }
  }
  
  /**
   * Render the game - called by the engine each frame
   */
  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * Legacy method for standalone use
   */
  public start(): void {
    this.lastTime = performance.now();
    this.animate();
  }
  
  /**
   * Legacy method for standalone use
   */
  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  public togglePause(): void {
    if (this.isGameOver) {
      return;
    }
    
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      this.uiManager.showPauseOverlay();
      
      const pauseButton = document.getElementById('pause-button');
      if (pauseButton) {
        pauseButton.textContent = '▶️ Resume (P)';
      }
    } else {
      this.uiManager.hidePauseOverlay();
      
      const pauseButton = document.getElementById('pause-button');
      if (pauseButton) {
        pauseButton.textContent = '⏸️ Pause (P)';
      }
      
      this.lastTime = performance.now();
    }
  }
  
  private updateCamera(deltaTime: number): void {
    this.targetCameraX = this.player.position.x;
    
    this.targetCameraX = Math.max(
      CAMERA_CONFIG.MIN_X + GAME_CONFIG.WIDTH / 2, 
      Math.min(
        CAMERA_CONFIG.MAX_X - GAME_CONFIG.WIDTH / 2,
        this.targetCameraX
      )
    );
    
    const currentX = this.camera.position.x;
    const newX = currentX + (this.targetCameraX - currentX) * Math.min(1, deltaTime * CAMERA_CONFIG.FOLLOW_SPEED);
    
    this.camera.position.set(
      newX,
      this.camera.position.y + CAMERA_CONFIG.VERTICAL_OFFSET,
      this.camera.position.z
    );
  }

  private handleGameOver(): void {
    if (this.isGameOver) {
      return;
    }
    
    this.isGameOver = true;
    this.uiManager.showGameOver();
  }
  
  public generateNewLevel(): void {
    if (!this.useProceduralLevel) return;
    
    // Clear any held keys first to prevent inputs being carried over
    this.player.keys = {};
    
    this.currentLevelSeed = undefined;
    this.restartGame(true);
  }

  private cleanupGameElements(): void {
    while (this.scene.children.length > 0) {
      const child = this.scene.children[0];
      if (child !== this.camera) {
        this.scene.remove(child);
      } else {
        this.scene.remove(child);
        this.scene.add(child);
      }
    }
    
    if (!this.scene.children.includes(this.camera)) {
      this.scene.add(this.camera);
    }
    
    if (this.player.mesh) {
      this.scene.remove(this.player.mesh);
      if (this.player.mesh.geometry) this.player.mesh.geometry.dispose();
      if (this.player.mesh.material) {
        if (Array.isArray(this.player.mesh.material)) {
          this.player.mesh.material.forEach(m => m.dispose());
        } else {
          this.player.mesh.material.dispose();
        }
      }
    }
    this.player.keys = {};
    
    this.enemies.forEach(enemy => {
      if (enemy.mesh) {
        this.scene.remove(enemy.mesh);
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
    
    this.collectibles.forEach(collectible => {
      if (collectible.mesh) {
        this.scene.remove(collectible.mesh);
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
    
    this.platforms.forEach(platform => {
      this.scene.remove(platform);
      if (platform.geometry) platform.geometry.dispose();
      if (platform.material) {
        if (Array.isArray(platform.material)) {
          platform.material.forEach(m => m.dispose());
        } else {
          platform.material.dispose();
        }
      }
    });
    
    this.enemies = [];
    this.collectibles = [];
    this.platforms = [];
    
    try {
      // Access garbage collection if available in the environment
      const win = window as unknown as { gc?: () => void };
      if (win && win.gc) {
        win.gc();
      }
    } catch (e) {
      // Ignore errors with garbage collection
    }
  }

  public restartGame(generateNewLevel: boolean = false): void {
    this.uiManager.hideGameOver();
    this.isGameOver = false;
    
    if (this.isPaused) {
      this.isPaused = false;
      this.uiManager.hidePauseOverlay();
      
      const pauseButton = document.getElementById('pause-button');
      if (pauseButton) {
        pauseButton.textContent = '⏸️ Pause (P)';
      }
    }
    
    this.uiManager.updateScore(0, false);
    this.cleanupGameElements();
    
    if (generateNewLevel && this.useProceduralLevel) {
      this.currentLevelSeed = undefined;
    }
    
    this.scene = createGameScene();
    
    const oldCamera = this.camera;
    this.camera = createGameCamera();
    
    if (oldCamera) {
      this.camera.position.z = oldCamera.position.z;
    }
    
    this.camera.position.x = 0;
    this.camera.position.y = 0;
    this.targetCameraX = 0;
    
    this.setupGameElements();
    // Fix potential restart bug by passing the URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const windowWithOptions = window as Window & { gameOptions?: { playerColor?: string } };
    const windowGameOptions = windowWithOptions.gameOptions || {};
    const playerColor = urlParams.get('player') || windowGameOptions.playerColor;
    this.player = new Player(DEFAULT_PLAYER, playerColor);
    
    // Ensure all keys are reset to prevent any keys from previous game state from affecting this one
    this.player.keys = {};
    
    this.scene.add(this.player.mesh);
    
    if (!this.useProceduralLevel) {
      this.enemies = createEnemies(this.scene, DEFAULT_ENEMIES);
    }
    
    this.targetCameraX = this.player.position.x;
    this.camera.position.x = this.targetCameraX;
    
    this.renderer.render(this.scene, this.camera);
    
    this.lastTime = performance.now();
  }
  
  /**
   * Legacy animation method, now replaced by the engine-driven update/render
   */
  private animate = (time: number = 0): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    const deltaTime = (time - this.lastTime) / 1000;
    this.lastTime = time;
    
    // Reuse the update method
    this.update(deltaTime);
    
    // Render scene
    this.render();
  }
  
  public destroy(): void {
    this.stop();
    
    window.removeEventListener('resize', () => {
      handleResize(this.camera, this.renderer);
    });
    
    window.removeEventListener('keydown', () => {});
    window.removeEventListener('keyup', () => {});
    
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
    
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}