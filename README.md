# Nate's Adventure

A 2D platformer game built with TypeScript, Three.js, and Vite.

## Overview

Nate's Adventure is a simple yet engaging Mario-style 2D platformer game targeted at young audiences. The game features a player character navigating platforms, collecting items, and avoiding enemies through various levels.

## Features

- Responsive and intuitive player controls
- Procedurally generated levels
- Collectible items to increase score
- Enemy characters with simple AI
- UI overlays for game states (main menu, pause, game over)
- Mobile-friendly design

## Development

### Prerequisites

- Node.js (v14+)
- npm

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd nate-platformer-game

# Install dependencies
npm install
```

### Running the Development Server

```bash
npm run dev
```

This will start a development server at http://localhost:5173/

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Game Controls

- Arrow keys or WASD: Move player
- Space: Jump
- P: Pause/Resume game

## Special URL Parameters

- `?dev=true`: Enable development mode
- `?procedural=true`: Use procedural level generation

## Testing

The game uses Vitest for testing. See [TESTING.md](TESTING.md) for details on how to run tests and add new ones.

## Project Structure

- `src/`: Source code
  - `main.ts`: Main entry point
  - `game/`: Game components
    - `game.ts`: Main game class
    - `player.ts`: Player character implementation
    - `platforms.ts`: Platform generation
    - `enemies.ts`: Enemy behavior
    - `collectibles.ts`: Collectible items
    - `level-generator.ts`: Procedural level generation
    - `ui-manager.ts`: UI management
    - `scene.ts`: Three.js scene configuration
- `public/`: Static assets
- `tests/`: Test files

## Coding Style

The codebase follows TypeScript best practices with consistent formatting and clear organization. See CLAUDE.md for detailed style guidelines.

## License

This project is private and not licensed for redistribution.