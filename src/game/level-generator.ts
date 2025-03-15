import { PlatformDefinition } from './platforms';
import { EnemyDefinition } from './enemies';
import { CollectibleDefinition } from './collectibles';

/**
 * Level generation parameters 
 */
export interface LevelGenerationParams {
  // Level seed for consistent regeneration
  seed?: number;
  
  // Level size
  levelWidth: number;
  levelMinX: number;
  levelMaxX: number;
  
  // Ground platform
  groundY: number;
  groundHeight: number;
  
  // Platform generation
  minPlatformWidth: number;
  maxPlatformWidth: number;
  minPlatformHeight: number;
  maxPlatformHeight: number;
  
  // Vertical spacing
  minY: number;
  maxY: number;
  minPlatformSpacingY: number;
  maxPlatformSpacingY: number;
  
  // Horizontal spacing
  minPlatformSpacingX: number;
  maxPlatformSpacingX: number;
  
  // Jump parameters (used to ensure platforms are reachable)
  playerJumpHeight: number;
  playerJumpDistance: number;
  
  // Enemy placement
  enemyDensity: number; // percentage of platforms with enemies (0-1)
  minEnemiesPerPlatform: number;
  maxEnemiesPerPlatform: number;
  
  // Collectible placement
  collectibleDensity: number; // percentage of platforms with collectibles (0-1)
  minCollectiblesPerPlatform: number;
  maxCollectiblesPerPlatform: number;
  collectibleHeight: number; // height above platform
}

/**
 * Default parameters for level generation
 */
export const DEFAULT_LEVEL_PARAMS: LevelGenerationParams = {
  // Level size - matches camera boundaries
  levelWidth: 80, // -40 to 40
  levelMinX: -40,
  levelMaxX: 40,
  
  // Ground platform
  groundY: -4.3,
  groundHeight: 0.5,
  
  // Platform generation
  minPlatformWidth: 2.5,
  maxPlatformWidth: 5,
  minPlatformHeight: 0.5,
  maxPlatformHeight: 0.5, // Keep consistent for now
  
  // Vertical spacing
  minY: -3.0, // First level of platforms must be lower to be reachable
  maxY: 2.5,  // Higher max height to allow more vertical exploration
  minPlatformSpacingY: 1.8, // Increased vertical gap between platforms
  maxPlatformSpacingY: 2.5, // Increased to make platforms more spread out
  
  // Horizontal spacing
  minPlatformSpacingX: 2.5, // Increased horizontal gap between platforms
  maxPlatformSpacingX: 4,   // Increased to provide more horizontal movement
  
  // Jump parameters
  playerJumpHeight: 3.5, // Maximum height player can jump
  playerJumpDistance: 4, // Maximum distance player can jump
  
  // Enemy placement
  enemyDensity: 0.4, // 40% of platforms will have enemies
  minEnemiesPerPlatform: 1,
  maxEnemiesPerPlatform: 2,
  
  // Collectible placement
  collectibleDensity: 0.7, // 70% of platforms will have collectibles
  minCollectiblesPerPlatform: 1,
  maxCollectiblesPerPlatform: 3,
  collectibleHeight: 0.7 // Height above platform
};

/**
 * Pseudo-random number generator with seed support for level consistency
 */
class SeededRandom {
  private seed: number;
  
  constructor(seed?: number) {
    this.seed = seed || Math.floor(Math.random() * 1000000);
  }
  
  /**
   * Get the current seed
   */
  public getSeed(): number {
    return this.seed;
  }
  
  /**
   * Set a new seed
   */
  public setSeed(seed: number): void {
    this.seed = seed;
  }
  
  /**
   * Generate a random number between 0 and 1 (similar to Math.random)
   * Uses a simple linear congruential generator algorithm
   */
  public random(): number {
    // Simple LCG parameters
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    
    // Update seed
    this.seed = (a * this.seed + c) % m;
    
    // Return normalized value (0 to 1)
    return this.seed / m;
  }
  
  /**
   * Generate a random number between min and max (inclusive)
   */
  public randomBetween(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }
  
  /**
   * Random integer between min and max (inclusive)
   */
  public randomInt(min: number, max: number): number {
    return Math.floor(this.randomBetween(min, max + 0.99999));
  }
}

// Global seeded random generator
let randomGenerator = new SeededRandom();

/**
 * Generate a random number between min and max (inclusive)
 */
function randomBetween(min: number, max: number): number {
  return randomGenerator.randomBetween(min, max);
}

/**
 * Check if a platform overlaps with an existing platform or is too close
 */
function platformOverlaps(
  platformX: number,
  platformY: number,
  platformWidth: number,
  platformHeight: number,
  existingPlatforms: PlatformDefinition[]
): boolean {
  // Check if the platform overlaps with any existing platform
  for (const platform of existingPlatforms) {
    // Skip comparison with ground platforms for floating platforms
    const isGroundPlatform = Math.abs(platform.position.y - DEFAULT_LEVEL_PARAMS.groundY) < 0.1;
    const isFloatingPlatform = Math.abs(platformY - DEFAULT_LEVEL_PARAMS.groundY) > 0.5;
    
    // Don't compare floating platforms with ground platforms for overlap
    if (isGroundPlatform && isFloatingPlatform) {
      continue;
    }
    
    // Calculate bounds of the new platform
    const newLeft = platformX - platformWidth / 2;
    const newRight = platformX + platformWidth / 2;
    const newTop = platformY + platformHeight / 2;
    const newBottom = platformY - platformHeight / 2;
    
    // Calculate bounds of the existing platform
    const existingLeft = platform.position.x - platform.width / 2;
    const existingRight = platform.position.x + platform.width / 2;
    const existingTop = platform.position.y + platform.height / 2;
    const existingBottom = platform.position.y - platform.height / 2;
    
    // Check if the platforms overlap on horizontal and vertical axes
    const horizontalOverlap = newRight > existingLeft && newLeft < existingRight;
    const verticalOverlap = newTop > existingBottom && newBottom < existingTop;
    
    // Add larger buffers to ensure platforms aren't too close
    const horizontalBuffer = 1.0; // One full unit buffer
    const verticalBuffer = 1.0;  // One full unit vertical buffer
    
    // Check if platforms are too close (even if not directly overlapping)
    const tooCloseHorizontally = 
      Math.abs(newRight - existingLeft) < horizontalBuffer || 
      Math.abs(newLeft - existingRight) < horizontalBuffer;
    
    const tooCloseVertically = 
      Math.abs(newTop - existingBottom) < verticalBuffer || 
      Math.abs(newBottom - existingTop) < verticalBuffer;
    
    // Full overlap check (direct overlap or too close)
    if (horizontalOverlap && verticalOverlap) {
      return true; // Direct overlap
    }
    
    // For floating platforms, enforce significant spacing
    if (isFloatingPlatform && !isGroundPlatform && platform.position.y > DEFAULT_LEVEL_PARAMS.groundY + 0.5) {
      // If it's a floating platform, enforce stricter spacing
      if ((horizontalOverlap && tooCloseVertically) || (verticalOverlap && tooCloseHorizontally)) {
        return true; // Too close
      }
    }
  }
  
  return false;
}

/**
 * Check if a platform location is valid (respects jump constraints and doesn't overlap)
 */
function isPlatformLocationValid(
  platformX: number,
  platformY: number,
  platformWidth: number,
  platformHeight: number,
  existingPlatforms: PlatformDefinition[],
  params: LevelGenerationParams,
  isFirstRow: boolean = false
): boolean {
  // Check for overlaps first (always enforce this)
  if (platformOverlaps(platformX, platformY, platformWidth, platformHeight, existingPlatforms)) {
    return false;
  }
  
  // For the first platform or platforms in the first row above ground, we need 
  // special handling to ensure they are reachable from the ground
  if (existingPlatforms.length === 0 || isFirstRow) {
    // The ground platform is always the first platform
    const groundPlatform = existingPlatforms[0];
    
    // For the first row (just above ground), ensure it's reachable from ground
    if (isFirstRow && groundPlatform) {
      // Calculate the height above ground
      const heightAboveGround = platformY - groundPlatform.position.y;
      
      // Ensure the height is not too much for the player to jump
      if (heightAboveGround > params.playerJumpHeight * 0.7) { // Use 70% of max jump height for safety
        return false;
      }
      
      // First row platforms should be distributed reasonably
      return true;
    }
    
    return true; // First platform is valid (this is usually the ground)
  }
  
  // For subsequent platforms, check if this platform is reachable from at least one existing platform
  // Skip the ground platform (index 0) when checking for jump reachability
  for (let i = 1; i < existingPlatforms.length; i++) {
    const platform = existingPlatforms[i];
    
    // Calculate horizontal distance between platform centers
    const horizontalDistance = Math.abs(platformX - platform.position.x);
    
    // Calculate vertical distance (positive if new platform is higher)
    const verticalDistance = platformY - platform.position.y;
    
    // Check if it's within jump range - allow jumping up to max height, and dropping any amount
    const withinHorizontalRange = horizontalDistance <= params.playerJumpDistance;
    const withinVerticalRange = verticalDistance <= params.playerJumpHeight && verticalDistance >= -params.playerJumpHeight * 2;
    
    // Check platform edge proximity (if platforms are close enough horizontally)
    const platformHalfWidth = platformWidth / 2;
    const existingHalfWidth = platform.width / 2;
    const edgesClose = horizontalDistance < (platformHalfWidth + existingHalfWidth + params.playerJumpDistance * 0.5);
    
    // Platform is valid if it's within jump range from at least one existing platform
    // or if there's a direct path (edges close and it's reasonably nearby vertically)
    if ((withinHorizontalRange && withinVerticalRange) || (edgesClose && Math.abs(verticalDistance) < params.playerJumpHeight)) {
      return true;
    }
  }
  
  // If we're here, no existing platform can reach this one
  return false;
}

/**
 * Generate procedural platforms
 */
export function generatePlatforms(params: LevelGenerationParams = DEFAULT_LEVEL_PARAMS): PlatformDefinition[] {
  const platforms: PlatformDefinition[] = [];
  
  // Instead of one large ground platform, create segmented ground with gaps
  const groundY = params.groundY;
  const groundHeight = params.groundHeight;
  
  // Define level boundaries
  const groundLeft = params.levelMinX;
  const groundRight = params.levelMaxX;
  
  // Always create solid ground near the player start position (around origin)
  platforms.push({
    width: 12, // Wide enough for starting area
    height: groundHeight,
    position: {
      x: 0, // Center at origin
      y: groundY
    },
    color: 0x8B4513 // Brown
  });
  
  // Create segmented ground platforms to the left
  let currentX = -8; // Start at the edge of the initial platform
  
  while (currentX > groundLeft + 2) {
    // Determine if we should create a gap - lower probability for left side
    const createGap = Math.random() < 0.3; // 30% chance of gap
    
    if (createGap) {
      // Skip ahead to create a gap - stricter limits on gap size (2-3 units)
      const gapWidth = randomBetween(2, 3); // Smaller gaps that are guaranteed jumpable
      currentX -= gapWidth;
    } else {
      // Create a ground segment
      const segmentWidth = randomBetween(3, 8);
      
      // Ensure we don't exceed the level boundary
      const actualWidth = Math.min(segmentWidth, Math.abs(currentX - groundLeft) - 2);
      
      if (actualWidth > 1) { // Only create if it's large enough
        platforms.push({
          width: actualWidth,
          height: groundHeight,
          position: {
            x: currentX - actualWidth / 2,
            y: groundY
          },
          color: 0x8B4513 // Brown
        });
      }
      
      // Move to next position
      currentX -= (actualWidth + 1);
    }
  }
  
  // Create segmented ground platforms to the right
  currentX = 8; // Start at the edge of the initial platform
  
  while (currentX < groundRight - 2) {
    // Determine if we should create a gap - lower probability for right side
    const createGap = Math.random() < 0.3; // 30% chance of gap
    
    if (createGap) {
      // Skip ahead to create a gap - stricter limits on gap size (2-3 units)
      const gapWidth = randomBetween(2, 3); // Smaller gaps that are guaranteed jumpable
      currentX += gapWidth;
    } else {
      // Create a ground segment
      const segmentWidth = randomBetween(3, 8);
      
      // Ensure we don't exceed the level boundary
      const actualWidth = Math.min(segmentWidth, Math.abs(groundRight - currentX) - 2);
      
      if (actualWidth > 1) { // Only create if it's large enough
        platforms.push({
          width: actualWidth,
          height: groundHeight,
          position: {
            x: currentX + actualWidth / 2,
            y: groundY
          },
          color: 0x8B4513 // Brown
        });
      }
      
      // Move to next position
      currentX += (actualWidth + 1);
    }
  }
  
  // Now create floating platforms
  
  // First, create a specific row of platforms just above the ground to ensure reachability
  const firstRowY = groundY + groundHeight / 2 + randomBetween(1.5, 2.0);
  
  // Create several platforms in the first row that are guaranteed to be reachable
  let x = params.levelMinX + randomBetween(4, 8); // Start with more margin for first row
  
  // Make sure we have at least 5-8 reachable first-row platforms
  const firstRowPlatformCount = Math.floor(randomBetween(5, 8));
  let placedFirstRowPlatforms = 0;
  
  while (x < params.levelMaxX - 4 && placedFirstRowPlatforms < firstRowPlatformCount) {
    // Generate random platform width
    const width = randomBetween(params.minPlatformWidth, params.maxPlatformWidth);
    
    // Generate platform
    const platform: PlatformDefinition = {
      width,
      height: params.minPlatformHeight,
      position: {
        x,
        y: firstRowY
      },
      color: 0x8B4513 // Brown
    };
    
    // Check if platform location is valid
    if (isPlatformLocationValid(x, firstRowY, width, params.minPlatformHeight, platforms, params, true)) {
      platforms.push(platform);
      placedFirstRowPlatforms++;
    }
    
    // Move to next potential platform position with larger spacing for first row
    x += width + randomBetween(params.minPlatformSpacingX + 1, params.maxPlatformSpacingX + 2);
  }
  
  // Now create additional rows of platforms with more structure
  let currentHeight = firstRowY;
  
  // Number of platform rows to generate (based on height range and spacing)
  const heightRange = params.maxY - firstRowY;
  const avgRowSpacing = (params.minPlatformSpacingY + params.maxPlatformSpacingY) / 2;
  const numRows = Math.floor(heightRange / avgRowSpacing) + 1;
  
  // Create structured rows of platforms with consistent spacing
  for (let row = 0; row < numRows; row++) {
    // Determine Y coordinate for this row with consistent spacing
    currentHeight += randomBetween(params.minPlatformSpacingY, params.maxPlatformSpacingY);
    
    if (currentHeight > params.maxY) break;
    
    // Add special "bridge" platforms between gaps on the ground level
    if (row === 0) { // Only for the first elevated row
      // Find all ground segments
      const groundSegments = platforms.filter(p => 
        Math.abs(p.position.y - groundY) < 0.1
      ).sort((a, b) => a.position.x - b.position.x);
      
      // If we have multiple ground segments, check for gaps and add bridge platforms
      if (groundSegments.length > 1) {
        for (let i = 0; i < groundSegments.length - 1; i++) {
          const currentSegment = groundSegments[i];
          const nextSegment = groundSegments[i + 1];
          
          // Calculate the gap between segments
          const currentRight = currentSegment.position.x + currentSegment.width / 2;
          const nextLeft = nextSegment.position.x - nextSegment.width / 2;
          const gapWidth = nextLeft - currentRight;
          
          // If there's a significant gap, add a bridge platform above it
          if (gapWidth > 2 && gapWidth < 8) {
            const bridgeX = currentRight + gapWidth / 2; // Center the bridge in the gap
            const bridgeWidth = Math.min(3, gapWidth * 0.7); // Bridge covers 70% of gap or up to 3 units
            
            // Create a bridge platform
            const bridgePlatform: PlatformDefinition = {
              width: bridgeWidth,
              height: params.minPlatformHeight,
              position: {
                x: bridgeX,
                y: firstRowY + randomBetween(-0.5, 0.5) // Vary height slightly
              },
              color: 0x8B4513 // Brown
            };
            
            // Check if it's valid and doesn't overlap
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
    
    // For each row, use one of two placement strategies:
    // 1. Even spacing for the entire row (horizontal "ladder" type)
    // 2. Zig-zag pattern with alternating positions (more challenging jumps)
    const useZigZagPattern = row > 0 && Math.random() < 0.5;
    
    if (useZigZagPattern) {
      // ZIG-ZAG PATTERN: Platforms alternate between left and right positions
      // This creates more interesting jumping challenges
      const segmentWidth = (params.levelMaxX - params.levelMinX) / 5;
      const platformSpacing = params.levelMaxX / 2.5;
      
      // Create platforms in zigzag pattern
      for (let i = 0; i < 5; i++) {
        // Alternate between left and right side of the level
        const isLeft = i % 2 === 0;
        const offsetX = isLeft ? 
          -randomBetween(platformSpacing * 0.5, platformSpacing) : 
          randomBetween(platformSpacing * 0.5, platformSpacing);
        
        // Center point of this segment
        const segmentCenter = params.levelMinX + (i + 0.5) * segmentWidth;
        const x = segmentCenter + offsetX;
        
        // Skip if too close to level boundary
        if (x < params.levelMinX + 4 || x > params.levelMaxX - 4) continue;
        
        // Generate platform width - slightly larger for zigzag to make them easier targets
        const width = randomBetween(params.minPlatformWidth, params.maxPlatformWidth * 0.8);
        
        // Generate platform
        const platform: PlatformDefinition = {
          width,
          height: params.minPlatformHeight,
          position: {
            x,
            y: currentHeight + (isLeft ? randomBetween(-0.5, 0.5) : randomBetween(-0.5, 0.5))
          },
          color: 0x8B4513 // Brown
        };
        
        // Check if platform location is valid
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
      // STANDARD PATTERN: Evenly distributed platforms with random widths
      // Start from left boundary and place platforms with spacing
      let x = params.levelMinX + randomBetween(4, 8); // Start with margin
      
      // Determine a target number of platforms for this row (fewer for higher rows)
      const platformsPerRow = Math.floor(randomBetween(3, 5));
      let placedPlatformsInRow = 0;
      
      // Make multiple attempts to place platforms in this row
      let attempts = 0;
      const maxAttempts = 20; // More attempts for better results
      
      while (x < params.levelMaxX - 4 && placedPlatformsInRow < platformsPerRow && attempts < maxAttempts) {
        // Generate random platform width with more variation
        const width = randomBetween(params.minPlatformWidth, params.maxPlatformWidth);
        
        // Generate platform with slight height variation to create more interesting layouts
        const platform: PlatformDefinition = {
          width,
          height: params.minPlatformHeight,
          position: {
            x,
            y: currentHeight + randomBetween(-0.3, 0.3) // Small vertical variation within the row
          },
          color: 0x8B4513 // Brown
        };
        
        // Check if platform location is valid (no overlaps and reachable)
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
          
          // Move to next position with successful placement - larger spaces for more movement
          x += width + randomBetween(params.minPlatformSpacingX, params.maxPlatformSpacingX);
        } else {
          // If invalid, try a larger movement to find a valid spot
          x += randomBetween(2, 3);
        }
        
        attempts++;
      }
    }
  }
  
  // Add a few "isolated challenge platforms" in strategic locations to create interesting paths
  // These are especially useful for vertical travel between rows
  const existingRows: number[] = [];
  const existingPlatforms = platforms.filter(p => p.position.y > groundY + 1);
  
  // Group platforms by approximate row height
  existingPlatforms.forEach(platform => {
    const rowY = Math.round(platform.position.y * 2) / 2; // Round to nearest 0.5
    if (!existingRows.includes(rowY)) {
      existingRows.push(rowY);
    }
  });
  
  // Sort rows by height
  existingRows.sort((a, b) => a - b);
  
  // Add connector platforms between rows where needed
  if (existingRows.length > 1) {
    for (let i = 0; i < existingRows.length - 1; i++) {
      const lowerRowY = existingRows[i];
      const upperRowY = existingRows[i + 1];
      
      // Skip if rows are too close
      if (upperRowY - lowerRowY < 1.5) continue;
      
      // Find platforms in each row
      const lowerPlatforms = existingPlatforms.filter(
        p => Math.abs(p.position.y - lowerRowY) < 0.5
      );
      const upperPlatforms = existingPlatforms.filter(
        p => Math.abs(p.position.y - upperRowY) < 0.5
      );
      
      // Try to add 2-3 connector platforms between these rows
      for (let j = 0; j < 3; j++) {
        // Choose a random lower and upper platform to connect
        const lowerPlatform = lowerPlatforms[Math.floor(Math.random() * lowerPlatforms.length)];
        const upperPlatform = upperPlatforms[Math.floor(Math.random() * upperPlatforms.length)];
        
        if (!lowerPlatform || !upperPlatform) continue;
        
        // Calculate a position between them
        const connectX = (lowerPlatform.position.x + upperPlatform.position.x) / 2 + randomBetween(-2, 2);
        const connectY = (lowerPlatform.position.y + upperPlatform.position.y) / 2;
        
        // Create a small connector platform
        const connector: PlatformDefinition = {
          width: randomBetween(1.5, 2.5),
          height: params.minPlatformHeight,
          position: {
            x: connectX,
            y: connectY
          },
          color: 0x8B4513 // Brown
        };
        
        // Check if it's valid and doesn't overlap
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

/**
 * Generate enemies based on platform layout
 */
export function generateEnemies(
  platforms: PlatformDefinition[],
  params: LevelGenerationParams = DEFAULT_LEVEL_PARAMS
): EnemyDefinition[] {
  const enemies: EnemyDefinition[] = [];
  
  // Start from index 1 to skip the ground platform
  for (let i = 1; i < platforms.length; i++) {
    const platform = platforms[i];
    
    // Determine if this platform should have enemies
    if (Math.random() < params.enemyDensity) {
      // Skip very small platforms
      if (platform.width < 2) {
        continue;
      }
      
      // Calculate platform boundaries
      const platformLeft = platform.position.x - platform.width / 2;
      
      // Determine how many enemies based on platform width
      // For platforms under 3 units, only allow 1 enemy max
      let maxEnemies = platform.width < 3 ? 1 : params.maxEnemiesPerPlatform;
      
      // Calculate safe number of enemies
      const numEnemies = Math.floor(
        randomBetween(params.minEnemiesPerPlatform, maxEnemies + 0.99)
      );
      
      // Calculate safe maximum number of enemies based on platform width
      // Each enemy needs at least 2 units of space to move safely
      const platformCapacity = Math.floor(platform.width / 2);
      const actualNumEnemies = Math.min(numEnemies, platformCapacity);
      
      // Skip if we can't fit any enemies
      if (actualNumEnemies <= 0) continue;
      
      for (let j = 0; j < actualNumEnemies; j++) {
        // For multiple enemies, divide the platform into sections
        let x;
        let moveType;
        let moveRange;
        
        if (actualNumEnemies > 1) {
          // Divide platform into equal segments
          const segmentWidth = platform.width / actualNumEnemies;
          const segmentStart = platformLeft + j * segmentWidth;
          const segmentCenter = segmentStart + segmentWidth / 2;
          
          // Place enemy in center of its segment
          x = segmentCenter;
          
          // Limit movement to segment size minus buffer
          moveRange = Math.max(0.5, segmentWidth - 1); 
          
          // Only allow movement if segment is wide enough
          moveType = segmentWidth >= 2 ? 'horizontal' : 'stationary';
        } else {
          // Single enemy - can use more platform space
          x = platform.position.x;
          
          // Determine movement range based on platform width
          // Leave 0.5 units buffer on each side
          moveRange = Math.max(0.5, platform.width - 1);
          
          // Only allow movement on wider platforms
          moveType = platform.width >= 2.5 ? 'horizontal' : 'stationary';
        }
        
        // Create enemy with conservative movement parameters
        enemies.push({
          width: 0.7,
          height: 0.7,
          position: {
            x,
            y: platform.position.y + platform.height / 2 + 0.35 // Position on top of platform
          },
          color: Math.random() < 0.3 ? 0xFF4500 : 0xFF0000, // Some variation in color
          moveType: moveType as 'stationary' | 'horizontal',
          moveSpeed: moveType === 'horizontal' ? randomBetween(1, 2) : 0,
          moveRange,
          gravity: 20
        });
      }
    }
  }
  
  // Add enemies to the ground segments
  // Find all ground platforms (those at groundY position)
  const groundPlatforms = platforms.filter(p => 
    Math.abs(p.position.y - params.groundY) < 0.1 && p.width >= 2.5
  );
  
  // For each ground segment that's wide enough, add 1-2 enemies
  for (const groundPlatform of groundPlatforms) {
    // Skip the central platform where player starts
    if (Math.abs(groundPlatform.position.x) < 3) {
      continue; // Skip center platform to give player safe starting area
    }
    
    // Determine how many enemies based on platform width
    const platformCapacity = Math.floor(groundPlatform.width / 2.5);
    const numGroundEnemies = Math.min(
      Math.floor(randomBetween(1, 2.99)), 
      platformCapacity
    );
    
    if (numGroundEnemies <= 0) continue;
    
    const groundLeft = groundPlatform.position.x - groundPlatform.width / 2;
    
    for (let i = 0; i < numGroundEnemies; i++) {
      // Distribute enemies evenly across the ground segment
      const segmentWidth = groundPlatform.width / numGroundEnemies;
      const segmentStart = groundLeft + i * segmentWidth;
      const x = randomBetween(segmentStart + 0.6, segmentStart + segmentWidth - 0.6);
      
      enemies.push({
        width: 0.7,
        height: 0.7,
        position: {
          x,
          y: groundPlatform.position.y + groundPlatform.height / 2 + 0.35 // Position on top of platform
        },
        color: 0xFF0000,
        moveType: Math.random() < 0.6 ? 'horizontal' : 'stationary', // 60% moving
        moveSpeed: randomBetween(1.5, 3),
        moveRange: randomBetween(2, 4), // More conservative range
        gravity: 20
      });
    }
  }
  
  return enemies;
}

/**
 * Generate collectibles based on platform layout
 */
export function generateCollectibles(
  platforms: PlatformDefinition[],
  params: LevelGenerationParams = DEFAULT_LEVEL_PARAMS
): CollectibleDefinition[] {
  const collectibles: CollectibleDefinition[] = [];
  
  // Process all platforms including ground
  for (const platform of platforms) {
    // Skip very small platforms for collectibles to prevent overcrowding
    if (platform.width < 1.5) continue;
    
    // Determine if this platform should have collectibles
    if (Math.random() < params.collectibleDensity) {
      // How many collectibles based on platform width
      const maxCollectiblesForSize = Math.floor(platform.width / 1.5);
      const numCollectibles = Math.floor(
        randomBetween(params.minCollectiblesPerPlatform, 
                     Math.min(params.maxCollectiblesPerPlatform, maxCollectiblesForSize) + 0.99)
      );
      
      // Calculate platform left edge for spacing
      const platformLeft = platform.position.x - platform.width / 2;
      
      // Ensure we don't overcrowd narrow platforms
      const actualNumCollectibles = Math.min(numCollectibles, Math.floor(platform.width / 1.2));
      
      for (let j = 0; j < actualNumCollectibles; j++) {
        // For multiple collectibles, ensure they're evenly spaced
        let x;
        if (actualNumCollectibles > 1) {
          const segmentWidth = platform.width / actualNumCollectibles;
          const segmentStart = platformLeft + j * segmentWidth;
          x = segmentStart + segmentWidth / 2; // Put in center of segment
        } else {
          // Single collectible - place in center
          x = platform.position.x;
        }
        
        // Create collectible with small random offset for natural appearance
        collectibles.push({
          radius: 0.3,
          position: {
            x: x + randomBetween(-0.1, 0.1), // Small horizontal variation
            y: platform.position.y + platform.height / 2 + params.collectibleHeight // Position above platform
          },
          color: 0xFFD700 // Gold
        });
      }
    }
  }
  
  // Add collectibles above the gaps to reward risky jumps
  const groundY = params.groundY;
  const groundSegments = platforms.filter(p => 
    Math.abs(p.position.y - groundY) < 0.1
  ).sort((a, b) => a.position.x - b.position.x);
  
  // If we have multiple ground segments, check for gaps and add collectibles over them
  if (groundSegments.length > 1) {
    for (let i = 0; i < groundSegments.length - 1; i++) {
      const currentSegment = groundSegments[i];
      const nextSegment = groundSegments[i + 1];
      
      // Calculate the gap between segments
      const currentRight = currentSegment.position.x + currentSegment.width / 2;
      const nextLeft = nextSegment.position.x - nextSegment.width / 2;
      const gapWidth = nextLeft - currentRight;
      
      // If there's a significant gap, add collectibles over it (arch pattern)
      if (gapWidth > 1.5) {
        // Determine how many collectibles to place
        const numGapCollectibles = Math.min(Math.floor(gapWidth / 0.8), 5);
        
        // Place collectibles in an arch pattern over the gap
        for (let j = 0; j < numGapCollectibles; j++) {
          const ratio = j / (numGapCollectibles - 1 || 1); // 0 to 1
          const x = currentRight + gapWidth * ratio;
          
          // Create arch pattern using sin function
          // sin(PI * ratio) gives a value of 0 at edges and 1 at center
          const archHeight = Math.sin(Math.PI * ratio) * 1.2;
          
          collectibles.push({
            radius: 0.3,
            position: {
              x,
              y: groundY + 1 + archHeight // Arched placement
            },
            color: 0xFFD700 // Gold
          });
        }
      }
    }
  }
  
  // Add "trail" collectibles between platforms that are far apart
  // This guides the player along challenging jumps
  const floatingPlatforms = platforms.filter(p => p.position.y > groundY + 0.6);
  
  // For each pair of platforms that are within jumping distance but far apart
  for (let i = 0; i < floatingPlatforms.length; i++) {
    for (let j = i + 1; j < floatingPlatforms.length; j++) {
      const platformA = floatingPlatforms[i];
      const platformB = floatingPlatforms[j];
      
      // Calculate horizontal and vertical distances
      const horizontalDist = Math.abs(platformA.position.x - platformB.position.x);
      const verticalDist = Math.abs(platformA.position.y - platformB.position.y);
      
      // Only add "trail" collectibles for challenging but feasible jumps
      if (horizontalDist > 3 && horizontalDist < params.playerJumpDistance * 1.2 && 
          verticalDist < params.playerJumpHeight * 0.8) {
        // Only 30% chance to add trail (to avoid overcrowding)
        if (Math.random() < 0.3) {
          // Calculate start and end points
          const startX = platformA.position.x;
          const startY = platformA.position.y + platformA.height / 2 + 0.3;
          const endX = platformB.position.x;
          const endY = platformB.position.y + platformB.height / 2 + 0.3;
          
          // Place 2-3 collectibles along the path
          const numTrailCollectibles = Math.floor(randomBetween(2, 3.99));
          
          for (let k = 1; k <= numTrailCollectibles; k++) {
            const ratio = k / (numTrailCollectibles + 1);
            
            collectibles.push({
              radius: 0.3,
              position: {
                x: startX + (endX - startX) * ratio,
                y: startY + (endY - startY) * ratio + Math.sin(Math.PI * ratio) * 0.5 // Slight arch
              },
              color: 0xFFD700 // Gold
            });
          }
        }
      }
    }
  }
  
  return collectibles;
}

/**
 * Set a new random seed for level generation
 * @param seed Optional seed number, if not provided a random seed will be generated
 * @returns The seed that was set
 */
export function setRandomSeed(seed?: number): number {
  const newSeed = seed || Math.floor(Math.random() * 1000000);
  randomGenerator = new SeededRandom(newSeed);
  return newSeed;
}

/**
 * Get the current random seed
 */
export function getCurrentSeed(): number {
  return randomGenerator.getSeed();
}

/**
 * Generate a complete level with platforms, enemies, and collectibles
 */
export function generateLevel(params: LevelGenerationParams = DEFAULT_LEVEL_PARAMS): {
  platforms: PlatformDefinition[],
  enemies: EnemyDefinition[],
  collectibles: CollectibleDefinition[],
  seed: number
} {
  // Handle seed for consistent level generation
  if (params.seed) {
    // If a seed is provided, use it
    setRandomSeed(params.seed);
  } else {
    // Otherwise generate a new seed
    setRandomSeed();
  }
  
  // Store the seed we're using
  const currentSeed = getCurrentSeed();
  
  // Generate level components with consistent randomness
  const platforms = generatePlatforms(params);
  const enemies = generateEnemies(platforms, params);
  const collectibles = generateCollectibles(platforms, params);
  
  // Return everything including the seed
  return {
    platforms,
    enemies,
    collectibles,
    seed: currentSeed
  };
}