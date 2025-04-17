import * as THREE from 'three';
import { Collectible, CollectibleDefinition } from '../collectibles';

/**
 * Coin collectible class
 */
export class Coin extends Collectible {
  constructor(definition: CollectibleDefinition) {
    super(definition);
    
    // Create a simple circle geometry (using the base class implementation)
    // The base class already creates a circle mesh with the right properties
  }
  
  /**
   * Update the coin animation
   * @param _deltaTime Time since last frame in seconds (unused)
   */
  public update(_deltaTime: number): void {
    // No special animation needed
  }
  
  /**
   * Collect this coin
   */
  public collect(): void {
    super.collect();
    this.playBeepSound();
  }
  
  /**
   * Play a simple beep sound when coin is collected
   */
  private playBeepSound(): void {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && 
          (window.AudioContext || (window as any).webkitAudioContext)) {
        
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Only proceed if audio is supported
        if (typeof audioContext.createOscillator === 'function') {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          // Configure the sound
          oscillator.type = 'sine';
          oscillator.frequency.value = 880; // A5
          gainNode.gain.value = 0.1;
          
          // Connect the nodes
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          // Play the sound
          oscillator.start();
          
          // Stop after a short duration
          setTimeout(() => {
            oscillator.stop();
            if (typeof audioContext.close === 'function') {
              audioContext.close().catch(e => console.log('Error closing audio context', e));
            }
          }, 100);
        } else {
          console.log('Audio oscillator not supported');
        }
      } else {
        console.log('Audio context not available (likely running in test environment)');
      }
    } catch (error) {
      console.warn('Error playing coin sound:', error);
    }
  }
  
  /**
   * Create coin collectibles from definitions
   * @param scene The scene to add coins to
   * @param coinDefinitions Array of coin definitions
   * @returns Array of created coin objects
   */
  public static createCoins(
    scene: THREE.Scene,
    coinDefinitions: CollectibleDefinition[]
  ): Coin[] {
    const coins: Coin[] = [];
    
    coinDefinitions.forEach(definition => {
      // Set coin color to orange-gold
      const coinDef = {
        ...definition,
        color: 0xFFA500 // Orange-gold color
      };
      
      const coin = new Coin(coinDef);
      scene.add(coin.mesh);
      coins.push(coin);
    });
    
    return coins;
  }
}