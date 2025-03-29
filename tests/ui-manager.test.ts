// filepath: /home/udi/development/nate-platformer-game/tests/ui-manager.test.ts
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { UIManager } from '../src/game/ui-manager';

// Mock the color-config import to avoid actual DOM manipulations during tests
vi.mock('../src/game/color-config', () => ({
  applyThemeToUI: vi.fn()
}));

describe('UI Manager', () => {
  let uiManager: UIManager;
  let scoreValueElement: HTMLElement | null;
  let pauseOverlayElement: HTMLElement | null;
  let gameOverElement: HTMLElement | null;
  let mainMenuElement: HTMLElement | null;

  // Set up the DOM elements needed by UIManager consistently before each test
  beforeEach(() => {
    // Clear previous elements and setup structure
    document.body.innerHTML = `
      <div id="score-value">0</div>
      <div id="pause-overlay" style="display: none;"></div>
      <div id="game-over-overlay" style="display: none;"></div>
      <div id="main-menu" style="display: none;"></div>
    `;

    // Get references after setting innerHTML
    scoreValueElement = document.getElementById('score-value');
    pauseOverlayElement = document.getElementById('pause-overlay');
    gameOverElement = document.getElementById('game-over-overlay');
    mainMenuElement = document.getElementById('main-menu');

    // Create the UI Manager instance for the test
    uiManager = new UIManager();
  });

  it('should initialize with zero score displayed', () => {
    expect(uiManager.getScore()).toBe(0);
    expect(scoreValueElement?.textContent).toBe('0');
  });

  it('should update the score correctly (non-incremental)', () => {
    uiManager.updateScore(10, false); // Set score to 10
    expect(uiManager.getScore()).toBe(10);
    expect(scoreValueElement?.textContent).toBe('10');

    uiManager.updateScore(0, false); // Set score to 0
    expect(uiManager.getScore()).toBe(0);
    expect(scoreValueElement?.textContent).toBe('0');
  });

  it('should update the score correctly (incremental)', () => {
    uiManager.updateScore(10, false); // Start at 10
    uiManager.updateScore(5, true); // Increment by 5
    expect(uiManager.getScore()).toBe(15);
    expect(scoreValueElement?.textContent).toBe('15');

    uiManager.updateScore(-7, true); // Increment by -7
    expect(uiManager.getScore()).toBe(8);
    expect(scoreValueElement?.textContent).toBe('8');
  });


  it('should show and hide the pause overlay', () => {
    // Initial state check (from beforeEach)
    expect(pauseOverlayElement?.style.display).toBe('none');

    // Show the overlay
    uiManager.showPauseOverlay();
    expect(pauseOverlayElement?.style.display).toBe('flex');

    // Hide the overlay
    uiManager.hidePauseOverlay();
    expect(pauseOverlayElement?.style.display).toBe('none');
  });

  it('should show and hide the main menu', () => {
    expect(mainMenuElement?.style.display).toBe('none'); // Initial state

    uiManager.showMainMenu();
    expect(mainMenuElement?.style.display).toBe('flex');

    uiManager.hideMainMenu();
    expect(mainMenuElement?.style.display).toBe('none');
  });

  it('should show and hide the game over overlay', () => {
    expect(gameOverElement?.style.display).toBe('none'); // Initial state

    uiManager.showGameOver();
    expect(gameOverElement?.style.display).toBe('flex');

    uiManager.hideGameOver();
    expect(gameOverElement?.style.display).toBe('none');
  });

  it('should handle missing DOM elements gracefully', () => {
    // Remove score element to test error handling
    const scoreElement = document.getElementById('score-value');
    if (scoreElement) {
      scoreElement.remove(); // Use remove() instead of removeChild from body
    }

    // Re-instantiate UIManager after removing the element
    const uiManagerWithoutScore = new UIManager();

    // This should not throw an error, though score won't update visually
    expect(() => uiManagerWithoutScore.updateScore(10)).not.toThrow();
    // Internal score state should still update
    expect(uiManagerWithoutScore.getScore()).toBe(10);
  });

  it('should handle large score values', () => {
    const largeNumber = 9999999;
    uiManager.updateScore(largeNumber, false);
    expect(uiManager.getScore()).toBe(largeNumber);
    expect(scoreValueElement?.textContent).toBe(largeNumber.toString());
  });

  it('should handle multiple consecutive UI state changes', () => {
    // Show and hide multiple overlays in sequence
    uiManager.showMainMenu();
    uiManager.showPauseOverlay();
    uiManager.showGameOver();

    // Check states
    expect(mainMenuElement?.style.display).toBe('flex');
    expect(pauseOverlayElement?.style.display).toBe('flex');
    expect(gameOverElement?.style.display).toBe('flex');

    // Hide everything
    uiManager.hideMainMenu();
    uiManager.hidePauseOverlay();
    uiManager.hideGameOver();

    // Verify all are hidden
    expect(mainMenuElement?.style.display).toBe('none');
    expect(pauseOverlayElement?.style.display).toBe('none');
    expect(gameOverElement?.style.display).toBe('none');
  });
});