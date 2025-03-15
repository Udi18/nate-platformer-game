# CLAUDE.md - Nate's Adventure Project Reference

## Overview and Game Goal
Nate's Adventure is a simple yet engaging Mario-style 2D platformer game built using Three.js, TypeScript, and Node.js. The game targets young audiences, specifically designed to be intuitive, fun, and educational. It introduces a balanced worldview, demonstrating nuanced character roles rather than strictly "good vs. evil," aligning with Nate's preference for complex characters and scenarios.

The core gameplay involves a player character navigating platforms, collecting items, and avoiding enemies. The player can move left/right and jump, with movement controls that are responsive and intuitive.

## Commands
- **Dev server**: `npm run dev` 
- **Build**: `npm run build`
- **Preview**: `npm run preview`
- **Type check**: `npx tsc --noEmit`
- **Run a specific test**: *No test framework configured*

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
- **public/**: Static assets

## Technical Objectives
- Develop a scalable and maintainable game architecture
- Ensure smooth performance and engaging gameplay
- Maintain simplicity in gameplay controls and interactions
- Facilitate easy extension of characters, storylines, and media types
- Implement intuitive, non-conflicting control schemes

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