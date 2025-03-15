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
    
    if (!this.scoreValueElement) {
      console.error('Could not find score-value element in the DOM');
    }
    
    if (!this.pauseOverlay) {
      console.error('Could not find pause-overlay element in the DOM');
    }
    
    if (!this.mainMenuOverlay) {
      console.error('Could not find main-menu element in the DOM');
    }
    
    if (!this.gameOverOverlay) {
      console.error('Could not find game-over-overlay element in the DOM');
    }
    
    // Initialize UI with default values
    this.updateScore(0);
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
      console.log('Main menu shown');
    } else {
      console.error('Main menu overlay element not found');
    }
  }
  
  /**
   * Hide the main menu
   */
  public hideMainMenu(): void {
    if (this.mainMenuOverlay) {
      this.mainMenuOverlay.style.display = 'none';
      console.log('Main menu hidden');
    } else {
      console.error('Main menu overlay element not found');
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