import { describe, expect, it } from 'vitest';
import { generatePlatforms, generateEnemies, generateCollectibles, DEFAULT_LEVEL_PARAMS, LevelGenerationParams } from '../src/game/level-generator';
import { PlatformDefinition } from '../src/game/platforms';

// Helper function to calculate total width of floating platforms
const calculateFloatingPlatformWidth = (platforms: PlatformDefinition[], groundY: number): number => {
  return platforms
    .filter(p => Math.abs(p.position.y - groundY) > 0.1) // Exclude ground platforms
    .reduce((totalWidth, p) => totalWidth + p.width, 0);
};

describe('Level Generator - Density Checks', () => {

  it('should generate enemy count roughly based on density and platform space', () => {
    const params: LevelGenerationParams = {
      ...DEFAULT_LEVEL_PARAMS,
      seed: 67890, // Use a fixed seed for reproducibility
      enemyDensity: 0.5, // Example density: 50% chance per platform
      minEnemiesPerPlatform: 1,
      maxEnemiesPerPlatform: 2
    };
    const platforms = generatePlatforms(params);
    const enemies = generateEnemies(platforms, params);

    // Count floating platforms suitable for enemies (width >= 2)
    const suitableFloatingPlatforms = platforms.filter(p =>
      Math.abs(p.position.y - params.groundY) > 0.1 && p.width >= 2
    ).length;

    // Estimate expected enemy count range (this is approximate)
    // Lower bound: density * suitable platforms * min enemies
    // Upper bound: density * suitable platforms * max enemies
    const expectedMinEnemies = Math.floor(suitableFloatingPlatforms * params.enemyDensity * params.minEnemiesPerPlatform * 0.5); // Allow some variance
    const expectedMaxEnemies = Math.ceil(suitableFloatingPlatforms * params.enemyDensity * params.maxEnemiesPerPlatform * 1.5); // Allow some variance

    // Add enemies potentially generated on ground platforms (from generateEnemies logic)
    const groundPlatforms = platforms.filter(p => Math.abs(p.position.y - params.groundY) < 0.1 && p.width >= 2.5 && Math.abs(p.position.x) >= 3).length;
    const maxGroundEnemies = groundPlatforms * 2; // Max 2 per suitable ground segment

    expect(enemies.length).toBeGreaterThanOrEqual(expectedMinEnemies);
    // Adjust upper bound check to include potential ground enemies
    expect(enemies.length).toBeLessThanOrEqual(expectedMaxEnemies + maxGroundEnemies);
  });

  it('should generate collectible count roughly based on density and platform space', () => {
    const params: LevelGenerationParams = {
      ...DEFAULT_LEVEL_PARAMS,
      seed: 112233, // Use a fixed seed
      collectibleDensity: 0.8, // Example density: 80% chance per platform
      minCollectiblesPerPlatform: 1,
      maxCollectiblesPerPlatform: 3
    };
    const platforms = generatePlatforms(params);
    const collectibles = generateCollectibles(platforms, params);

    // Count platforms suitable for collectibles (width >= 1.5)
    const suitablePlatforms = platforms.filter(p => p.width >= 1.5).length;

    // Estimate expected collectible count range (approximate)
    const expectedMinCollectibles = Math.floor(suitablePlatforms * params.collectibleDensity * params.minCollectiblesPerPlatform * 0.5);
    const expectedMaxCollectibles = Math.ceil(suitablePlatforms * params.collectibleDensity * params.maxCollectiblesPerPlatform * 1.5);

    // Add collectibles potentially generated over gaps (harder to estimate precisely)
    // Let's add a buffer based on number of ground segments
    const groundSegments = platforms.filter(p => Math.abs(p.position.y - params.groundY) < 0.1).length;
    const maxGapCollectibles = (groundSegments > 1 ? groundSegments - 1 : 0) * 5; // Max 5 per gap

    expect(collectibles.length).toBeGreaterThanOrEqual(expectedMinCollectibles);
    expect(collectibles.length).toBeLessThanOrEqual(expectedMaxCollectibles + maxGapCollectibles); // Add buffer for gap collectibles
  });

  it('should generate fewer enemies with lower density', () => {
    const paramsLow: LevelGenerationParams = { ...DEFAULT_LEVEL_PARAMS, seed: 456, enemyDensity: 0.1 };
    const paramsHigh: LevelGenerationParams = { ...DEFAULT_LEVEL_PARAMS, seed: 456, enemyDensity: 0.9 }; // Same seed

    const platformsLow = generatePlatforms(paramsLow);
    const enemiesLow = generateEnemies(platformsLow, paramsLow);

    const platformsHigh = generatePlatforms(paramsHigh); // Regenerate platforms with same seed
    const enemiesHigh = generateEnemies(platformsHigh, paramsHigh);

    // Expect significantly fewer enemies with lower density
    expect(enemiesLow.length).toBeLessThan(enemiesHigh.length);
  });

  it('should generate fewer collectibles with lower density', () => {
    const paramsLow: LevelGenerationParams = { ...DEFAULT_LEVEL_PARAMS, seed: 789, collectibleDensity: 0.1 };
    const paramsHigh: LevelGenerationParams = { ...DEFAULT_LEVEL_PARAMS, seed: 789, collectibleDensity: 0.9 };

    const platformsLow = generatePlatforms(paramsLow);
    const collectiblesLow = generateCollectibles(platformsLow, paramsLow);

    const platformsHigh = generatePlatforms(paramsHigh);
    const collectiblesHigh = generateCollectibles(platformsHigh, paramsHigh);

    expect(collectiblesLow.length).toBeLessThan(collectiblesHigh.length);
  });
});