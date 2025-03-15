/**
 * Color configuration system for the game
 * Provides type-safe color options with named values
 */

// Named color options
export enum PlayerColor {
  BLUE = 0x3498db,
  GREEN = 0x2ecc71,
  PURPLE = 0x9b59b6,
  ORANGE = 0xe67e22,
  TEAL = 0x1abc9c,
  RED = 0xe74c3c
}

export enum PlatformColor {
  BROWN = 0x8B4513,
  GRAY = 0x7f8c8d,
  DARK_BROWN = 0x795548,
  GREEN = 0x2ecc71,
  DARK_BLUE = 0x2c3e50
}

export enum BackgroundColor {
  SKY_BLUE = 0x87CEEB,
  DARK_BLUE = 0x1A1A2E,
  SUNSET = 0xFFB347,
  NIGHT = 0x0C090A,
  FOREST = 0x228B22
}

export enum EnemyColor {
  RED = 0xFF0000,
  DARK_RED = 0xC0392B,
  MAROON = 0x800000,
  PURPLE = 0x8E44AD,
  DARK_GREEN = 0x27AE60,
  DARK_BLUE = 0x2980B9,
  MIDNIGHT_BLUE = 0x2C3E50,
  BRIGHT_PINK = 0xE91E63,
  CRIMSON = 0xDC143C,
  ORANGE_RED = 0xFF4500,
  DARK_ORANGE = 0xD35400,
  RED_ORANGE = 0xE74C3C,
  CHERRY_RED = 0xF44336,
  HOT_PINK = 0xFF69B4
}

export enum CollectibleColor {
  GOLD = 0xFFD700,
  SILVER = 0xC0C0C0,
  BRONZE = 0xCD7F32,
  DIAMOND = 0xB9F2FF,
  EMERALD = 0x50C878,
  RAINBOW = 0x9C27B0,
  TURQUOISE = 0x40E0D0,
  BRIGHT_YELLOW = 0xFFEB3B
}

// UI Colors in CSS format
export enum UITextColor {
  WHITE = "rgba(255, 255, 255, 0.87)",
  BRIGHTER_WHITE = "rgba(255, 255, 255, 0.95)",
  BLACK = "#213547",
  GRAY = "#888888",
  BLUE = "#646cff"
}

export enum UIBackgroundColor {
  DARK = "rgba(0, 0, 0, 0.7)",
  DARKER = "rgba(0, 0, 0, 0.8)",
  SEMI_TRANSPARENT = "rgba(0, 0, 0, 0.5)",
  DARK_BLUE = "rgba(25, 25, 40, 0.9)",
  FOREST_GREEN = "rgba(39, 55, 35, 0.8)"
}

export enum UIAccentColor {
  GREEN = "#4CAF50",
  DARKER_GREEN = "#45a049",
  BLUE = "#646cff",
  PURPLE = "#535bf2",
  GOLD = "#FFD700",
  RED = "#FF5252"
}

// Theme interfaces
export interface GameTheme {
  name: string;
  
  // Game element colors
  background: BackgroundColor;
  player: PlayerColor;
  platform: PlatformColor;
  enemy: EnemyColor;
  collectible: CollectibleColor;
  
  // Optional special colors for variants
  enemySpecial?: EnemyColor;
  collectibleSpecial?: CollectibleColor;
  
  // UI colors
  uiText: UITextColor;
  uiBackground: UIBackgroundColor;
  uiAccent: UIAccentColor;
  uiScore: UIAccentColor;
}

// Predefined themes
export const CLASSIC_THEME: GameTheme = {
  name: "Classic",
  
  background: BackgroundColor.SKY_BLUE,
  player: PlayerColor.ORANGE,
  platform: PlatformColor.BROWN,
  enemy: EnemyColor.RED,
  collectible: CollectibleColor.GOLD,
  
  // Special variants
  enemySpecial: EnemyColor.ORANGE_RED,
  collectibleSpecial: CollectibleColor.DIAMOND,
  
  uiText: UITextColor.WHITE,
  uiBackground: UIBackgroundColor.DARK,
  uiAccent: UIAccentColor.GREEN,
  uiScore: UIAccentColor.GOLD
};

export const DARK_THEME: GameTheme = {
  name: "Dark",
  
  background: BackgroundColor.DARK_BLUE,
  player: PlayerColor.BLUE,
  platform: PlatformColor.DARK_BLUE,
  enemy: EnemyColor.RED_ORANGE,
  collectible: CollectibleColor.SILVER,
  
  // Special variants
  enemySpecial: EnemyColor.PURPLE,
  collectibleSpecial: CollectibleColor.TURQUOISE,
  
  uiText: UITextColor.BRIGHTER_WHITE,
  uiBackground: UIBackgroundColor.DARKER,
  uiAccent: UIAccentColor.BLUE,
  uiScore: UIAccentColor.GOLD
};

export const FOREST_THEME: GameTheme = {
  name: "Forest",
  
  background: BackgroundColor.FOREST,
  player: PlayerColor.GREEN,
  platform: PlatformColor.DARK_BROWN,
  enemy: EnemyColor.DARK_RED,
  collectible: CollectibleColor.EMERALD,
  
  // Special variants
  enemySpecial: EnemyColor.DARK_GREEN,
  collectibleSpecial: CollectibleColor.BRIGHT_YELLOW,
  
  uiText: UITextColor.WHITE,
  uiBackground: UIBackgroundColor.FOREST_GREEN,
  uiAccent: UIAccentColor.GREEN,
  uiScore: UIAccentColor.GOLD
};

export const SUNSET_THEME: GameTheme = {
  name: "Sunset",
  
  background: BackgroundColor.SUNSET,
  player: PlayerColor.PURPLE,
  platform: PlatformColor.GRAY,
  enemy: EnemyColor.CRIMSON,
  collectible: CollectibleColor.GOLD,
  
  // Special variants
  enemySpecial: EnemyColor.HOT_PINK,
  collectibleSpecial: CollectibleColor.RAINBOW,
  
  uiText: UITextColor.WHITE,
  uiBackground: UIBackgroundColor.DARK,
  uiAccent: UIAccentColor.RED,
  uiScore: UIAccentColor.GOLD
};

export const LAVA_THEME: GameTheme = {
  name: "Lava",
  
  background: BackgroundColor.NIGHT,
  player: PlayerColor.RED,
  platform: PlatformColor.DARK_BROWN,
  enemy: EnemyColor.DARK_RED,
  collectible: CollectibleColor.BRIGHT_YELLOW,
  
  // Special variants
  enemySpecial: EnemyColor.ORANGE_RED,
  collectibleSpecial: CollectibleColor.EMERALD,
  
  uiText: UITextColor.WHITE,
  uiBackground: UIBackgroundColor.DARKER,
  uiAccent: UIAccentColor.RED,
  uiScore: UIAccentColor.GOLD
};

// Available themes
export const THEMES: Record<string, GameTheme> = {
  classic: CLASSIC_THEME,
  dark: DARK_THEME,
  forest: FOREST_THEME,
  sunset: SUNSET_THEME,
  lava: LAVA_THEME
};

// Current active theme
let currentTheme: GameTheme = CLASSIC_THEME;

/**
 * Gets the current color theme
 */
export function getCurrentTheme(): GameTheme {
  return currentTheme;
}

/**
 * Sets the theme by name
 * @param themeName Name of the theme to set
 * @returns true if theme was found and set, false otherwise
 */
export function setTheme(themeName: string): boolean {
  const theme = THEMES[themeName.toLowerCase()];
  if (theme) {
    currentTheme = theme;
    return true;
  }
  return false;
}

/**
 * Creates a custom theme
 * @param options Partial theme options to override defaults
 * @returns The new custom theme
 */
export function createCustomTheme(name: string, options: Partial<Omit<GameTheme, 'name'>>): GameTheme {
  // Start with classic theme as base
  const customTheme: GameTheme = {
    ...CLASSIC_THEME,
    name,
    ...options
  };
  
  return customTheme;
}

/**
 * Applies the current theme's UI colors to CSS variables
 */
export function applyThemeToUI(): void {
  document.documentElement.style.setProperty('--ui-text', currentTheme.uiText);
  document.documentElement.style.setProperty('--ui-background', currentTheme.uiBackground);
  document.documentElement.style.setProperty('--ui-accent', currentTheme.uiAccent);
  document.documentElement.style.setProperty('--ui-score', currentTheme.uiScore);
}

/**
 * Gets a list of available theme names
 */
export function getAvailableThemes(): string[] {
  return Object.keys(THEMES);
}