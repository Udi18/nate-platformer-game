/**
 * UI Manager to handle HUD and UI elements
 */
export class UIManager {
  // DOM elements
  private scoreValueElement: HTMLElement;
  
  // Game state
  private score: number = 0;
  
  /**
   * Initialize the UI manager
   */
  constructor() {
    // Get references to DOM elements
    this.scoreValueElement = document.getElementById('score-value') as HTMLElement;
    
    if (!this.scoreValueElement) {
      console.error('Could not find score-value element in the DOM');
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
}