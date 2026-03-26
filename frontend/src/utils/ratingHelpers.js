export const DEFAULT_PRODUCT_DISPLAY_RATING = 4;

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function calculateReviewOverall(styleMatchRating = 0, qualityRating = 0) {
  return Number(((toNumber(styleMatchRating) * 0.6) + (toNumber(qualityRating) * 0.4)).toFixed(2));
}

export function getProductRatingSummary(source = {}) {
  const reviewCount = Math.max(0, toNumber(source.reviewCount, 0));
  const isDefaultRating = source.isDefaultRating === true || reviewCount === 0;

  const styleMatchRatingAvg = isDefaultRating
    ? DEFAULT_PRODUCT_DISPLAY_RATING
    : toNumber(source.styleMatchRatingAvg, 0);
  const qualityRatingAvg = isDefaultRating
    ? DEFAULT_PRODUCT_DISPLAY_RATING
    : toNumber(source.qualityRatingAvg, 0);
  const overallRatingAvg = isDefaultRating
    ? DEFAULT_PRODUCT_DISPLAY_RATING
    : toNumber(source.overallRatingAvg, 0);

  return {
    styleMatchRatingAvg: Number(styleMatchRatingAvg.toFixed(2)),
    qualityRatingAvg: Number(qualityRatingAvg.toFixed(2)),
    overallRatingAvg: Number(overallRatingAvg.toFixed(2)),
    reviewCount,
    isDefaultRating,
  };
}

export function getPersistentProductId(product) {
  if (product?._id) {
    return String(product._id);
  }

  if (typeof product?.id === 'string' && product.id.length >= 12) {
    return product.id;
  }

  return null;
}
