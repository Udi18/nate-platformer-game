import "./style.css";
import { GameEngine } from "./game/engine";
import { Game } from "./game/game";

// Instantiate engine and core game
const engine = new GameEngine();
const game = new Game(engine, document.getElementById("game-canvas") as HTMLCanvasElement);

// Register game update and render
engine.onUpdate((dt) => game.update(dt));
engine.onRender(() => game.render());

// Start the loop once assets are loaded
(async () => {
    await game.loadAssets();  // implement preloader inside Game
    engine.start();
})();