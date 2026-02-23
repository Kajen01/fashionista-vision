/**
 * Compositor: Handles multi-layer rendering and occlusion.
 */
export class Compositor {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Offscreen canvas for garment rendering
        this.offscreen = document.createElement('canvas');
        this.offscreen.width = canvas.width;
        this.offscreen.height = canvas.height;
        this.oCtx = this.offscreen.getContext('2d');
    }

    /**
     * Composites the frame
     * @param {HTMLVideoElement} video - The source camera frame
     * @param {CanvasImageSource} humanMask - The segmentation mask from MediaPipe
     * @param {Function} drawGarmentFn - Callback to draw the garment on a context
     * @param {Array<Path2D>} occlusionPolygons - Regions that should stay on top
     */
    composite(video, humanMask, drawGarmentFn, occlusionPolygons = []) {
        const { width, height } = this.canvas;
        const ctx = this.ctx;

        // 1. Draw Background (Video)
        ctx.drawImage(video, 0, 0, width, height);

        // 2. Prepare Garment Layer
        this.oCtx.clearRect(0, 0, width, height);
        drawGarmentFn(this.oCtx);

        // 3. Mask the garment to human body silhouette (if mask available)
        if (humanMask) {
            this.oCtx.save();
            this.oCtx.globalCompositeOperation = 'destination-in';
            this.oCtx.drawImage(humanMask, 0, 0, width, height);
            this.oCtx.restore();
        }

        // 4. Draw Garment over Video
        ctx.drawImage(this.offscreen, 0, 0);

        // 5. Draw Occlusion passthrough (Arms in front)
        if (occlusionPolygons.length > 0) {
            ctx.save();
            ctx.beginPath();
            occlusionPolygons.forEach(p => {
                ctx.addPath(p);
            });
            ctx.clip();
            ctx.drawImage(video, 0, 0, width, height);
            ctx.restore();
        }
    }
}
