import React, { useState } from 'react';
import { Star } from 'lucide-react';

const StarRatingInput = ({ label, value, onChange }) => {
  const [hoveredValue, setHoveredValue] = useState(0);
  const activeValue = hoveredValue || value || 0;

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">{label}</p>
      <div className="flex items-center gap-2">
        {Array.from({ length: 5 }).map((_, index) => {
          const nextValue = index + 1;

          return (
            <button
              key={nextValue}
              type="button"
              onMouseEnter={() => setHoveredValue(nextValue)}
              onMouseLeave={() => setHoveredValue(0)}
              onClick={() => onChange(nextValue)}
              className="transition-transform hover:scale-110"
              aria-label={`${label}: ${nextValue} star${nextValue === 1 ? '' : 's'}`}
            >
              <Star
                className={`h-6 w-6 ${
                  nextValue <= activeValue
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-300'
                }`}
              />
            </button>
          );
        })}
        <span className="text-sm font-medium text-slate-500">{value || 0}/5</span>
      </div>
    </div>
  );
};

export default StarRatingInput;
