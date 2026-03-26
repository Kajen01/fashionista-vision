import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { featureRatingApi } from '../../utils/featureRatingApi';
import StarRatingInput from './StarRatingInput';

const FeatureRatingCard = ({
  title,
  description,
  targetType,
  data,
  token,
  onSaved,
}) => {
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setRating(data?.myRating?.rating || 4);
    setComment(data?.myRating?.comment || '');
  }, [data]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await featureRatingApi.upsertRating(
        targetType,
        {
          rating,
          comment,
        },
        token
      );

      toast.success(response.message || 'Feature rating saved successfully.');
      onSaved?.(targetType, response);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const summary = data?.summary || { averageRating: 0, reviewCount: 0, hasRatings: false };

  return (
    <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{description}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
          Average: {summary.hasRatings ? `${summary.averageRating.toFixed(1)}/5` : 'No ratings yet'}
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
          Responses: {summary.reviewCount || 0}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <StarRatingInput
          label="Your Rating"
          value={rating}
          onChange={setRating}
        />

        <div>
          <label htmlFor={`${targetType}-comment`} className="mb-2 block text-sm font-semibold text-slate-700">
            Comment (Optional)
          </label>
          <textarea
            id={`${targetType}-comment`}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
            placeholder="Tell us how useful this feature felt."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : data?.myRating ? 'Update Feature Rating' : 'Save Feature Rating'}
        </button>
      </form>
    </section>
  );
};

export default FeatureRatingCard;
