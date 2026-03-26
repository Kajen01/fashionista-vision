import React from 'react';
import { Star } from 'lucide-react';
import { getProductRatingSummary } from '../../utils/ratingHelpers';

const ProductStarRating = ({
  product,
  summary,
  size = 'sm',
  showCount = true,
  className = '',
}) => {
  const rating = getProductRatingSummary(summary || product || {});
  const filledStars = Math.round(rating.overallRatingAvg);
  const iconSizeClass = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const textSizeClass = size === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={`${iconSizeClass} ${
              index < filledStars
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-300'
            }`}
          />
        ))}
      </div>

      <div className={`flex items-center gap-2 text-slate-500 ${textSizeClass}`}>
        <span className="font-semibold text-slate-700">{rating.overallRatingAvg.toFixed(1)}/5</span>
        {showCount ? (
          rating.reviewCount > 0 ? (
            <span>({rating.reviewCount} review{rating.reviewCount === 1 ? '' : 's'})</span>
          ) : (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">New</span>
          )
        ) : null}
      </div>
    </div>
  );
};

export default ProductStarRating;
