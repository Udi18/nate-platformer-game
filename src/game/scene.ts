import * as THREE from 'three';

/**
 * Game constants for scene configuration
 */
export const GAME_CONFIG = {
  // Visual settings
  WORLD_UNIT: 100, // 1 world unit = 100 pixels
  BACKGROUND_COLOR: 0x87CEEB, // Sky blue

  // Game area dimensions (in world units)
  WIDTH: 16,  // Standard 16:9 aspect ratio
  HEIGHT: 9,
  
  // Camera settings
  NEAR_PLANE: 0.1,
  FAR_PLANE: 1000,
  CAMERA_Z: 10,
  
  // Layer positions on Z-axis
  LAYERS: {
    BACKGROUND: 0,
    PLATFORMS: 5,
    PLAYER: 6,
    FOREGROUND: 9
  }
};

/**
 * Creates and configures the game scene
 * @returns Configured scene object
 */
export function createGameScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(GAME_CONFIG.BACKGROUND_COLOR);
  
  return scene;
}

/**
 * Creates and configures an orthographic camera for 2D platformer
 * @returns Configured orthographic camera
 */
export function createGameCamera(): THREE.OrthographicCamera {
  // Calculate camera frustum based on game config
  const aspectRatio = window.innerWidth / window.innerHeight;
  const cameraHeight = GAME_CONFIG.HEIGHT;
  const cameraWidth = cameraHeight * aspectRatio;
  
  // Create camera with initial frustum
  const camera = new THREE.OrthographicCamera(
    -cameraWidth / 2, cameraWidth / 2,
    cameraHeight / 2, -cameraHeight / 2,
    GAME_CONFIG.NEAR_PLANE,
    GAME_CONFIG.FAR_PLANE
  );
  
  camera.position.z = GAME_CONFIG.CAMERA_Z;
  
  return camera;
}

/**
 * Handle window resize events, adjusting the camera and renderer
 * @param camera The orthographic camera to adjust
 * @param renderer The renderer to resize
 */
export function handleResize(
  camera: THREE.OrthographicCamera,
  renderer: THREE.WebGLRenderer
): void {
  // Set renderer to full window size without any margins
  renderer.setSize(window.innerWidth, window.innerHeight, true);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Maintain game aspect ratio on resize
  const aspectRatio = window.innerWidth / window.innerHeight;
  const cameraHeight = GAME_CONFIG.HEIGHT;
  const cameraWidth = cameraHeight * aspectRatio;
  
  camera.left = -cameraWidth / 2;
  camera.right = cameraWidth / 2;
  camera.top = cameraHeight / 2;
  camera.bottom = -cameraHeight / 2;
  
  camera.updateProjectionMatrix();
}