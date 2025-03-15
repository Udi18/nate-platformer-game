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

/**
 * Check for development mode query parameter (e.g., ?dev=true)
 */
function checkDevelopmentMode(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('dev') === 'true';
}

// Create a container for the game
const gameContainer = document.getElementById('app') || document.body;

// Check if we should enable development mode
const developmentMode = checkDevelopmentMode();

// Log development mode status
if (developmentMode) {
  console.log('Development mode enabled via URL parameter');
}

// Initialize and start the game with or without development mode
const game = new Game(gameContainer, { developmentMode });
game.start();

// For debugging purposes - expose game to window (allows console access)
if (import.meta.env.DEV) {
  (window as any).game = game;
}
