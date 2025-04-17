/**
 * Core GameEngine: handles the game loop, update/render cycle, and timing.
 * Other systems (physics, input, rendering) register with the engine.
 */
export class GameEngine {
    private lastTime = 0;
    private running = false;
    private updateCallbacks: ((dt: number) => void)[] = [];
    private renderCallbacks: (() => void)[] = [];

    /**
     * Register an update callback, called each frame with delta time in seconds.
     */
    onUpdate(callback: (dt: number) => void) {
        this.updateCallbacks.push(callback);
    }

    /**
     * Register a render callback, called each frame after updates.
     */
    onRender(callback: () => void) {
        this.renderCallbacks.push(callback);
    }

    /**
     * Start the game loop.
     */
    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop.bind(this));
    }

    /**
     * Stop the game loop.
     */
    stop() {
        this.running = false;
    }

    private loop(currentTime: number) {
        if (!this.running) return;
        const delta = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Update systems
        for (const cb of this.updateCallbacks) {
            cb(delta);
        }

        // Render systems
        for (const cb of this.renderCallbacks) {
            cb();
        }

        requestAnimationFrame(this.loop.bind(this));
    }
}