/**
 * Modular Renderer for Virtual Try-On
 */
export class TryOnRenderer2D {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGarment(img, transform) {
        if (!img || !transform) return;
        const { x, y, width, rotation, yawSkew } = transform;
        const height = width * (img.height / img.width);

        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        // Apply 3D perspective skew
        ctx.transform(1, yawSkew, 0, 1, 0, 0);

        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 20;

        ctx.drawImage(
            img,
            -width / 2,
            -height * 0.1, // Anchor slightly above center to cover neck
            width,
            height
        );
        ctx.restore();
    }

    drawSkeleton(landmarks) {
        if (!landmarks) return;
        const ctx = this.ctx;
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#00FFFF';

        const connect = (i, j) => {
            const p1 = landmarks[i];
            const p2 = landmarks[j];
            if (p1 && p2 && p1.visibility > 0.4 && p2.visibility > 0.4) {
                ctx.beginPath();
                ctx.moveTo(p1.x * this.canvas.width, p1.y * this.canvas.height);
                ctx.lineTo(p2.x * this.canvas.width, p2.y * this.canvas.height);
                ctx.stroke();
            }
        };

        // Torso connections
        connect(11, 12); connect(23, 24); connect(11, 23); connect(12, 24);
        // Arms
        connect(11, 13); connect(13, 15); connect(12, 14); connect(14, 16);
    }
}
