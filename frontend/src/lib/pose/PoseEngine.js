import { Pose } from '@mediapipe/pose';

/**
 * Singleton Pose Engine to prevent redundant WASM initializations
 */
let instance = null;

class PoseEngine {
    constructor() {
        if (instance) return instance;

        this.pose = new Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`
        });

        this.pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.onResultsCallback = null;
        this.pose.onResults((results) => {
            if (this.onResultsCallback) this.onResultsCallback(results);
        });

        instance = this;
    }

    async send(image) {
        try {
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
        instance = null;
    }
}

export const getPoseEngine = () => new PoseEngine();
