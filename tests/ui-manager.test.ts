import { describe, expect, it, beforeEach, vi } from 'vitest'
import { UIManager } from '../src/game/ui-manager'

// Mock the color-config import to avoid actual DOM manipulations during tests
vi.mock('../src/game/color-config', () => ({
  applyThemeToUI: vi.fn()
}))

describe('UI Manager', () => {
  let uiManager: UIManager
  
  // Set up the DOM elements needed by UIManager
  beforeEach(() => {
    // Clean up any existing elements from previous tests
    document.body.innerHTML = ''
    
    // Ensure score value element exists
    const scoreValueElement = document.createElement('div')
    scoreValueElement.id = 'score-value'
    scoreValueElement.textContent = '0'
    document.body.appendChild(scoreValueElement)
    
    // Ensure pause overlay exists
    const pauseOverlayElement = document.createElement('div')
    pauseOverlayElement.id = 'pause-overlay'
    pauseOverlayElement.style.display = 'none'
    document.body.appendChild(pauseOverlayElement)
    
    // Ensure game over overlay exists
    const gameOverElement = document.createElement('div')
    gameOverElement.id = 'game-over-overlay'
    gameOverElement.style.display = 'none'
    document.body.appendChild(gameOverElement)
    
    // Ensure main menu exists
    const mainMenuElement = document.createElement('div')
    mainMenuElement.id = 'main-menu'
    mainMenuElement.style.display = 'none'
    document.body.appendChild(mainMenuElement)
    
    // Create the UI Manager
    uiManager = new UIManager()
  })
  
  it('should initialize with zero score', () => {
    expect(uiManager.getScore()).toBe(0)
  })
  
  it('should update the score', () => {
    // Update score by 10, not incrementally
    uiManager.updateScore(10, false)
    expect(uiManager.getScore()).toBe(10)
    
    // Update score incrementally by 5
    uiManager.updateScore(5, true)
    expect(uiManager.getScore()).toBe(15)
    
    // Test the DOM element is updated
    const scoreElement = document.getElementById('score-value')
    expect(scoreElement?.textContent).toBe('15')
  })
  
  it('should show and hide the pause overlay', () => {
    const pauseOverlay = document.getElementById('pause-overlay')
    
    // Set initial state explicitly
    if (pauseOverlay) {
      pauseOverlay.style.display = 'none'
    }
    
    // Show the overlay
    uiManager.showPauseOverlay()
    expect(pauseOverlay?.style.display).toBe('flex')
    
    // Hide the overlay
    uiManager.hidePauseOverlay()
    expect(pauseOverlay?.style.display).toBe('none')
  })
  
  it('should show and hide the main menu', () => {
    const mainMenu = document.getElementById('main-menu')
    
    // Show the menu
    uiManager.showMainMenu()
    expect(mainMenu?.style.display).toBe('flex')
    
    // Hide the menu
    uiManager.hideMainMenu()
    expect(mainMenu?.style.display).toBe('none')
  })
  
  it('should show the game over overlay', () => {
    const gameOverOverlay = document.getElementById('game-over-overlay')
    
    // Show the overlay
    uiManager.showGameOver()
    expect(gameOverOverlay?.style.display).toBe('flex')
    
    // Hide the overlay
    uiManager.hideGameOver()
    expect(gameOverOverlay?.style.display).toBe('none')
  })
  
  it('should set score to zero with updateScore', () => {
    // Set score to a non-zero value
    uiManager.updateScore(50, false)
    expect(uiManager.getScore()).toBe(50)
    
    // Reset score using updateScore with 0
    uiManager.updateScore(0, false)
    expect(uiManager.getScore()).toBe(0)
    
    // Check DOM element
    const scoreElement = document.getElementById('score-value')
    expect(scoreElement?.textContent).toBe('0')
  })
  
  // Added tests for more robustness
  it('should handle missing DOM elements gracefully', () => {
    // Remove score element to test error handling
    const scoreElement = document.getElementById('score-value')
    if (scoreElement) {
      document.body.removeChild(scoreElement)
    }
    
    // This should not throw an error
    expect(() => uiManager.updateScore(10)).not.toThrow()
  })
  
  it('should handle large score values', () => {
    // Test with a very large number
    const largeNumber = 9999999
    uiManager.updateScore(largeNumber, false)
    expect(uiManager.getScore()).toBe(largeNumber)
    
    const scoreElement = document.getElementById('score-value')
    expect(scoreElement?.textContent).toBe(largeNumber.toString())
  })
  
  it('should handle negative score increments correctly', () => {
    // Set initial score
    uiManager.updateScore(100, false)
    
    // Apply negative increment
    uiManager.updateScore(-20, true)
    expect(uiManager.getScore()).toBe(80)
  })
  
  it('should handle multiple consecutive UI state changes', () => {
    // Show and hide multiple overlays in sequence
    uiManager.showMainMenu()
    uiManager.showPauseOverlay()
    uiManager.showGameOver()
    
    // Check states
    expect(document.getElementById('main-menu')?.style.display).toBe('flex')
    expect(document.getElementById('pause-overlay')?.style.display).toBe('flex')
    expect(document.getElementById('game-over-overlay')?.style.display).toBe('flex')
    
    // Hide everything
    uiManager.hideMainMenu()
    uiManager.hidePauseOverlay()
    uiManager.hideGameOver()
    
    // Verify all are hidden
    expect(document.getElementById('main-menu')?.style.display).toBe('none')
    expect(document.getElementById('pause-overlay')?.style.display).toBe('none')
    expect(document.getElementById('game-over-overlay')?.style.display).toBe('none')
  })
})