import './style.css';
import { Game } from './game/game';
import { setTheme, getAvailableThemes } from './game/color-config';

interface GameOptions {
  developmentMode: boolean;
  useProceduralLevel: boolean;
  theme?: string;
}

function checkQueryParams(): GameOptions {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    developmentMode: urlParams.get('dev') === 'true',
    useProceduralLevel: urlParams.get('procedural') === 'true',
    theme: urlParams.get('theme') || undefined
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

// Set theme if provided
if (gameOptions.theme) {
  if (setTheme(gameOptions.theme)) {
    console.log(`Theme set to: ${gameOptions.theme}`);
  } else {
    console.warn(`Theme "${gameOptions.theme}" not found. Available themes: ${getAvailableThemes().join(', ')}`);
  }
}

const game = new Game(gameContainer, gameOptions);

// Set up theme selector
const themeSelector = document.getElementById('theme-selector') as HTMLSelectElement;

if (themeSelector) {
  // Set initial value based on URL param if provided
  if (gameOptions.theme) {
    themeSelector.value = gameOptions.theme;
  }
  
  // Add event listener for theme changes
  themeSelector.addEventListener('change', () => {
    const selectedTheme = themeSelector.value;
    setTheme(selectedTheme);
    
    // Update the URL parameter without reloading the page
    const url = new URL(window.location.href);
    url.searchParams.set('theme', selectedTheme);
    window.history.replaceState({}, '', url.toString());
    
    // Restart the game to apply the new theme
    game.restartGame(false);
  });
}
game.start();

if (import.meta.env.DEV) {
  (window as any).game = game;
}