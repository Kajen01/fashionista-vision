import { Pose } from '@mediapipe/pose';

/**
 * Singleton Pose Engine to prevent redundant WASM initializations
 * Attached to window to survive React Fast Refresh (HMR).
 */
class PoseEngine {
    constructor() {
        if (window.__PoseEngineInstance) return window.__PoseEngineInstance;

        this.pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`;
            }
        });

        this.pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: true, // Output human mask alongside landmarks
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.onResultsCallback = null;
        this.pose.onResults((results) => {
            if (this.onResultsCallback) this.onResultsCallback(results);
        });

        // Trigger initialization immediately and cache the promise to prevent duplicate concurrent loads
        this.initializationPromise = this.pose.initialize();

        window.__PoseEngineInstance = this;
    }

    async send(image) {
        try {
            await this.initializationPromise; // Wait for the single initialization to finish
            await this.pose.send({ image });
        } catch (e) {
            console.error("PoseEngine Inference Error:", e);
        }
    }

    onResults(fn) {
        this.onResultsCallback = fn;
    }

    close() {
        // We typically keep the singleton alive, but provide cleanup
        if (this.pose) this.pose.close();
        window.__PoseEngineInstance = null;
    }
}

export const getPoseEngine = () => new PoseEngine();
