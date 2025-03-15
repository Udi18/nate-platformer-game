import './style.css';
import { Game } from './game/game';

interface GameOptions {
  developmentMode: boolean;
  useProceduralLevel: boolean;
}

function checkQueryParams(): GameOptions {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    developmentMode: urlParams.get('dev') === 'true',
    useProceduralLevel: urlParams.get('procedural') === 'true'
  };
}

const gameContainer = document.getElementById('app') || document.body;
const gameOptions = checkQueryParams();

if (gameOptions.developmentMode) {
  console.log('Development mode enabled via URL parameter');
}
if (gameOptions.useProceduralLevel) {
  console.log('Procedural level generation enabled via URL parameter');
}

const game = new Game(gameContainer, gameOptions);
game.start();

if (import.meta.env.DEV) {
  (window as any).game = game;
}