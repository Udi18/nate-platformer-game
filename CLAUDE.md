# CLAUDE.md - Nate's Adventure Project Reference

## Overview and Game Goal
Nate's Adventure is a simple yet engaging Mario-style 2D platformer game built using Three.js, TypeScript, and Node.js. The game targets young audiences, specifically designed to be intuitive, fun, and educational. It introduces a balanced worldview, demonstrating nuanced character roles rather than strictly "good vs. evil," aligning with Nate's preference for complex characters and scenarios.

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

## Project Structure
- **src/**: TypeScript source files
- **public/**: Static assets

## Technical Objectives
- Develop a scalable and maintainable game architecture
- Ensure smooth performance and engaging gameplay
- Maintain simplicity in gameplay controls and interactions
- Facilitate easy extension of characters, storylines, and media types

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
- **Asset Management**:
  - Centralize loading using THREE.LoadingManager
  - Cache assets to avoid redundant loading
- **Performance**:
  - Limit active meshes and geometry complexity
  - Utilize object pooling for frequent creation/destruction
  - Keep animation loops optimized
- **Physics Integration**:
  - Use well-maintained libraries (recommended: cannon-es)
  - Separate physics calculations from rendering logic
  - Use simple physics bodies for better performance

### AI Working Guidelines
- **Code Simplicity**: Prioritize clarity over clever solutions
- **Focused Development**: Stay on current task, avoid preemptive features
- **Communication**:
  - Explain rationale for code decisions
  - Wait for user confirmation before proceeding
  - Prompt for verification frequently
  - Avoid generating large blocks of code without explanation