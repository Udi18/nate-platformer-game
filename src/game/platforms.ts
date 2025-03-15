import * as THREE from 'three';
import { GAME_CONFIG } from './scene';

/**
 * Platform definition interface
 */
export interface PlatformDefinition {
  width: number;
  height: number;
  position: {
    x: number;
    y: number;
  };
  color?: number;
}

/**
 * Default platform configurations
 */
export const DEFAULT_PLATFORMS: PlatformDefinition[] = [
  // Ground platform
  {
    width: 20,  // Full width of the view
    height: .5,
    position: {
      x: 0,
      y: -4.3  // Bottom of the screen
    },
    color: 0x8B4513  // Brown
  },
  
  // Middle platform
  {
    width: 6,
    height: 0.5,
    position: {
      x: -2,
      y: 0
    },
    color: 0x8B4513
  },
  
  // Upper platform
  {
    width: 4,
    height: 0.5,
    position: {
      x: 4,
      y: 2
    },
    color: 0x8B4513
  }
];

/**
 * Creates a platform mesh based on the provided definition
 * @param platform Platform definition containing dimensions and position
 * @returns THREE.Mesh representing the platform
 */
export function createPlatform(platform: PlatformDefinition): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(
    platform.width,
    platform.height
  );
  
  const material = new THREE.MeshBasicMaterial({
    color: platform.color || 0x8B4513,
    side: THREE.DoubleSide
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  
  // Position the platform
  mesh.position.set(
    platform.position.x,
    platform.position.y,
    GAME_CONFIG.LAYERS.PLATFORMS
  );
  
  return mesh;
}

/**
 * Creates all platforms and adds them to the scene
 * @param scene The scene to add platforms to
 * @param platformDefinitions Array of platform definitions (optional)
 */
export function createPlatforms(
  scene: THREE.Scene,
  platformDefinitions: PlatformDefinition[] = DEFAULT_PLATFORMS
): void {
  platformDefinitions.forEach(platformDef => {
    const platform = createPlatform(platformDef);
    scene.add(platform);
  });
}