import { computeTransform } from '../pose/poseMath';

const MIN_VISIBILITY = 0.25;

function isVisible(landmark) {
  return landmark && (landmark.visibility ?? 1) >= MIN_VISIBILITY;
}

export function buildMirrorTransform({
  landmarks,
  garment,
  canvasWidth,
  canvasHeight,
  params,
}) {
  if (!landmarks || !garment) {
    return null;
  }

  const base = computeTransform(landmarks, garment, canvasWidth, canvasHeight);

  if (!base) {
    return null;
  }

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const garmentOffsetX = garment.offset?.x ?? 0;
  const garmentOffsetY = garment.offset?.y ?? 0.15;

  if (!isVisible(leftShoulder) || !isVisible(rightShoulder)) {
    return {
      ...base,
      x: base.x + (base.width * garmentOffsetX) + params.xOffset,
      y: base.y + params.yOffset,
      width: base.width * params.scale,
      rotation: base.rotation + ((params.rotation * Math.PI) / 180),
    };
  }

  const shoulderMidX = ((leftShoulder.x + rightShoulder.x) / 2) * canvasWidth;
  const shoulderMidY = ((leftShoulder.y + rightShoulder.y) / 2) * canvasHeight;
  const shoulderSpan = Math.hypot(
    (rightShoulder.x - leftShoulder.x) * canvasWidth,
    (rightShoulder.y - leftShoulder.y) * canvasHeight,
  );

  const hipMidY = isVisible(leftHip) && isVisible(rightHip)
    ? (((leftHip.y + rightHip.y) / 2) * canvasHeight)
    : shoulderMidY + (shoulderSpan * 1.55);

  const torsoHeight = Math.max(shoulderSpan * 1.35, hipMidY - shoulderMidY);
  const shoulderMatchedWidth = shoulderSpan
    * garment.scale
    * Math.max(1, base.perspectiveFactor * 0.92)
    * (garment.fit === 'tight' ? 1.05 : 1.16);

  const blendedWidth = (base.width * 0.55) + (shoulderMatchedWidth * 0.45);
  const garmentDrop = torsoHeight * garmentOffsetY * 0.55;
  const shoulderLift = shoulderSpan * 0.14;
  const shoulderAnchoredY = (base.y * 0.35) + ((shoulderMidY + garmentDrop - shoulderLift) * 0.65);

  return {
    ...base,
    x: shoulderMidX + (blendedWidth * garmentOffsetX) + params.xOffset,
    y: shoulderAnchoredY + params.yOffset,
    width: blendedWidth * params.scale,
    rotation: base.rotation + ((params.rotation * Math.PI) / 180),
  };
}
