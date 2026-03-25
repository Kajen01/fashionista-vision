export const HALF_BODY_CONNECTIONS = [
  [11, 12],
  [11, 23],
  [12, 24],
  [23, 24],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
];

export const FULL_BODY_CONNECTIONS = [
  ...HALF_BODY_CONNECTIONS,
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
];

const MIN_VISIBILITY = 0.4;
const DEFAULT_GARMENT_SEGMENTS = [
  ['leftShoulder', 'rightShoulder'],
  ['leftShoulder', 'leftWaist'],
  ['rightShoulder', 'rightWaist'],
  ['leftWaist', 'hemLeft'],
  ['rightWaist', 'hemRight'],
  ['hemLeft', 'hemCenter'],
  ['hemCenter', 'hemRight'],
];

function isVisible(landmark) {
  return landmark && (landmark.visibility ?? 1) >= MIN_VISIBILITY;
}

function getConnections(bodyMode) {
  return bodyMode === 'half' ? HALF_BODY_CONNECTIONS : FULL_BODY_CONNECTIONS;
}

function projectGarmentPoint(point, transform, garmentImage) {
  const width = transform.width;
  const height = width * (garmentImage.height / garmentImage.width);
  const anchorX = transform.anchor?.x ?? 0.5;
  const anchorY = transform.anchor?.y ?? 0.1;
  const localX = (point.x * width) - (anchorX * width);
  const localY = (point.y * height) - (anchorY * height);
  const cos = Math.cos(transform.rotation);
  const sin = Math.sin(transform.rotation);

  return {
    x: transform.x + (localX * cos) - (localY * sin),
    y: transform.y + (localX * sin) + (localY * cos),
  };
}

export function drawMirrorSkeleton({
  ctx,
  landmarks,
  canvasWidth,
  canvasHeight,
  bodyMode = 'full',
}) {
  if (!ctx || !landmarks) {
    return;
  }

  const connections = getConnections(bodyMode);
  const pointIndexes = [...new Set(connections.flat())];

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, canvasWidth * 0.004);
  ctx.strokeStyle = 'rgba(232, 180, 160, 0.95)';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.shadowColor = 'rgba(232, 180, 160, 0.35)';
  ctx.shadowBlur = 10;

  connections.forEach(([startIndex, endIndex]) => {
    const start = landmarks[startIndex];
    const end = landmarks[endIndex];

    if (!isVisible(start) || !isVisible(end)) {
      return;
    }

    ctx.beginPath();
    ctx.moveTo(start.x * canvasWidth, start.y * canvasHeight);
    ctx.lineTo(end.x * canvasWidth, end.y * canvasHeight);
    ctx.stroke();
  });

  ctx.shadowBlur = 0;

  pointIndexes.forEach((index) => {
    const point = landmarks[index];

    if (!isVisible(point)) {
      return;
    }

    const x = point.x * canvasWidth;
    const y = point.y * canvasHeight;
    const radius = Math.max(3, canvasWidth * 0.006);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(232, 180, 160, 1)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  ctx.restore();
}

export function drawGarmentSkeleton({
  ctx,
  garment,
  transform,
  garmentImage,
}) {
  const analysis = garmentImage?.garmentAnalysis || garment?.analysis;
  const keypoints = analysis?.keypoints;
  const segments = analysis?.skeletonSegments || DEFAULT_GARMENT_SEGMENTS;

  if (!ctx || !transform || !garmentImage || !keypoints) {
    return;
  }

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, transform.width * 0.01);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.95)';
  ctx.fillStyle = 'rgba(224, 242, 254, 0.92)';
  ctx.shadowColor = 'rgba(56, 189, 248, 0.28)';
  ctx.shadowBlur = 12;

  segments.forEach(([startKey, endKey]) => {
    const start = keypoints[startKey];
    const end = keypoints[endKey];

    if (!start || !end) {
      return;
    }

    const projectedStart = projectGarmentPoint(start, transform, garmentImage);
    const projectedEnd = projectGarmentPoint(end, transform, garmentImage);

    ctx.beginPath();
    ctx.moveTo(projectedStart.x, projectedStart.y);
    ctx.lineTo(projectedEnd.x, projectedEnd.y);
    ctx.stroke();
  });

  ctx.shadowBlur = 0;

  Object.values(keypoints).forEach((point) => {
    if (!point) {
      return;
    }

    const projectedPoint = projectGarmentPoint(point, transform, garmentImage);

    ctx.beginPath();
    ctx.arc(projectedPoint.x, projectedPoint.y, Math.max(3, transform.width * 0.012), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(14, 165, 233, 1)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  ctx.restore();
}



