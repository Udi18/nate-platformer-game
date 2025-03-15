# Nate's Adventure Game Testing

This document explains how to run the tests for the Nate's Adventure platformer game.

## Running Tests

The game uses Vitest for testing. The following npm commands are available:

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run specific test files
npm run test:run -- tests/level-generator.test.ts
```

## Test Structure

The tests are organized by component:

- `tests/level-generator.test.ts` - Tests for procedural level generation
- `tests/player.test.ts` - Tests for player movement and physics
- `tests/game.test.ts` - Tests for main game orchestration
- `tests/ui-manager.test.ts` - Tests for UI management
- `tests/input-handling.test.ts` - Tests for keyboard and button inputs

## Adding New Tests

When adding new tests:

1. Create a test file in the `tests/` directory
2. Import the component to test
3. Use the standard Vitest format:

```typescript
import { describe, expect, it } from 'vitest'
import { YourComponent } from '../src/game/your-component'

describe('Your Component', () => {
  it('should do something specific', () => {
    // Test code here
    expect(result).toBe(expectedValue)
  })
})
```

## Mocking

The testing environment uses JSDOM for DOM simulation and mocks the Three.js library for testing 3D elements. See `tests/setup.ts` for details on how the mocking is configured.

## Test Coverage

To see test coverage, run:

```bash
npm run test:run -- --coverage
```

## Best Practices

1. Test core game logic independently from rendering
2. Mock external dependencies (Three.js, DOM API)
3. Keep tests small and focused
4. Test behavior rather than implementation details
5. Add tests for new features and bug fixes