# CLAUDE.md - Nate's Adventure Project Reference

## Overview and Game Goal
Nate's Adventure is a simple yet engaging Mario-style 2D platformer game built using Three.js, TypeScript, and Node.js. The game targets young audiences, specifically designed to be intuitive, fun, and educational. It introduces a balanced worldview, demonstrating nuanced character roles rather than strictly "good vs. evil," aligning with Nate's preference for complex characters and scenarios.

The core gameplay involves a player character navigating platforms, collecting items, and avoiding enemies. The player can move left/right and jump, with movement controls that are responsive and intuitive.

## Commands
- **Dev server**: `npm run dev` 
- **Build**: `npm run build`
- **Preview**: `npm run preview`
- **Type check**: `npx tsc --noEmit`
- **Run tests in watch mode**: `npm test`
- **Run tests once**: `npm run test:run`
- **Run specific tests**: `npm run test:run -- tests/level-generator.test.ts`
- **Run tests with coverage**: `npm run test:run -- --coverage`

## Code Style
- **TypeScript**: Strict mode with `noUnusedLocals` and `noUnusedParameters`
- **Formatting**: 2-space indentation, semicolons optional but consistent
- **Imports**: Use named imports from modules, group imports
- **Naming**: camelCase for variables/functions, PascalCase for classes/types
- **File organization**: Group related functionality in dedicated files
- **Error handling**: Use explicit type checking over try/catch where possible
- **Comments**: Use JSDoc for public APIs, line comments for implementation details
- **Three.js standards**: Follow Three.js conventions for 3D objects and scenes
- **Game Controls**: 
  - Use non-conflicting control schemes (e.g., don't use Space for anything but jumping)
  - 'P' key for pause, arrow keys/WASD for movement, Space for jump
  - Special functions like restart should require deliberate action (e.g., double-click)
  - Always document keyboard shortcuts in the UI

## Project Structure
- **src/**: TypeScript source files
  - **main.ts**: Main entry point
  - **game/**: Game components
    - **game.ts**: Main game class
    - **player.ts**: Player character implementation
    - **platforms.ts**: Platform generation
    - **enemies.ts**: Enemy behavior
    - **collectibles.ts**: Collectible items
    - **level-generator.ts**: Procedural level generation
    - **ui-manager.ts**: UI management
    - **scene.ts**: Three.js scene configuration
- **public/**: Static assets
- **tests/**: Test files
  - **level-generator.test.ts**: Tests for procedural level generation
  - **player.test.ts**: Tests for player movement and physics
  - **game.test.ts**: Tests for main game orchestration
  - **ui-manager.test.ts**: Tests for UI management
  - **input-handling.test.ts**: Tests for keyboard and button inputs
  - **setup.ts**: Test environment configuration

## Technical Objectives
- Develop a scalable and maintainable game architecture
- Ensure smooth performance and engaging gameplay
- Maintain simplicity in gameplay controls and interactions
- Facilitate easy extension of characters, storylines, and media types
- Implement intuitive, non-conflicting control schemes
- Maintain test coverage for core functionality

## Development Guidelines

### General Principles
- **Incremental Development**:
  - Implement features one at a time, pausing for user review
  - Keep commits small and focused
  - Avoid generating extensive code without review
- **Clear Code Structure**:
  - Use modular architecture, clearly separated by function
  - Follow TypeScript best practices for type safety
  - Avoid deep nesting or overly abstract structures
- **Testing**:
  - Write tests for new functionality
  - Ensure tests focus on behavior, not implementation details
  - Keep tests maintainable and not overly brittle

### Three.js Best Practices
- **Scene Management**:
  - Keep a single scene instance and reuse it
  - Organize objects into logical groups
- **Camera Setup**:
  - Use an Orthographic camera for true 2D gameplay
  - Coordinate system: x (horizontal), y (vertical), z (depth/layers)
  - Z-axis layers should use smaller increments (0-5 range) for better visibility
- **Asset Management**:
  - Centralize loading using THREE.LoadingManager
  - Cache assets to avoid redundant loading
- **Performance**:
  - Limit active meshes and geometry complexity
  - Utilize object pooling for frequent creation/destruction
  - Keep animation loops optimized
  - Continue rendering even when game is paused
- **Physics Integration**:
  - Use simple collision detection for platforms, collectibles, and enemies
  - Separate physics calculations from rendering logic
  - Use AABB (Axis-Aligned Bounding Box) collision detection for simplicity
- **Game State Management**:
  - Implement clear pause and restart functionality
  - Keep game state separate from rendering
  - Ensure controls do not conflict with game actions

### Game UI Guidelines
- **HUD Elements**:
  - Keep UI minimal and non-intrusive
  - Score display should be visible but not distracting
  - Controls should be intuitive and clearly labeled
  - Pause overlay should be semi-transparent to maintain context
- **Game Controls**:
  - Player movement should feel responsive and intuitive
  - Document control schemes in UI elements
  - Avoid accidental triggering of important actions
  - Provide visual feedback for state changes (pause/resume)

### Testing Guidelines
- **Unit Tests**:
  - Focus on testing one component at a time
  - Mock dependencies to isolate functionality
  - Use descriptive test names that explain the expected behavior
- **Game Logic Testing**:
  - Test core game mechanics separately from rendering
  - Ensure procedural generation is consistent with given seeds
  - Test collision detection and physics behaviors
- **UI Testing**:
  - Test UI state changes and event handling
  - Verify UI elements respond correctly to game state

### Refactoring Guidelines
- **Remove redundant comments** that don't add value
- **Keep essential docstrings** for public APIs and complex functions
- **Use consistent naming** throughout the codebase
- **Split large files** into smaller, focused modules when possible
- **Reduce duplicate code** through appropriate abstraction
- **Maintain test coverage** when refactoring

### AI Working Guidelines
- **Code Simplicity**: Prioritize clarity over clever solutions
- **Focused Development**: Stay on current task, avoid preemptive features
- **Communication**:
  - Explain rationale for code decisions
  - Wait for user confirmation before proceeding
  - Prompt for verification frequently
  - Avoid generating large blocks of code without explanation
- **Control Scheme Awareness**:
  - Be careful not to reuse buttons that are already mapped to game functions
  - Ensure consistency in key bindings across the application
  - Prefer requiring deliberate actions for destructive operations (restart)
  - Test for control conflicts before implementing