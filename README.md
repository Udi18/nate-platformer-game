# Nate's Adventure

![Nate's Adventure Logo](https://github.com/username/nate-platformer-game/raw/master/screenshots/logo.png)

A 2D platformer game built with TypeScript, Three.js, and Vite that delivers a fun, educational gaming experience for young audiences.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.174.0-green.svg)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-orange.svg)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Tests-Vitest-brightgreen.svg)](https://vitest.dev/)

## Overview

Nate's Adventure is a Mario-style 2D platformer game that balances fun gameplay with educational elements. The game features a player character navigating through procedurally generated levels, collecting items, and interacting with various characters - designed specifically with a nuanced worldview rather than strict "good vs. evil" dynamics.

![Game Screenshot](https://github.com/username/nate-platformer-game/raw/master/screenshots/gameplay.png)

## Features

- **Responsive Controls**: Intuitive keyboard-based movement and actions
- **Procedural Level Generation**: Unique levels generated each time for endless replayability
- **Engaging Collectibles System**: Collect items to increase your score
- **Dynamic Enemies**: Characters with simple AI that respond to the environment
- **Multiple Game States**: Main menu, gameplay, pause, and game over screens
- **Mobile-Responsive Design**: Play on desktop or mobile devices
- **Comprehensive Test Suite**: Thoroughly tested codebase for stability

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/username/nate-platformer-game.git

# Navigate to the project directory
cd nate-platformer-game

# Install dependencies
npm install
# or
yarn install
```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

This will start a development server at [http://localhost:5173/](http://localhost:5173/)

### Building for Production

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
# or
yarn preview
```

## Game Controls

- **Movement**: Arrow keys or WASD
- **Jump**: Space bar
- **Pause/Resume**: P key
- **Restart Game**: Double-click the Restart button

## Special URL Parameters

- `?dev=true`: Enable development mode (skips main menu)
- `?procedural=true`: Use procedural level generation

## Testing

The game includes a comprehensive test suite built with Vitest:

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run specific test files
npm run test:run -- tests/level-generator.test.ts

# Get test coverage report
npm run test:run -- --coverage
```

See [TESTING.md](TESTING.md) for detailed information on the testing strategy and how to write new tests.

## Project Structure

```
nate-platformer-game/
├── src/                  # Source code
│   ├── main.ts           # Main entry point
│   ├── game/             # Game components
│   │   ├── game.ts           # Main game class
│   │   ├── player.ts         # Player character
│   │   ├── platforms.ts      # Platform generation
│   │   ├── enemies.ts        # Enemy behavior
│   │   ├── collectibles.ts   # Collectible items
│   │   ├── level-generator.ts # Procedural generation
│   │   ├── ui-manager.ts     # UI management
│   │   └── scene.ts          # Three.js setup
│   └── style.css         # Global styles
├── public/               # Static assets
├── tests/                # Test files
│   ├── game.test.ts
│   ├── player.test.ts
│   ├── level-generator.test.ts
│   └── [...]
├── index.html            # Entry HTML
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
├── TESTING.md            # Testing documentation
├── CLAUDE.md             # Code style and guidelines
└── README.md             # This file
```

## Technical Implementation

Nate's Adventure leverages several technical features:

- **Three.js for 2D Rendering**: Using WebGL through Three.js for smooth 2D rendering
- **TypeScript for Type Safety**: Strict typing for more reliable code
- **Custom Physics System**: Simple but effective collision detection and resolution
- **Procedural Content Generation**: Algorithm-based level design for variety
- **Event-Driven Architecture**: Clean separation of game logic and UI

## Contributing

We welcome contributions to Nate's Adventure! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Development Guidelines

For detailed information about coding style, architecture decisions, and development principles, see [CLAUDE.md](CLAUDE.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Three.js community for their excellent 3D library
- The TypeScript team for their powerful type system
- Vite team for the fast development environment
- All contributors and testers who have helped shape this project