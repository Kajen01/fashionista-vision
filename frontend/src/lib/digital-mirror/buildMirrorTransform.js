const HUMAN_VISIBILITY_THRESHOLD = 0.25;

function isVisible(landmark) {
  return landmark && (landmark.visibility ?? 1) >= HUMAN_VISIBILITY_THRESHOLD;
}

function toCanvasPoint(landmark, canvasWidth, canvasHeight) {
  return {
    x: landmark.x * canvasWidth,
    y: landmark.y * canvasHeight,
  };
}

function midpoint(pointA, pointB) {
  return {
    x: (pointA.x + pointB.x) / 2,
    y: (pointA.y + pointB.y) / 2,
  };
}

function distance(pointA, pointB) {
  return Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
}

function angle(pointA, pointB) {
  return Math.atan2(pointB.y - pointA.y, pointB.x - pointA.x);
}

function toImagePoint(point, imageWidth, imageHeight) {
  return {
    x: point.x * imageWidth,
    y: point.y * imageHeight,
  };
}

function orderPointsByX(pointA, pointB) {
  return pointA.x <= pointB.x ? [pointA, pointB] : [pointB, pointA];
}

export function buildMirrorTransform({
  landmarks,
  garment,
  garmentImage,
  canvasWidth,
  canvasHeight,
  params,
}) {
  const analysis = garmentImage?.garmentAnalysis || garment?.analysis;
  const keypoints = analysis?.keypoints;

  if (!landmarks || !analysis || !keypoints || !garmentImage) {
    return null;
  }

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];

  if (!isVisible(leftShoulder) || !isVisible(rightShoulder)) {
    return null;
  }

  const humanShoulderA = toCanvasPoint(leftShoulder, canvasWidth, canvasHeight);
  const humanShoulderB = toCanvasPoint(rightShoulder, canvasWidth, canvasHeight);
  const [humanScreenLeftShoulder, humanScreenRightShoulder] = orderPointsByX(humanShoulderA, humanShoulderB);
  const humanShoulderMid = midpoint(humanShoulderA, humanShoulderB);
  const humanShoulderWidth = distance(humanShoulderA, humanShoulderB);

  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const humanLowerMid = isVisible(leftHip) && isVisible(rightHip)
    ? midpoint(toCanvasPoint(leftHip, canvasWidth, canvasHeight), toCanvasPoint(rightHip, canvasWidth, canvasHeight))
    : { x: humanShoulderMid.x, y: humanShoulderMid.y + (humanShoulderWidth * 1.55) };

  const humanTorsoHeight = Math.max(humanShoulderWidth * 1.15, distance(humanShoulderMid, humanLowerMid));
  const humanBodyHeight = analysis.garmentType === 'dress'
    ? Math.max(humanTorsoHeight * 2.2, distance(humanShoulderMid, humanLowerMid) + (humanShoulderWidth * 1.2))
    : humanTorsoHeight;

  const garmentLeftShoulder = keypoints.leftShoulder;
  const garmentRightShoulder = keypoints.rightShoulder;
  const garmentLeftWaist = keypoints.leftWaist;
  const garmentRightWaist = keypoints.rightWaist;
  const garmentHemCenter = keypoints.hemCenter || keypoints.rightWaist;

  if (!garmentLeftShoulder || !garmentRightShoulder || !garmentLeftWaist || !garmentRightWaist) {
    return null;
  }

  const imageWidth = garmentImage.width;
  const imageHeight = garmentImage.height;
  const garmentShoulderA = toImagePoint(garmentLeftShoulder, imageWidth, imageHeight);
  const garmentShoulderB = toImagePoint(garmentRightShoulder, imageWidth, imageHeight);
  const [garmentScreenLeftShoulder, garmentScreenRightShoulder] = orderPointsByX(garmentShoulderA, garmentShoulderB);
  const garmentWaistMid = midpoint(
    toImagePoint(garmentLeftWaist, imageWidth, imageHeight),
    toImagePoint(garmentRightWaist, imageWidth, imageHeight),
  );
  const garmentShoulderMid = midpoint(garmentShoulderA, garmentShoulderB);
  const garmentHemPoint = garmentHemCenter
    ? toImagePoint(garmentHemCenter, imageWidth, imageHeight)
    : garmentWaistMid;

  const garmentShoulderWidth = Math.max(1, distance(garmentShoulderA, garmentShoulderB));
  const garmentTorsoHeight = Math.max(1, distance(garmentShoulderMid, garmentWaistMid));
  const garmentBodyHeight = Math.max(1, distance(garmentShoulderMid, garmentHemPoint));

  const shoulderScale = humanShoulderWidth / garmentShoulderWidth;
  const torsoScale = humanTorsoHeight / garmentTorsoHeight;
  const bodyScale = humanBodyHeight / garmentBodyHeight;

  const baseScale = analysis.garmentType === 'dress'
    ? (shoulderScale * 0.55) + (torsoScale * 0.2) + (bodyScale * 0.25)
    : (shoulderScale * 0.75) + (torsoScale * 0.25);

  const anchor = {
    x: garmentShoulderMid.x / imageWidth,
    y: garmentShoulderMid.y / imageHeight,
  };

  const verticalBias = analysis.garmentType === 'dress'
    ? humanShoulderWidth * 0.045
    : humanShoulderWidth * 0.02;

  return {
    x: humanShoulderMid.x + params.xOffset,
    y: humanShoulderMid.y + verticalBias + params.yOffset,
    width: imageWidth * baseScale * params.scale,
    rotation: angle(humanScreenLeftShoulder, humanScreenRightShoulder)
      - angle(garmentScreenLeftShoulder, garmentScreenRightShoulder)
      + ((params.rotation * Math.PI) / 180),
    yawSkew: 0,
    anchor,
  };
}

