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
    // Gold (default)
    color: 0xFFD700,
    // Silver
    // color: 0xC0C0C0,
    // Bronze
    // color: 0xCD7F32,
    // Diamond Blue
    // color: 0xB9F2FF,
    // Emerald Green
    // color: 0x50C878
  },
  
  // Collectible on middle platform
  {
    radius: 0.3,
    position: {
      x: -3,
      y: 0.5
    },
    // Gold (default)
    color: 0xFFD700,
    // Silver
    // color: 0xC0C0C0,
    // Rainbow (purple-ish)
    // color: 0x9C27B0,
    // Turquoise
    // color: 0x40E0D0,
    // Bright Yellow
    // color: 0xFFEB3B
  },
  
  // Collectible on the stepping platform
  {
    radius: 0.3,
    position: {
      x: 0.5,
      y: 1.2
    },
    // Gold (default)
    color: 0xFFD700,
    // Platinum
    // color: 0xE5E4E2,
    // Aqua
    // color: 0x00FFFF,
    // Amethyst
    // color: 0x9966CC,
    // Lime Green
    // color: 0x32CD32
  },
  
  // Collectible on upper platform
  {
    radius: 0.3,
    position: {
      x: 3.5,
      y: 1.7
    },
    // Gold (default)
    color: 0xFFD700,
    // Pearl White
    // color: 0xFFFFF0,
    // Rose Gold
    // color: 0xB76E79,
    // Sapphire
    // color: 0x0F52BA,
    // Ruby Red
    // color: 0xE0115F
  },
  
  // Left extended area collectibles
  {
    radius: 0.3,
    position: {
      x: -10,
      y: -2.3
    },
    // Gold (default)
    color: 0xFFD700,
    // Copper
    // color: 0xB87333,
    // Amber
    // color: 0xFFBF00,
    // Jade Green
    // color: 0x00A86B,
    // Lavender
    // color: 0xE6E6FA
  },
  {
    radius: 0.3,
    position: {
      x: -16,
      y: -1.3
    },
    // Gold (default)
    color: 0xFFD700,
    // Obsidian Black
    // color: 0x3D3635,
    // Coral Pink
    // color: 0xF88379,
    // Garnet Red
    // color: 0x733635,
    // Neon Green
    // color: 0x39FF14
  },
  
  // Right extended area collectibles
  {
    radius: 0.3,
    position: {
      x: 12,
      y: -2.3
    },
    // Gold (default)
    color: 0xFFD700,
    // Opal White
    // color: 0xE5E4E2,
    // Topaz Yellow
    // color: 0xFFC87C,
    // Cobalt Blue
    // color: 0x0047AB,
    // Crystal Clear
    // color: 0xDCF8FF
  },
  {
    radius: 0.3,
    position: {
      x: 18,
      y: -1.3
    },
    // Gold (default)
    color: 0xFFD700,
    // Mithril Silver
    // color: 0xACBDCA,
    // Golden Pearl
    // color: 0xEEE8AA,
    // Ice Blue
    // color: 0x99FFFF,
    // Neon Purple
    // color: 0xBF00FF
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