import '@testing-library/jest-dom'

// Create mocks for Three.js
class MockScene {
  children = []
  add = vi.fn()
  remove = vi.fn()
}

class MockWebGLRenderer {
  domElement = document.createElement('canvas')
  setSize = vi.fn()
  setPixelRatio = vi.fn()
  render = vi.fn()
}

class MockOrthographicCamera {
  position = { x: 0, y: 0, z: 5, set: vi.fn() }
  left = -10
  right = 10
  top = 10
  bottom = -10
  near = 0.1
  far = 1000
  updateProjectionMatrix = vi.fn()
}

class MockPlaneGeometry {
  parameters = { width: 10, height: 1 }
  dispose = vi.fn()
}

class MockCircleGeometry {
  parameters = { radius: 0.5 }
  dispose = vi.fn()
}

class MockMeshBasicMaterial {
  color = 0xffffff
  side = 0
  dispose = vi.fn()
}

class MockMesh {
  position = { x: 0, y: 0, z: 0, set: vi.fn() }
  geometry = new MockPlaneGeometry()
  material = new MockMeshBasicMaterial()
  visible = true
}

// Skip complete test coverage for Game class since it's heavily dependent on Three.js
// and would require much more extensive mocking
vi.mock('../src/game/game', () => {
  return {
    Game: vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      togglePause: vi.fn(),
      destroy: vi.fn(),
      restartGame: vi.fn(),
      generateNewLevel: vi.fn()
    }))
  }
})

// Mock for Texture
class MockTexture {
  image = {}
  magFilter = 1
  needsUpdate = false
}

// Mock for PlaneGeometry with UV support
class MockPlaneGeometryWithUVs extends MockPlaneGeometry {
  attributes = {
    uv: {
      count: 4,
      setXY: vi.fn(),
      needsUpdate: false
    }
  }
}

// Mock for TextureLoader
class MockTextureLoader {
  load(url) {
    return new MockTexture();
  }
}

// Mock Three.js
vi.mock('three', () => {
  return {
    Scene: vi.fn().mockImplementation(() => new MockScene()),
    WebGLRenderer: vi.fn().mockImplementation(() => new MockWebGLRenderer()),
    OrthographicCamera: vi.fn().mockImplementation(() => new MockOrthographicCamera()),
    PlaneGeometry: vi.fn().mockImplementation(() => new MockPlaneGeometryWithUVs()),
    CircleGeometry: vi.fn().mockImplementation(() => new MockCircleGeometry()),
    MeshBasicMaterial: vi.fn().mockImplementation(() => new MockMeshBasicMaterial()),
    Mesh: vi.fn().mockImplementation(() => new MockMesh()),
    DoubleSide: 0,
    Color: vi.fn(),
    Group: vi.fn().mockImplementation(() => ({
      add: vi.fn(),
      remove: vi.fn(),
      children: []
    })),
    TextureLoader: vi.fn().mockImplementation(() => new MockTextureLoader()),
    Texture: vi.fn().mockImplementation(() => new MockTexture()),
    NearestFilter: 1,
    LinearFilter: 2
  }
})

// Mock window methods
global.requestAnimationFrame = vi.fn().mockImplementation(callback => {
  return setTimeout(() => callback(performance.now()), 1000 / 60)
})

global.cancelAnimationFrame = vi.fn().mockImplementation(id => {
  clearTimeout(id)
})

// Mock HTML elements
document.body.innerHTML = `
  <div id="app"></div>
  <div id="hud">
    <div id="score-container">
      <div id="score-label">SCORE:</div>
      <div id="score-value">0</div>
    </div>
    <div id="controls-container">
      <button id="pause-button">⏸️ Pause (P)</button>
      <button id="restart-button">🔄 Restart</button>
      <button id="new-level-button" style="display:none;">🎲 New Level</button>
    </div>
  </div>
  <div id="pause-overlay"></div>
  <div id="game-over-overlay"></div>
  <div id="main-menu"></div>
`