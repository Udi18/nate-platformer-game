import { applyThemeToUI } from './color-config';

/**
 * UI Manager to handle HUD and UI elements
 */
export class UIManager {
  // DOM elements
  private scoreValueElement: HTMLElement;
  private pauseOverlay: HTMLElement;
  private mainMenuOverlay: HTMLElement;
  private gameOverOverlay: HTMLElement;
  
  // Game state
  private score: number = 0;
  
  /**
   * Initialize the UI manager
   */
  constructor() {
    // Get references to DOM elements
    this.scoreValueElement = document.getElementById('score-value') as HTMLElement;
    this.pauseOverlay = document.getElementById('pause-overlay') as HTMLElement;
    this.mainMenuOverlay = document.getElementById('main-menu') as HTMLElement;
    this.gameOverOverlay = document.getElementById('game-over-overlay') as HTMLElement;
    
    // Initialize UI with default values
    this.updateScore(0);
    
    // Apply theme colors to UI elements
    applyThemeToUI();
  }
  
  /**
   * Update the score display
   * @param score The new score value or increment amount
   * @param increment Whether to increment the existing score (default: false)
   */
  public updateScore(score: number, increment: boolean = false): void {
    if (increment) {
      this.score += score;
    } else {
      this.score = score;
    }
    
    // Update the DOM
    if (this.scoreValueElement) {
      this.scoreValueElement.textContent = this.score.toString();
    }
  }
  
  /**
   * Get the current score
   */
  public getScore(): number {
    return this.score;
  }
  
  /**
   * Show the game over screen
   */
  public showGameOver(): void {
    if (this.gameOverOverlay) {
      this.gameOverOverlay.style.display = 'flex';
    }
  }
  
  /**
   * Hide the game over screen
   */
  public hideGameOver(): void {
    if (this.gameOverOverlay) {
      this.gameOverOverlay.style.display = 'none';
    }
  }
  
  /**
   * Show the main menu (start game overlay)
   */
  public showMainMenu(): void {
    if (this.mainMenuOverlay) {
      this.mainMenuOverlay.style.display = 'flex';
    }
  }
  
  /**
   * Hide the main menu
   */
  public hideMainMenu(): void {
    if (this.mainMenuOverlay) {
      this.mainMenuOverlay.style.display = 'none';
    }
  }
  
  /**
   * Show the pause overlay
   */
  public showPauseOverlay(): void {
    if (this.pauseOverlay) {
      this.pauseOverlay.style.display = 'flex';
    }
  }
  
  /**
   * Hide the pause overlay
   */
  public hidePauseOverlay(): void {
    if (this.pauseOverlay) {
      this.pauseOverlay.style.display = 'none';
    }
  }
}