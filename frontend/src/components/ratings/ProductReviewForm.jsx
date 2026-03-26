import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { productReviewApi } from '../../utils/productReviewApi';
import { getPersistentProductId } from '../../utils/ratingHelpers';
import StarRatingInput from './StarRatingInput';

const ProductReviewForm = ({ product, initialReview, onSaved }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, token } = useAuth();
  const [styleMatchRating, setStyleMatchRating] = useState(4);
  const [qualityRating, setQualityRating] = useState(4);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const productId = getPersistentProductId(product);

  useEffect(() => {
    if (initialReview) {
      setStyleMatchRating(initialReview.styleMatchRating || 4);
      setQualityRating(initialReview.qualityRating || 4);
      setComment(initialReview.comment || '');
    } else {
      setStyleMatchRating(4);
      setQualityRating(4);
      setComment('');
    }
  }, [initialReview]);

  if (!productId) {
    return null;
  }

  const handleRequireLogin = () => {
    navigate('/login', {
      state: {
        from: `${location.pathname}${location.search}${location.hash}`,
      },
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login to submit a rating.');
      handleRequireLogin();
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await productReviewApi.upsertProductReview(
        productId,
        {
          styleMatchRating,
          qualityRating,
          comment,
        },
        token
      );

      toast.success(response.message || 'Review saved successfully.');
      onSaved?.(response);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-slate-900">Rate This Dress</h4>
          <p className="text-sm text-slate-500">
            Rate both the style match and the item quality to improve recommendations.
          </p>
        </div>
        {!isAuthenticated ? (
          <button
            type="button"
            onClick={handleRequireLogin}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
          >
            Login to Rate
          </button>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <StarRatingInput
          label="Style Match Accuracy"
          value={styleMatchRating}
          onChange={setStyleMatchRating}
        />

        <StarRatingInput
          label="Item Quality"
          value={qualityRating}
          onChange={setQualityRating}
        />

        <div>
          <label htmlFor="product-review-comment" className="mb-2 block text-sm font-semibold text-slate-700">
            Comment (Optional)
          </label>
          <textarea
            id="product-review-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
            placeholder="Share why this item matched well, or how the quality felt."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : initialReview ? 'Update Review' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default ProductReviewForm;
