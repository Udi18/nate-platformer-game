import * as THREE from 'three';
import { GAME_CONFIG } from './scene';
import { getCurrentTheme, PlatformColor } from './color-config';

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
    width: 42,  // Extended ground platform (42 units wide)
    height: .5,
    position: {
      x: 0,
      y: -4.3  // Bottom of the screen
    },
    // Colors are now managed by the theme system
    // and will be applied in the constructor
  },
  
  // Middle platform
  {
    width: 6,
    height: 0.5,
    position: {
      x: -2,
      y: -2.5  // Adjusted higher for better jumping
    },
    // Colors are now managed by the theme system
  },
  
  // Upper platform (lowered to be reachable)
  {
    width: 4,
    height: 0.5,
    position: {
      x: 3,
      y: -1.2  // Lowered to be reachable
    },
    // Colors are now managed by the theme system
  },
  
  // Small stepping platform to help reach upper platform
  {
    width: 2,
    height: 0.5,
    position: {
      x: 0.5,
      y: 0.7  // Between middle and upper platforms
    },
    // Colors are now managed by the theme system
  },
  
  // Left side extended platforms
  {
    width: 6,
    height: 0.5,
    position: {
      x: -10,
      y: -3  // Slightly above ground
    },
    // Colors are now managed by the theme system
  },
  {
    width: 4,
    height: 0.5,
    position: {
      x: -16,
      y: -2  // Higher platform
    },
    // Colors are now managed by the theme system
  },
  
  // Right side extended platforms
  {
    width: 5,
    height: 0.5,
    position: {
      x: 12,
      y: -3  // Slightly above ground
    },
    // Colors are now managed by the theme system
  },
  {
    width: 4,
    height: 0.5,
    position: {
      x: 18,
      y: -2  // Higher platform
    },
    // Colors are now managed by the theme system
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
    color: platform.color || getCurrentTheme().platform,
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
 * @returns Array of created platform meshes
 */
export function createPlatforms(
  scene: THREE.Scene,
  platformDefinitions: PlatformDefinition[] = DEFAULT_PLATFORMS
): THREE.Mesh[] {
  const platforms: THREE.Mesh[] = [];
  
  platformDefinitions.forEach(platformDef => {
    const platform = createPlatform(platformDef);
    scene.add(platform);
    platforms.push(platform);
  });
  
  return platforms;
}