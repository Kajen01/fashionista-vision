/**
 * GarmentMaskBuilder: Extracts alpha masks from garment assets.
 */
export class GarmentMaskBuilder {
    constructor() {
        this.maskCache = new Map();
    }

    /**
     * Builds or retrieves a mask for a garment image.
     */
    async getMask(garmentId, imgElement) {
        if (this.maskCache.has(garmentId)) {
            return this.maskCache.get(garmentId);
        }

        const mask = this.createMaskFromImage(imgElement);
        this.maskCache.set(garmentId, mask);
        return mask;
    }

    createMaskFromImage(img) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Create a separate alpha mask canvas
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
        const maskCtx = maskCanvas.getContext('2d');
        const maskImageData = maskCtx.createImageData(canvas.width, canvas.height);
        const maskData = maskImageData.data;

        const isPNG = (img.src.toLowerCase().endsWith('.png'));

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            let alpha = a;

            // If it's a JPG or opaque PNG with white background, threshold it
            if (!isPNG || a > 250) {
                // Check if pixel is "white-ish" (threshold: 240)
                if (r > 240 && g > 240 && b > 240) {
                    alpha = 0;
                } else {
                    alpha = 255;
                }
            }

            maskData[i] = 255;   // R
            maskData[i + 1] = 255; // G
            maskData[i + 2] = 255; // B
            maskData[i + 3] = alpha; // A
        }

        maskCtx.putImageData(maskImageData, 0, 0);
        return maskCanvas;
    }

    clearCache() {
        this.maskCache.clear();
    }
}
