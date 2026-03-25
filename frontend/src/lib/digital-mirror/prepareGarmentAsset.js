import { GarmentMaskBuilder } from '../garments/GarmentMaskBuilder';

const maskBuilder = new GarmentMaskBuilder();

const DEFAULT_GARMENT_SEGMENTS = [
  ['leftShoulder', 'rightShoulder'],
  ['leftShoulder', 'leftWaist'],
  ['rightShoulder', 'rightWaist'],
  ['leftWaist', 'hemLeft'],
  ['rightWaist', 'hemRight'],
  ['hemLeft', 'hemCenter'],
  ['hemCenter', 'hemRight'],
];

function getOpaqueBounds(maskCanvas) {
  const context = maskCanvas.getContext('2d');
  const { width, height } = maskCanvas;
  const { data } = context.getImageData(0, 0, width, height);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[((y * width) + x) * 4 + 3];

      if (alpha <= 0) {
        continue;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < 0 || maxY < 0) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: (maxX - minX) + 1,
    height: (maxY - minY) + 1,
  };
}

function shouldInferClientAnalysis(garment) {
  return garment?.source === 'upload' || !garment?.analysis?.keypoints;
}

function collectOpaqueColumns(imageData, width, rowIndex) {
  const columns = [];
  const offset = rowIndex * width * 4;

  for (let x = 0; x < width; x += 1) {
    if (imageData[offset + (x * 4) + 3] > 12) {
      columns.push(x);
    }
  }

  return columns;
}

function findRowBounds(imageData, width, height, targetFraction, minimumCoverage = 0.05, searchRadius = 36) {
  const targetRow = Math.max(0, Math.min(height - 1, Math.round((height - 1) * targetFraction)));
  const minPixels = Math.max(8, Math.round(width * minimumCoverage));
  const maxOffset = Math.max(searchRadius, Math.round(height * 0.05));

  for (let offset = 0; offset <= maxOffset; offset += 1) {
    const candidateRows = offset === 0
      ? [targetRow]
      : [targetRow - offset, targetRow + offset];

    for (const row of candidateRows) {
      if (row < 0 || row >= height) {
        continue;
      }

      const columns = collectOpaqueColumns(imageData, width, row);

      if (columns.length >= minPixels) {
        return { row, columns };
      }
    }
  }

  return null;
}

function buildTopContour(imageData, width, height) {
  const contour = new Array(width).fill(null);

  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) {
      if (imageData[((y * width) + x) * 4 + 3] > 12) {
        contour[x] = y;
        break;
      }
    }
  }

  return contour;
}

function averageContourY(contour, centerX, radius) {
  const values = [];
  const minX = Math.max(0, centerX - radius);
  const maxX = Math.min(contour.length - 1, centerX + radius);

  for (let x = minX; x <= maxX; x += 1) {
    const y = contour[x];
    if (typeof y === 'number') {
      values.push(y);
    }
  }

  if (values.length === 0) {
    return null;
  }

  const sum = values.reduce((accumulator, value) => accumulator + value, 0);
  return Math.round(sum / values.length);
}

function findShoulderAnchors(imageData, width, height) {
  const contour = buildTopContour(imageData, width, height);
  const upperLimit = Math.round(height * 0.32);
  const candidateColumns = [];

  for (let x = 0; x < contour.length; x += 1) {
    const y = contour[x];
    if (typeof y === 'number' && y <= upperLimit) {
      candidateColumns.push(x);
    }
  }

  if (candidateColumns.length < 12) {
    return null;
  }

  const leftEdge = candidateColumns[0];
  const rightEdge = candidateColumns[candidateColumns.length - 1];
  const shoulderSpan = Math.max(1, rightEdge - leftEdge);
  const inset = Math.max(6, Math.round(shoulderSpan * 0.08));
  const leftX = Math.min(rightEdge, leftEdge + inset);
  const rightX = Math.max(leftEdge, rightEdge - inset);
  const radius = Math.max(3, Math.round(width * 0.015));
  const leftY = averageContourY(contour, leftX, radius);
  const rightY = averageContourY(contour, rightX, radius);

  if (leftY === null || rightY === null) {
    return null;
  }

  return {
    leftX,
    leftY,
    rightX,
    rightY,
    confidence: Math.min(1, shoulderSpan / Math.max(width * 0.55, 1)),
  };
}

function normalizePoint(x, y, width, height, confidence) {
  return {
    x: Number((x / Math.max(width - 1, 1)).toFixed(4)),
    y: Number((y / Math.max(height - 1, 1)).toFixed(4)),
    confidence: Number(confidence.toFixed(4)),
  };
}

function inferGarmentAnalysis(croppedCanvas, garment) {
  const width = croppedCanvas.width;
  const height = croppedCanvas.height;
  const context = croppedCanvas.getContext('2d', { willReadFrequently: true });
  const { data } = context.getImageData(0, 0, width, height);

  const garmentType = garment?.fit === 'tight' ? 'top' : 'dress';
  const shoulders = findShoulderAnchors(data, width, height);
  const waistTarget = garmentType === 'top' ? 0.56 : 0.43;
  const waistData = findRowBounds(data, width, height, waistTarget, 0.05, 28);
  const hemData = findRowBounds(data, width, height, 0.94, 0.03, 18);

  if (!shoulders || !waistData || !hemData) {
    return null;
  }

  const inset = (columns, ratio) => {
    const left = columns[0];
    const right = columns[columns.length - 1];
    const span = Math.max(1, right - left);
    const delta = Math.round(span * ratio);
    return {
      left: left + delta,
      right: right - delta,
    };
  };

  const waistBounds = inset(waistData.columns, 0.06);
  const hemLeft = hemData.columns[0];
  const hemRight = hemData.columns[hemData.columns.length - 1];
  const hemCenter = Math.round((hemLeft + hemRight) / 2);
  const waistConfidence = Math.min(1, waistData.columns.length / Math.max(width * 0.4, 1));
  const hemConfidence = Math.min(1, hemData.columns.length / Math.max(width * 0.25, 1));

  return {
    garmentType,
    sourceSize: garment?.analysis?.sourceSize || { width, height },
    cropBox: garment?.analysis?.cropBox || { x: 0, y: 0, width, height },
    keypoints: {
      leftShoulder: normalizePoint(shoulders.leftX, shoulders.leftY, width, height, shoulders.confidence),
      rightShoulder: normalizePoint(shoulders.rightX, shoulders.rightY, width, height, shoulders.confidence),
      leftWaist: normalizePoint(waistBounds.left, waistData.row, width, height, waistConfidence),
      rightWaist: normalizePoint(waistBounds.right, waistData.row, width, height, waistConfidence),
      hemLeft: normalizePoint(hemLeft, hemData.row, width, height, hemConfidence),
      hemRight: normalizePoint(hemRight, hemData.row, width, height, hemConfidence),
      hemCenter: normalizePoint(hemCenter, hemData.row, width, height, hemConfidence),
    },
    skeletonSegments: garment?.analysis?.skeletonSegments || DEFAULT_GARMENT_SEGMENTS,
  };
}

export async function prepareGarmentAsset(garment, image) {
  const maskCanvas = await maskBuilder.getMask(garment.id, image);
  const bounds = getOpaqueBounds(maskCanvas);

  if (!bounds) {
    return image;
  }

  const maskedCanvas = document.createElement('canvas');
  maskedCanvas.width = image.width;
  maskedCanvas.height = image.height;

  const maskedContext = maskedCanvas.getContext('2d');
  maskedContext.drawImage(image, 0, 0);
  maskedContext.globalCompositeOperation = 'destination-in';
  maskedContext.drawImage(maskCanvas, 0, 0);
  maskedContext.globalCompositeOperation = 'source-over';

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = bounds.width;
  croppedCanvas.height = bounds.height;

  const croppedContext = croppedCanvas.getContext('2d');
  croppedContext.drawImage(
    maskedCanvas,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    0,
    0,
    bounds.width,
    bounds.height,
  );

  if (shouldInferClientAnalysis(garment)) {
    croppedCanvas.garmentAnalysis = inferGarmentAnalysis(croppedCanvas, garment);
  }

  return croppedCanvas;
}
