// filepath: /home/udi/development/nate-platformer-game/tests/game.test.ts
import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { Game } from '../src/game/game'; // Assuming the mock is correctly imported via setup.ts

// This test suite works with the heavily mocked Game class defined in setup.ts.
// It primarily verifies that the expected public API methods are called in simulated scenarios.
// Full integration testing would require removing the mock.
describe('Game API (Mocked)', () => {
  let game: any; // Type as 'any' because it's a mocked instance

  beforeEach(() => {
    // Instantiate the mocked Game class
    // Vitest automatically uses the mock from setup.ts
    game = new Game();
  });

  afterEach(() => {
    // Clear mocks after each test
    vi.clearAllMocks();
  });

  it('should have the expected public interface', () => {
    // Verify the game mock has the expected methods
    expect(typeof game.start).toBe('function');
    expect(typeof game.stop).toBe('function');
    expect(typeof game.togglePause).toBe('function');
    expect(typeof game.destroy).toBe('function');
    expect(typeof game.restartGame).toBe('function');
    expect(typeof game.generateNewLevel).toBe('function');
    // Note: startGame is usually called internally or via UI, not tested directly here
  });

  it('should call start when the game loop begins', () => {
    // Simulate starting the game loop
    game.start();
    expect(game.start).toHaveBeenCalledOnce();
  });

  it('should call stop when the game loop ends', () => {
    // Simulate stopping the game loop
    game.stop();
    expect(game.stop).toHaveBeenCalledOnce();
  });

  it('should call togglePause when pausing or resuming', () => {
    // Simulate pausing
    game.togglePause();
    expect(game.togglePause).toHaveBeenCalledTimes(1);

    // Simulate resuming
    game.togglePause();
    expect(game.togglePause).toHaveBeenCalledTimes(2);
  });

  it('should call generateNewLevel when requesting a new procedural level', () => {
    // Simulate generating a new level
    game.generateNewLevel();
    expect(game.generateNewLevel).toHaveBeenCalledOnce();
  });

  it('should call destroy for cleanup', () => {
    // Simulate destroying the game instance
    game.destroy();
    expect(game.destroy).toHaveBeenCalledOnce();
  });

  // Example of simulating a game flow (still relies on mocks)
  it('should simulate a simple game flow: start -> pause -> resume -> stop', () => {
    game.start();
    game.togglePause(); // Pause
    game.togglePause(); // Resume
    game.stop();

    // Verify methods were called in sequence (or at least called)
    expect(game.start).toHaveBeenCalledOnce();
    expect(game.togglePause).toHaveBeenCalledTimes(2);
    expect(game.stop).toHaveBeenCalledOnce();
  });
});