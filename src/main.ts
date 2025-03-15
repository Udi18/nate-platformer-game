import './style.css';
import { Game } from './game/game';

/**
 * Main entry point for the game
 * 
 * Initializes the game container and starts the game loop.
 * The game uses an orthographic camera (2D view) with a clearly defined
 * coordinate system:
 * - X-axis: horizontal movement (left to right)
 * - Y-axis: vertical movement (bottom to top)
 * - Z-axis: depth for layering only (background to foreground)
 */

// Create a container for the game
const gameContainer = document.getElementById('app') || document.body;

// Initialize and start the game
const game = new Game(gameContainer);
game.start();

// For debugging purposes - expose game to window (allows console access)
if (import.meta.env.DEV) {
  (window as any).game = game;
}
