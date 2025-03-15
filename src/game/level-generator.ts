import { PlatformDefinition } from './platforms';
import { EnemyDefinition } from './enemies';
import { CollectibleDefinition } from './collectibles';
import { getCurrentTheme, PlatformColor, EnemyColor, CollectibleColor } from './color-config';

export interface LevelGenerationParams {
  seed?: number;
  levelWidth: number;
  levelMinX: number;
  levelMaxX: number;
  groundY: number;
  groundHeight: number;
  minPlatformWidth: number;
  maxPlatformWidth: number;
  minPlatformHeight: number;
  maxPlatformHeight: number;
  minY: number;
  maxY: number;
  minPlatformSpacingY: number;
  maxPlatformSpacingY: number;
  minPlatformSpacingX: number;
  maxPlatformSpacingX: number;
  playerJumpHeight: number;
  playerJumpDistance: number;
  enemyDensity: number;
  minEnemiesPerPlatform: number;
  maxEnemiesPerPlatform: number;
  collectibleDensity: number;
  minCollectiblesPerPlatform: number;
  maxCollectiblesPerPlatform: number;
  collectibleHeight: number;
}

export const DEFAULT_LEVEL_PARAMS: LevelGenerationParams = {
  levelWidth: 80,
  levelMinX: -40,
  levelMaxX: 40,
  groundY: -4.3,
  groundHeight: 0.5,
  minPlatformWidth: 2.5,
  maxPlatformWidth: 5,
  minPlatformHeight: 0.5,
  maxPlatformHeight: 0.5,
  minY: -3.0,
  maxY: 2.5,
  minPlatformSpacingY: 1.8,
  maxPlatformSpacingY: 2.5,
  minPlatformSpacingX: 2.5,
  maxPlatformSpacingX: 4,
  playerJumpHeight: 3.5,
  playerJumpDistance: 4,
  enemyDensity: 0.4,
  minEnemiesPerPlatform: 1,
  maxEnemiesPerPlatform: 2,
  collectibleDensity: 0.7,
  minCollectiblesPerPlatform: 1,
  maxCollectiblesPerPlatform: 3,
  collectibleHeight: 0.7
};

class SeededRandom {
  private seed: number;
  
  constructor(seed?: number) {
    this.seed = seed || Math.floor(Math.random() * 1000000);
  }
  
  public getSeed(): number {
    return this.seed;
  }
  
  public setSeed(seed: number): void {
    this.seed = seed;
  }
  
  public random(): number {
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    
    this.seed = (a * this.seed + c) % m;
    
    return this.seed / m;
  }
  
  public randomBetween(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }
  
  public randomInt(min: number, max: number): number {
    return Math.floor(this.randomBetween(min, max + 0.99999));
  }
}

let randomGenerator = new SeededRandom();

function randomBetween(min: number, max: number): number {
  return randomGenerator.randomBetween(min, max);
}

/**
 * Generates a slightly varied color based on a base color
 * @param baseColor The base color to vary
 * @param amount The amount to vary the color (0-1)
 * @returns A slightly different shade of the base color
 */
function varyColor(baseColor: number, amount: number = 0.2): number {
  // Extract RGB components
  const r = (baseColor >> 16) & 0xFF;
  const g = (baseColor >> 8) & 0xFF;
  const b = baseColor & 0xFF;
  
  // Calculate variation amounts (slightly brighten or darken)
  const variance = randomBetween(-amount, amount);
  
  // Apply variation while keeping values in 0-255 range
  const newR = Math.max(0, Math.min(255, Math.round(r * (1 + variance))));
  const newG = Math.max(0, Math.min(255, Math.round(g * (1 + variance))));
  const newB = Math.max(0, Math.min(255, Math.round(b * (1 + variance))));
  
  // Recombine into a single color value
  return (newR << 16) | (newG << 8) | newB;
}

/**
 * Gets a platform color with slight variation
 */
function getPlatformColor(): number {
  return varyColor(getCurrentTheme().platform, 0.15);
}

/**
 * Gets an enemy color with slight variation
 * @param isSpecial If true, use a special enemy color if available
 */
function getEnemyColor(isSpecial: boolean = false): number {
  const theme = getCurrentTheme();
  const baseColor = isSpecial && theme.enemySpecial ? theme.enemySpecial : theme.enemy;
  return varyColor(baseColor, 0.2);
}

/**
 * Gets a collectible color with slight variation
 * @param isSpecial If true, use a special collectible color if available
 */
function getCollectibleColor(isSpecial: boolean = false): number {
  const theme = getCurrentTheme();
  const baseColor = isSpecial && theme.collectibleSpecial ? theme.collectibleSpecial : theme.collectible;
  return varyColor(baseColor, 0.1);
}

function platformOverlaps(
  platformX: number,
  platformY: number,
  platformWidth: number,
  platformHeight: number,
  existingPlatforms: PlatformDefinition[]
): boolean {
  for (const platform of existingPlatforms) {
    const isGroundPlatform = Math.abs(platform.position.y - DEFAULT_LEVEL_PARAMS.groundY) < 0.1;
    const isFloatingPlatform = Math.abs(platformY - DEFAULT_LEVEL_PARAMS.groundY) > 0.5;
    
    if (isGroundPlatform && isFloatingPlatform) {
      continue;
    }
    
    const newLeft = platformX - platformWidth / 2;
    const newRight = platformX + platformWidth / 2;
    const newTop = platformY + platformHeight / 2;
    const newBottom = platformY - platformHeight / 2;
    
    const existingLeft = platform.position.x - platform.width / 2;
    const existingRight = platform.position.x + platform.width / 2;
    const existingTop = platform.position.y + platform.height / 2;
    const existingBottom = platform.position.y - platform.height / 2;
    
    const horizontalOverlap = newRight > existingLeft && newLeft < existingRight;
    const verticalOverlap = newTop > existingBottom && newBottom < existingTop;
    
    const horizontalBuffer = 1.0;
    const verticalBuffer = 1.0;
    
    const tooCloseHorizontally = 
      Math.abs(newRight - existingLeft) < horizontalBuffer || 
      Math.abs(newLeft - existingRight) < horizontalBuffer;
    
    const tooCloseVertically = 
      Math.abs(newTop - existingBottom) < verticalBuffer || 
      Math.abs(newBottom - existingTop) < verticalBuffer;
    
    if (horizontalOverlap && verticalOverlap) {
      return true;
    }
    
    if (isFloatingPlatform && !isGroundPlatform && platform.position.y > DEFAULT_LEVEL_PARAMS.groundY + 0.5) {
      if ((horizontalOverlap && tooCloseVertically) || (verticalOverlap && tooCloseHorizontally)) {
        return true;
      }
    }
  }
  
  return false;
}

function isPlatformLocationValid(
  platformX: number,
  platformY: number,
  platformWidth: number,
  platformHeight: number,
  existingPlatforms: PlatformDefinition[],
  params: LevelGenerationParams,
  isFirstRow: boolean = false
): boolean {
  if (platformOverlaps(platformX, platformY, platformWidth, platformHeight, existingPlatforms)) {
    return false;
  }
  
  if (existingPlatforms.length === 0 || isFirstRow) {
    const groundPlatform = existingPlatforms[0];
    
    if (isFirstRow && groundPlatform) {
      const heightAboveGround = platformY - groundPlatform.position.y;
      
      if (heightAboveGround > params.playerJumpHeight * 0.7) {
        return false;
      }
      
      return true;
    }
    
    return true;
  }
  
  for (let i = 1; i < existingPlatforms.length; i++) {
    const platform = existingPlatforms[i];
    
    const horizontalDistance = Math.abs(platformX - platform.position.x);
    const verticalDistance = platformY - platform.position.y;
    
    const withinHorizontalRange = horizontalDistance <= params.playerJumpDistance;
    const withinVerticalRange = verticalDistance <= params.playerJumpHeight && verticalDistance >= -params.playerJumpHeight * 2;
    
    const platformHalfWidth = platformWidth / 2;
    const existingHalfWidth = platform.width / 2;
    const edgesClose = horizontalDistance < (platformHalfWidth + existingHalfWidth + params.playerJumpDistance * 0.5);
    
    if ((withinHorizontalRange && withinVerticalRange) || (edgesClose && Math.abs(verticalDistance) < params.playerJumpHeight)) {
      return true;
    }
  }
  
  return false;
}

export function generatePlatforms(params: LevelGenerationParams = DEFAULT_LEVEL_PARAMS): PlatformDefinition[] {
  const platforms: PlatformDefinition[] = [];
  
  const groundY = params.groundY;
  const groundHeight = params.groundHeight;
  
  const groundLeft = params.levelMinX;
  const groundRight = params.levelMaxX;
  
  platforms.push({
    width: 12,
    height: groundHeight,
    position: {
      x: 0,
      y: groundY
    },
    color: getPlatformColor()
  });
  
  let currentX = -8;
  
  while (currentX > groundLeft + 2) {
    const createGap = Math.random() < 0.3;
    
    if (createGap) {
      const gapWidth = randomBetween(2, 3);
      currentX -= gapWidth;
    } else {
      const segmentWidth = randomBetween(3, 8);
      
      const actualWidth = Math.min(segmentWidth, Math.abs(currentX - groundLeft) - 2);
      
      if (actualWidth > 1) {
        platforms.push({
          width: actualWidth,
          height: groundHeight,
          position: {
            x: currentX - actualWidth / 2,
            y: groundY
          },
          color: getPlatformColor()
        });
      }
      
      currentX -= (actualWidth + 1);
    }
  }
  
  currentX = 8;
  
  while (currentX < groundRight - 2) {
    const createGap = Math.random() < 0.3;
    
    if (createGap) {
      const gapWidth = randomBetween(2, 3);
      currentX += gapWidth;
    } else {
      const segmentWidth = randomBetween(3, 8);
      
      const actualWidth = Math.min(segmentWidth, Math.abs(groundRight - currentX) - 2);
      
      if (actualWidth > 1) {
        platforms.push({
          width: actualWidth,
          height: groundHeight,
          position: {
            x: currentX + actualWidth / 2,
            y: groundY
          },
          color: getPlatformColor()
        });
      }
      
      currentX += (actualWidth + 1);
    }
  }
  
  const firstRowY = groundY + groundHeight / 2 + randomBetween(1.5, 2.0);
  
  let x = params.levelMinX + randomBetween(4, 8);
  
  const firstRowPlatformCount = Math.floor(randomBetween(5, 8));
  let placedFirstRowPlatforms = 0;
  
  while (x < params.levelMaxX - 4 && placedFirstRowPlatforms < firstRowPlatformCount) {
    const width = randomBetween(params.minPlatformWidth, params.maxPlatformWidth);
    
    const platform: PlatformDefinition = {
      width,
      height: params.minPlatformHeight,
      position: {
        x,
        y: firstRowY
      },
      color: getPlatformColor()
    };
    
    if (isPlatformLocationValid(x, firstRowY, width, params.minPlatformHeight, platforms, params, true)) {
      platforms.push(platform);
      placedFirstRowPlatforms++;
    }
    
    x += width + randomBetween(params.minPlatformSpacingX + 1, params.maxPlatformSpacingX + 2);
  }
  
  let currentHeight = firstRowY;
  
  const heightRange = params.maxY - firstRowY;
  const avgRowSpacing = (params.minPlatformSpacingY + params.maxPlatformSpacingY) / 2;
  const numRows = Math.floor(heightRange / avgRowSpacing) + 1;
  
  for (let row = 0; row < numRows; row++) {
    currentHeight += randomBetween(params.minPlatformSpacingY, params.maxPlatformSpacingY);
    
    if (currentHeight > params.maxY) break;
    
    if (row === 0) {
      const groundSegments = platforms.filter(p => 
        Math.abs(p.position.y - groundY) < 0.1
      ).sort((a, b) => a.position.x - b.position.x);
      
      if (groundSegments.length > 1) {
        for (let i = 0; i < groundSegments.length - 1; i++) {
          const currentSegment = groundSegments[i];
          const nextSegment = groundSegments[i + 1];
          
          const currentRight = currentSegment.position.x + currentSegment.width / 2;
          const nextLeft = nextSegment.position.x - nextSegment.width / 2;
          const gapWidth = nextLeft - currentRight;
          
          if (gapWidth > 2 && gapWidth < 8) {
            const bridgeX = currentRight + gapWidth / 2;
            const bridgeWidth = Math.min(3, gapWidth * 0.7);
            
            const bridgePlatform: PlatformDefinition = {
              width: bridgeWidth,
              height: params.minPlatformHeight,
              position: {
                x: bridgeX,
                y: firstRowY + randomBetween(-0.5, 0.5)
              },
              color: getPlatformColor()
            };
            
            if (isPlatformLocationValid(
              bridgePlatform.position.x, 
              bridgePlatform.position.y, 
              bridgePlatform.width, 
              bridgePlatform.height, 
              platforms, 
              params
            )) {
              platforms.push(bridgePlatform);
            }
          }
        }
      }
    }
    
    const useZigZagPattern = row > 0 && Math.random() < 0.5;
    
    if (useZigZagPattern) {
      const segmentWidth = (params.levelMaxX - params.levelMinX) / 5;
      const platformSpacing = params.levelMaxX / 2.5;
      
      for (let i = 0; i < 5; i++) {
        const isLeft = i % 2 === 0;
        const offsetX = isLeft ? 
          -randomBetween(platformSpacing * 0.5, platformSpacing) : 
          randomBetween(platformSpacing * 0.5, platformSpacing);
        
        const segmentCenter = params.levelMinX + (i + 0.5) * segmentWidth;
        const x = segmentCenter + offsetX;
        
        if (x < params.levelMinX + 4 || x > params.levelMaxX - 4) continue;
        
        const width = randomBetween(params.minPlatformWidth, params.maxPlatformWidth * 0.8);
        
        const platform: PlatformDefinition = {
          width,
          height: params.minPlatformHeight,
          position: {
            x,
            y: currentHeight + (isLeft ? randomBetween(-0.5, 0.5) : randomBetween(-0.5, 0.5))
          },
          color: getPlatformColor()
        };
        
        if (isPlatformLocationValid(
          platform.position.x, 
          platform.position.y, 
          width, 
          params.minPlatformHeight, 
          platforms, 
          params
        )) {
          platforms.push(platform);
        }
      }
    } else {
      let x = params.levelMinX + randomBetween(4, 8);
      
      const platformsPerRow = Math.floor(randomBetween(3, 5));
      let placedPlatformsInRow = 0;
      
      let attempts = 0;
      const maxAttempts = 20;
      
      while (x < params.levelMaxX - 4 && placedPlatformsInRow < platformsPerRow && attempts < maxAttempts) {
        const width = randomBetween(params.minPlatformWidth, params.maxPlatformWidth);
        
        const platform: PlatformDefinition = {
          width,
          height: params.minPlatformHeight,
          position: {
            x,
            y: currentHeight + randomBetween(-0.3, 0.3)
          },
          color: getPlatformColor()
        };
        
        if (isPlatformLocationValid(
          platform.position.x, 
          platform.position.y, 
          width, 
          params.minPlatformHeight, 
          platforms, 
          params
        )) {
          platforms.push(platform);
          placedPlatformsInRow++;
          
          x += width + randomBetween(params.minPlatformSpacingX, params.maxPlatformSpacingX);
        } else {
          x += randomBetween(2, 3);
        }
        
        attempts++;
      }
    }
  }
  
  const existingRows: number[] = [];
  const existingPlatforms = platforms.filter(p => p.position.y > groundY + 1);
  
  existingPlatforms.forEach(platform => {
    const rowY = Math.round(platform.position.y * 2) / 2;
    if (!existingRows.includes(rowY)) {
      existingRows.push(rowY);
    }
  });
  
  existingRows.sort((a, b) => a - b);
  
  if (existingRows.length > 1) {
    for (let i = 0; i < existingRows.length - 1; i++) {
      const lowerRowY = existingRows[i];
      const upperRowY = existingRows[i + 1];
      
      if (upperRowY - lowerRowY < 1.5) continue;
      
      const lowerPlatforms = existingPlatforms.filter(
        p => Math.abs(p.position.y - lowerRowY) < 0.5
      );
      const upperPlatforms = existingPlatforms.filter(
        p => Math.abs(p.position.y - upperRowY) < 0.5
      );
      
      for (let j = 0; j < 3; j++) {
        const lowerPlatform = lowerPlatforms[Math.floor(Math.random() * lowerPlatforms.length)];
        const upperPlatform = upperPlatforms[Math.floor(Math.random() * upperPlatforms.length)];
        
        if (!lowerPlatform || !upperPlatform) continue;
        
        const connectX = (lowerPlatform.position.x + upperPlatform.position.x) / 2 + randomBetween(-2, 2);
        const connectY = (lowerPlatform.position.y + upperPlatform.position.y) / 2;
        
        const connector: PlatformDefinition = {
          width: randomBetween(1.5, 2.5),
          height: params.minPlatformHeight,
          position: {
            x: connectX,
            y: connectY
          },
          color: getPlatformColor()
        };
        
        if (isPlatformLocationValid(
          connector.position.x, 
          connector.position.y, 
          connector.width, 
          connector.height, 
          platforms, 
          params
        )) {
          platforms.push(connector);
        }
      }
    }
  }
  
  return platforms;
}

export function generateEnemies(
  platforms: PlatformDefinition[],
  params: LevelGenerationParams = DEFAULT_LEVEL_PARAMS
): EnemyDefinition[] {
  const enemies: EnemyDefinition[] = [];
  
  for (let i = 1; i < platforms.length; i++) {
    const platform = platforms[i];
    
    if (Math.random() < params.enemyDensity) {
      if (platform.width < 2) {
        continue;
      }
      
      const platformLeft = platform.position.x - platform.width / 2;
      
      let maxEnemies = platform.width < 3 ? 1 : params.maxEnemiesPerPlatform;
      
      const numEnemies = Math.floor(
        randomBetween(params.minEnemiesPerPlatform, maxEnemies + 0.99)
      );
      
      const platformCapacity = Math.floor(platform.width / 2);
      const actualNumEnemies = Math.min(numEnemies, platformCapacity);
      
      if (actualNumEnemies <= 0) continue;
      
      for (let j = 0; j < actualNumEnemies; j++) {
        let x;
        let moveType;
        let moveRange;
        
        if (actualNumEnemies > 1) {
          const segmentWidth = platform.width / actualNumEnemies;
          const segmentStart = platformLeft + j * segmentWidth;
          const segmentCenter = segmentStart + segmentWidth / 2;
          
          x = segmentCenter;
          
          moveRange = Math.max(0.5, segmentWidth - 1); 
          
          moveType = segmentWidth >= 2 ? 'horizontal' : 'stationary';
        } else {
          x = platform.position.x;
          
          moveRange = Math.max(0.5, platform.width - 1);
          
          moveType = platform.width >= 2.5 ? 'horizontal' : 'stationary';
        }
        
        enemies.push({
          width: 0.7,
          height: 0.7,
          position: {
            x,
            y: platform.position.y + platform.height / 2 + 0.35
          },
          color: getEnemyColor(Math.random() < 0.3),
          moveType: moveType as 'stationary' | 'horizontal',
          moveSpeed: moveType === 'horizontal' ? randomBetween(1, 2) : 0,
          moveRange,
          gravity: 20
        });
      }
    }
  }
  
  const groundPlatforms = platforms.filter(p => 
    Math.abs(p.position.y - params.groundY) < 0.1 && p.width >= 2.5
  );
  
  for (const groundPlatform of groundPlatforms) {
    if (Math.abs(groundPlatform.position.x) < 3) {
      continue;
    }
    
    const platformCapacity = Math.floor(groundPlatform.width / 2.5);
    const numGroundEnemies = Math.min(
      Math.floor(randomBetween(1, 2.99)), 
      platformCapacity
    );
    
    if (numGroundEnemies <= 0) continue;
    
    const groundLeft = groundPlatform.position.x - groundPlatform.width / 2;
    
    for (let i = 0; i < numGroundEnemies; i++) {
      const segmentWidth = groundPlatform.width / numGroundEnemies;
      const segmentStart = groundLeft + i * segmentWidth;
      const x = randomBetween(segmentStart + 0.6, segmentStart + segmentWidth - 0.6);
      
      enemies.push({
        width: 0.7,
        height: 0.7,
        position: {
          x,
          y: groundPlatform.position.y + groundPlatform.height / 2 + 0.35
        },
        color: getEnemyColor(false),
        moveType: Math.random() < 0.6 ? 'horizontal' : 'stationary',
        moveSpeed: randomBetween(1.5, 3),
        moveRange: randomBetween(2, 4),
        gravity: 20
      });
    }
  }
  
  return enemies;
}

export function generateCollectibles(
  platforms: PlatformDefinition[],
  params: LevelGenerationParams = DEFAULT_LEVEL_PARAMS
): CollectibleDefinition[] {
  const collectibles: CollectibleDefinition[] = [];
  
  for (const platform of platforms) {
    if (platform.width < 1.5) continue;
    
    if (Math.random() < params.collectibleDensity) {
      const maxCollectiblesForSize = Math.floor(platform.width / 1.5);
      const numCollectibles = Math.floor(
        randomBetween(params.minCollectiblesPerPlatform, 
                     Math.min(params.maxCollectiblesPerPlatform, maxCollectiblesForSize) + 0.99)
      );
      
      const platformLeft = platform.position.x - platform.width / 2;
      
      const actualNumCollectibles = Math.min(numCollectibles, Math.floor(platform.width / 1.2));
      
      for (let j = 0; j < actualNumCollectibles; j++) {
        let x;
        if (actualNumCollectibles > 1) {
          const segmentWidth = platform.width / actualNumCollectibles;
          const segmentStart = platformLeft + j * segmentWidth;
          x = segmentStart + segmentWidth / 2;
        } else {
          x = platform.position.x;
        }
        
        collectibles.push({
          radius: 0.3,
          position: {
            x: x + randomBetween(-0.1, 0.1),
            y: platform.position.y + platform.height / 2 + params.collectibleHeight
          },
          color: getCollectibleColor(Math.random() < 0.2)
        });
      }
    }
  }
  
  const groundY = params.groundY;
  const groundSegments = platforms.filter(p => 
    Math.abs(p.position.y - groundY) < 0.1
  ).sort((a, b) => a.position.x - b.position.x);
  
  if (groundSegments.length > 1) {
    for (let i = 0; i < groundSegments.length - 1; i++) {
      const currentSegment = groundSegments[i];
      const nextSegment = groundSegments[i + 1];
      
      const currentRight = currentSegment.position.x + currentSegment.width / 2;
      const nextLeft = nextSegment.position.x - nextSegment.width / 2;
      const gapWidth = nextLeft - currentRight;
      
      if (gapWidth > 1.5) {
        const numGapCollectibles = Math.min(Math.floor(gapWidth / 0.8), 5);
        
        for (let j = 0; j < numGapCollectibles; j++) {
          const ratio = j / (numGapCollectibles - 1 || 1);
          const x = currentRight + gapWidth * ratio;
          
          const archHeight = Math.sin(Math.PI * ratio) * 1.2;
          
          collectibles.push({
            radius: 0.3,
            position: {
              x,
              y: groundY + 1 + archHeight
            },
            color: getCollectibleColor(Math.random() < 0.15)
          });
        }
      }
    }
  }
  
  const floatingPlatforms = platforms.filter(p => p.position.y > groundY + 0.6);
  
  for (let i = 0; i < floatingPlatforms.length; i++) {
    for (let j = i + 1; j < floatingPlatforms.length; j++) {
      const platformA = floatingPlatforms[i];
      const platformB = floatingPlatforms[j];
      
      const horizontalDist = Math.abs(platformA.position.x - platformB.position.x);
      const verticalDist = Math.abs(platformA.position.y - platformB.position.y);
      
      if (horizontalDist > 3 && horizontalDist < params.playerJumpDistance * 1.2 && 
          verticalDist < params.playerJumpHeight * 0.8) {
        if (Math.random() < 0.3) {
          const startX = platformA.position.x;
          const startY = platformA.position.y + platformA.height / 2 + 0.3;
          const endX = platformB.position.x;
          const endY = platformB.position.y + platformB.height / 2 + 0.3;
          
          const numTrailCollectibles = Math.floor(randomBetween(2, 3.99));
          
          for (let k = 1; k <= numTrailCollectibles; k++) {
            const ratio = k / (numTrailCollectibles + 1);
            
            collectibles.push({
              radius: 0.3,
              position: {
                x: startX + (endX - startX) * ratio,
                y: startY + (endY - startY) * ratio + Math.sin(Math.PI * ratio) * 0.5
              },
              color: getCollectibleColor(Math.random() < 0.25)
            });
          }
        }
      }
    }
  }
  
  return collectibles;
}

export function setRandomSeed(seed?: number): number {
  const newSeed = seed || Math.floor(Math.random() * 1000000);
  randomGenerator = new SeededRandom(newSeed);
  return newSeed;
}

export function getCurrentSeed(): number {
  return randomGenerator.getSeed();
}

export function generateLevel(params: LevelGenerationParams = DEFAULT_LEVEL_PARAMS): {
  platforms: PlatformDefinition[],
  enemies: EnemyDefinition[],
  collectibles: CollectibleDefinition[],
  seed: number
} {
  if (params.seed) {
    setRandomSeed(params.seed);
  } else {
    setRandomSeed();
  }
  
  const currentSeed = getCurrentSeed();
  
  const platforms = generatePlatforms(params);
  const enemies = generateEnemies(platforms, params);
  const collectibles = generateCollectibles(platforms, params);
  
  return {
    platforms,
    enemies,
    collectibles,
    seed: currentSeed
  };
}