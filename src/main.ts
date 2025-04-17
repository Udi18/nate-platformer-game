import "./style.css";
import { GameEngine } from "./game/engine";
import { Game } from "./game/game";
import { applyThemeToUI } from "./game/color-config";

// Apply theme to UI first
applyThemeToUI();

// Get the game canvas
const gameCanvas = document.getElementById("game-canvas") as HTMLCanvasElement;
if (!gameCanvas) {
  console.error("Game canvas element not found!");
}

// Instantiate engine and core game
const engine = new GameEngine();
const game = new Game(engine, gameCanvas);

// Register game update and render callbacks
engine.onUpdate((dt) => game.update(dt));
engine.onRender(() => game.render());

// Start the loop once assets are loaded
(async () => {
  try {
    // Load assets and set up the game
    await game.loadAssets();
    
    // Start the game engine
    engine.start();
    
    console.log("Game started successfully");
  } catch (error) {
    console.error("Error starting game:", error);
  }
})();