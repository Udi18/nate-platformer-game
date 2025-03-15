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
 * Check for URL query parameters
 * - dev=true: Enable development mode
 * - procedural=true: Use procedural level generation
 */
function checkQueryParams(): { 
  developmentMode: boolean;
  useProceduralLevel: boolean;
} {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    developmentMode: urlParams.get('dev') === 'true',
    useProceduralLevel: urlParams.get('procedural') === 'true'
  };
}

// Create a container for the game
const gameContainer = document.getElementById('app') || document.body;

// Get game options from URL parameters
const gameOptions = checkQueryParams();

// Log enabled options
if (gameOptions.developmentMode) {
  console.log('Development mode enabled via URL parameter');
}
if (gameOptions.useProceduralLevel) {
  console.log('Procedural level generation enabled via URL parameter');
}

// Initialize and start the game with options
const game = new Game(gameContainer, gameOptions);
game.start();

// For debugging purposes - expose game to window (allows console access)
if (import.meta.env.DEV) {
  (window as any).game = game;
}
