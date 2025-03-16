import './style.css';
import { Game } from './game/game';
import { setTheme, getAvailableThemes, applyThemeToUI } from './game/color-config';

interface GameOptions {
  developmentMode: boolean;
  useProceduralLevel: boolean;
  theme?: string;
  playerColor?: string;
}

type Maybe<T> = T | null;

function checkQueryParams(): GameOptions {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    developmentMode: urlParams.get('dev') === 'true',
    useProceduralLevel: urlParams.get('procedural') === 'true',
    theme: urlParams.get('theme') || undefined,
    playerColor: urlParams.get('player') || undefined
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
    // Apply the theme to UI elements
    applyThemeToUI();
  } else {
    console.warn(`Theme "${gameOptions.theme}" not found. Available themes: ${getAvailableThemes().join(', ')}`);
  }
} else {
  // Always apply default theme to UI elements
  applyThemeToUI();
}

const game = new Game(gameContainer, gameOptions);

// Set up settings panel
const settingsToggle = document.getElementById('settings-toggle');
const settingsPanel = document.getElementById('settings-panel');
const settingsTheme = document.getElementById('settings-theme') as Maybe<HTMLSelectElement>;
const settingsPlayerColor = document.getElementById('settings-player-color') as Maybe<HTMLSelectElement>;
const settingsDevMode = document.getElementById('settings-dev-mode') as Maybe<HTMLSelectElement>;
const settingsProcedural = document.getElementById('settings-procedural') as Maybe<HTMLSelectElement>;
const settingsApply = document.getElementById('settings-apply');

// Initialize settings values from URL params
if (settingsTheme) {
  if (gameOptions.theme) {
    settingsTheme.value = gameOptions.theme;
  }
}

if (settingsPlayerColor) {
  if (gameOptions.playerColor) {
    settingsPlayerColor.value = gameOptions.playerColor;
  }
}

if (settingsDevMode) {
  settingsDevMode.value = gameOptions.developmentMode ? 'true' : 'false';
}

if (settingsProcedural) {
  settingsProcedural.value = gameOptions.useProceduralLevel ? 'true' : 'false';
}

// Toggle settings panel visibility
if (settingsToggle && settingsPanel) {
  // Fix: Initialize with proper display style
  settingsPanel.style.display = 'none';
  
  settingsToggle.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (settingsPanel.style.display === 'none') {
      settingsPanel.style.display = 'flex';
    } else {
      settingsPanel.style.display = 'none';
    }
  });
}

// Apply settings button
if (settingsApply) {
  settingsApply.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Build new URL with updated parameters
    const url = new URL(window.location.href);
    
    // Update theme
    if (settingsTheme && settingsTheme.value) {
      url.searchParams.set('theme', settingsTheme.value);
    }
    
    // Update player color
    if (settingsPlayerColor && settingsPlayerColor.value) {
      url.searchParams.set('player', settingsPlayerColor.value);
    }
    
    // Update dev mode
    if (settingsDevMode) {
      url.searchParams.set('dev', settingsDevMode.value);
    }
    
    // Update procedural generation
    if (settingsProcedural) {
      url.searchParams.set('procedural', settingsProcedural.value);
    }
    
    console.log("Applying settings with URL: " + url.toString());
    
    // Hide settings panel
    if (settingsPanel) {
      settingsPanel.style.display = 'none';
    }
    
    // Reload the page with new settings
    window.location.href = url.toString();
  });
}
game.start();

// Store game options in window for game restarts
(window as any).gameOptions = gameOptions;

if (import.meta.env.DEV) {
  (window as any).game = game;
}