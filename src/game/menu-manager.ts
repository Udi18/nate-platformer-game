/**
 * Menu Manager to handle game menus and their interactions
 */
export class MenuManager {
  // DOM elements
  private mainMenuElement: HTMLElement;
  private startButtonElement: HTMLElement;
  private hudElement: HTMLElement;
  
  // Event callback
  private onGameStart: () => void;
  
  /**
   * Initialize the menu manager
   * @param onGameStart Callback function to execute when starting the game
   */
  constructor(onGameStart: () => void) {
    // Store callback function
    this.onGameStart = onGameStart;
    
    // Get references to DOM elements
    this.mainMenuElement = document.getElementById('main-menu') as HTMLElement;
    this.startButtonElement = document.getElementById('start-button') as HTMLElement;
    this.hudElement = document.getElementById('hud') as HTMLElement;
    
    // Check if elements exist
    if (!this.mainMenuElement || !this.startButtonElement || !this.hudElement) {
      console.error('Could not find required menu elements in the DOM');
      return;
    }
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Show main menu by default
    this.showMainMenu();
  }
  
  /**
   * Setup menu event listeners
   */
  private setupEventListeners(): void {
    // Add click event to start button
    this.startButtonElement.addEventListener('click', this.handleStartGame);
  }
  
  /**
   * Handle starting the game
   */
  private handleStartGame = (): void => {
    this.hideMainMenu();
    this.showHUD();
    
    // Call the provided callback function
    if (this.onGameStart) {
      this.onGameStart();
    }
  }
  
  /**
   * Show the main menu
   */
  public showMainMenu(): void {
    if (this.mainMenuElement) {
      this.mainMenuElement.style.display = 'flex';
    }
  }
  
  /**
   * Hide the main menu
   */
  public hideMainMenu(): void {
    if (this.mainMenuElement) {
      this.mainMenuElement.style.display = 'none';
    }
  }
  
  /**
   * Show the HUD
   */
  public showHUD(): void {
    if (this.hudElement) {
      this.hudElement.style.display = 'block';
    }
  }
  
  /**
   * Hide the HUD
   */
  public hideHUD(): void {
    if (this.hudElement) {
      this.hudElement.style.display = 'none';
    }
  }
  
  /**
   * Clean up event listeners
   */
  public destroy(): void {
    this.startButtonElement.removeEventListener('click', this.handleStartGame);
  }
}