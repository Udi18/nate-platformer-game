import * as THREE from 'three';
import { GAME_CONFIG } from './scene';
import { getCurrentTheme, CollectibleColor } from './color-config';

/**
 * Collectible definition interface
 */
export interface CollectibleDefinition {
  radius: number;
  position: {
    x: number;
    y: number;
  };
  color?: number;
  isCollected?: boolean;
}

/**
 * Default collectible configurations
 */
export const DEFAULT_COLLECTIBLES: CollectibleDefinition[] = [
  // Collectible on ground platform
  {
    radius: 0.3,
    position: {
      x: 4,
      y: -3.5
    },
    // Colors are now managed by the theme system
    // and will be applied in the constructor
  },
  
  // Collectible on middle platform
  {
    radius: 0.3,
    position: {
      x: -3,
      y: 0.5
    },
    // Colors are now managed by the theme system
    // and will be applied in the constructor
  },
  
  // Collectible on the stepping platform
  {
    radius: 0.3,
    position: {
      x: 0.5,
      y: 1.2
    },
    // Colors are now managed by the theme system
    // and will be applied in the constructor
  },
  
  // Collectible on upper platform
  {
    radius: 0.3,
    position: {
      x: 3.5,
      y: 1.7
    },
    // Colors are now managed by the theme system
    // and will be applied in the constructor
  },
  
  // Left extended area collectibles
  {
    radius: 0.3,
    position: {
      x: -10,
      y: -2.3
    },
    // Colors are now managed by the theme system
    // and will be applied in the constructor
  },
  {
    radius: 0.3,
    position: {
      x: -16,
      y: -1.3
    },
    // Colors are now managed by the theme system
    // and will be applied in the constructor
  },
  
  // Right extended area collectibles
  {
    radius: 0.3,
    position: {
      x: 12,
      y: -2.3
    },
    // Colors are now managed by the theme system
    // and will be applied in the constructor
  },
  {
    radius: 0.3,
    position: {
      x: 18,
      y: -1.3
    },
    // Colors are now managed by the theme system
    // and will be applied in the constructor
  }
];

/**
 * Collectible class to manage collectible items
 */
export class Collectible {
  public mesh: THREE.Mesh;
  public radius: number;
  public position: { x: number; y: number };
  public isCollected: boolean;
  
  constructor(definition: CollectibleDefinition) {
    this.radius = definition.radius;
    this.position = { ...definition.position };
    this.isCollected = definition.isCollected || false;
    
    // Create mesh (using a circle geometry)
    const geometry = new THREE.CircleGeometry(this.radius, 16);
    const material = new THREE.MeshBasicMaterial({
      color: definition.color || getCurrentTheme().collectible,
      side: THREE.DoubleSide
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.updateMeshPosition();
  }
  
  /**
   * Update mesh position to match physics position
   */
  private updateMeshPosition(): void {
    this.mesh.position.set(
      this.position.x,
      this.position.y,
      GAME_CONFIG.LAYERS.COLLECTIBLES
    );
  }
  
  /**
   * Collect this item
   */
  public collect(): void {
    this.isCollected = true;
    this.mesh.visible = false;
  }
}

/**
 * Create collectibles from definitions
 * @param scene The scene to add collectibles to
 * @param collectibleDefinitions Array of collectible definitions
 * @returns Array of created collectible objects
 */
export function createCollectibles(
  scene: THREE.Scene,
  collectibleDefinitions: CollectibleDefinition[] = DEFAULT_COLLECTIBLES
): Collectible[] {
  const collectibles: Collectible[] = [];
  
  collectibleDefinitions.forEach(definition => {
    const collectible = new Collectible(definition);
    scene.add(collectible.mesh);
    collectibles.push(collectible);
  });
  
  return collectibles;
}