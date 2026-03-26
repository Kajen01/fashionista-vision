export const DEFAULT_DISPLAY_RATING = 4;

function roundTo(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

export function calculateOverallRating(styleMatchRating = 0, qualityRating = 0) {
  return roundTo((Number(styleMatchRating) * 0.6) + (Number(qualityRating) * 0.4), 2);
}

export function buildProductRatingSummary(source = {}) {
  const reviewCount = Number(source.reviewCount || 0);
  const hasReviews = reviewCount > 0;
  const styleMatchRatingAvg = hasReviews
    ? roundTo(Number(source.styleMatchRatingAvg || 0), 2)
    : DEFAULT_DISPLAY_RATING;
  const qualityRatingAvg = hasReviews
    ? roundTo(Number(source.qualityRatingAvg || 0), 2)
    : DEFAULT_DISPLAY_RATING;
  const overallRatingAvg = hasReviews
    ? roundTo(Number(source.overallRatingAvg || 0), 2)
    : DEFAULT_DISPLAY_RATING;

  return {
    styleMatchRatingAvg,
    qualityRatingAvg,
    overallRatingAvg,
    reviewCount,
    isDefaultRating: !hasReviews,
  };
}

export function buildFeatureRatingSummary(ratings = []) {
  const reviewCount = ratings.length;

  if (reviewCount === 0) {
    return {
      averageRating: 0,
      reviewCount: 0,
      hasRatings: false,
    };
  }

  const total = ratings.reduce((sum, entry) => sum + Number(entry.rating || 0), 0);

  return {
    averageRating: roundTo(total / reviewCount, 2),
    reviewCount,
    hasRatings: true,
  };
}
