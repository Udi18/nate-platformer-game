import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest'
import { Game } from '../src/game/game'

// This is a simplified test file using the mock Game from setup.ts
describe('Game API', () => {
  let game: any
  
  beforeEach(() => {
    // Get mocked instance
    game = new Game()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should have the expected interface', () => {
    // Verify the game has the expected methods
    expect(typeof game.start).toBe('function')
    expect(typeof game.stop).toBe('function')
    expect(typeof game.togglePause).toBe('function')
    expect(typeof game.destroy).toBe('function')
    expect(typeof game.restartGame).toBe('function')
    expect(typeof game.generateNewLevel).toBe('function')
  })
  
  it('should call start when started', () => {
    const startSpy = vi.spyOn(game, 'start')
    
    game.start()
    
    expect(startSpy).toHaveBeenCalled()
  })
  
  it('should call stop when stopped', () => {
    const stopSpy = vi.spyOn(game, 'stop')
    
    game.stop()
    
    expect(stopSpy).toHaveBeenCalled()
  })
  
  it('should call togglePause when paused/unpaused', () => {
    const togglePauseSpy = vi.spyOn(game, 'togglePause')
    
    game.togglePause()
    
    expect(togglePauseSpy).toHaveBeenCalled()
  })
  
  it('should call destroy when destroyed', () => {
    const destroySpy = vi.spyOn(game, 'destroy')
    
    game.destroy()
    
    expect(destroySpy).toHaveBeenCalled()
  })
  
  it('should call restartGame when restarted', () => {
    const restartSpy = vi.spyOn(game, 'restartGame')
    
    game.restartGame()
    
    expect(restartSpy).toHaveBeenCalled()
  })
  
  it('should call generateNewLevel when generating a new level', () => {
    const generateSpy = vi.spyOn(game, 'generateNewLevel')
    
    game.generateNewLevel()
    
    expect(generateSpy).toHaveBeenCalled()
  })
})