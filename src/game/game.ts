import * as THREE from 'three';
import { createGameScene, createGameCamera, handleResize } from './scene';
import { createPlatforms } from './platforms';

/**
 * Main game class that manages the game state and rendering
 */
export class Game {
  // Core Three.js components
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  
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
    createPlatforms(this.scene);
  }
  
  /**
   * Set up window event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      handleResize(this.camera, this.renderer);
    });
  }
  
  /**
   * Start the game loop
   */
  public start(): void {
    if (this.animationFrameId !== null) {
      return; // Already running
    }
    
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
  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    // Update game logic here (will be expanded later)
    
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
    
    // Remove renderer from DOM
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}