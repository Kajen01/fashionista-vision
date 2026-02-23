/**
 * Computes polygon regions for occlusion (e.g., arms in front of body)
 */
export const getOcclusionPolygons = (landmarks, canvasWidth, canvasHeight) => {
    if (!landmarks) return [];

    const polygons = [];

    // 1. Left Arm Region (Shoulder -> Elbow -> Wrist)
    const lShoulder = landmarks[11];
    const lElbow = landmarks[13];
    const lWrist = landmarks[15];

    if (lShoulder && lElbow && lWrist && lWrist.visibility > 0.5) {
        polygons.push(createStrokePolygon([lShoulder, lElbow, lWrist], 40, canvasWidth, canvasHeight));
    }

    // 2. Right Arm Region (Shoulder -> Elbow -> Wrist)
    const rShoulder = landmarks[12];
    const rElbow = landmarks[14];
    const rWrist = landmarks[16];

    if (rShoulder && rElbow && rWrist && rWrist.visibility > 0.5) {
        polygons.push(createStrokePolygon([rShoulder, rElbow, rWrist], 40, canvasWidth, canvasHeight));
    }

    return polygons;
};

/**
 * Creates a thick polygon path around a set of landmarks
 */
function createStrokePolygon(points, thickness, w, h) {
    const path = new Path2D();
    if (points.length < 2) return path;

    // We'll create a single path that traces the "hull" of the segments
    // For simplicity, we just create a closed shape by offsetting points
    const pts = points.map(p => ({ x: p.x * w, y: p.y * h }));

    // Simple implementation: Create a "thickened" path using a series of rectangles or offset lines
    // For a real-time JS app, we can just trace the points and back
    const offset = thickness / 2;

    path.moveTo(pts[0].x - offset, pts[0].y - offset);
    for (let i = 1; i < pts.length; i++) {
        path.lineTo(pts[i].x - offset, pts[i].y - offset);
    }
    for (let i = pts.length - 1; i >= 0; i--) {
        path.lineTo(pts[i].x + offset, pts[i].y + offset);
    }
    path.closePath();

    return path;
}
