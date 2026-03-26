import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { productReviewApi } from '../utils/productReviewApi';
import { featureRatingApi } from '../utils/featureRatingApi';
import { resolveProductImageUrl } from '../utils/runtimeConfig';
import { calculateReviewOverall, getProductRatingSummary } from '../utils/ratingHelpers';
import ProductStarRating from '../components/ratings/ProductStarRating';
import FeatureRatingCard from '../components/ratings/FeatureRatingCard';

const initialFeatureRatings = {
  model: {
    summary: { averageRating: 0, reviewCount: 0, hasRatings: false },
    myRating: null,
  },
  digitalMirror: {
    summary: { averageRating: 0, reviewCount: 0, hasRatings: false },
    myRating: null,
  },
};

const Profile = () => {
  const {
    user,
    token,
    updateProfile,
    changePassword,
    resendVerification,
  } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [myProductReviews, setMyProductReviews] = useState([]);
  const [featureRatings, setFeatureRatings] = useState(initialFeatureRatings);
  const [loadingFeedback, setLoadingFeedback] = useState(true);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const loadFeedback = async () => {
      if (!token) {
        setLoadingFeedback(false);
        return;
      }

      setLoadingFeedback(true);

      try {
        const [productRatingsResponse, featureRatingsResponse] = await Promise.all([
          productReviewApi.getMyReviews(token),
          featureRatingApi.getMyRatings(token),
        ]);

        setMyProductReviews(Array.isArray(productRatingsResponse.reviews) ? productRatingsResponse.reviews : []);
        setFeatureRatings({
          model: featureRatingsResponse.model || initialFeatureRatings.model,
          digitalMirror: featureRatingsResponse.digitalMirror || initialFeatureRatings.digitalMirror,
        });
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoadingFeedback(false);
      }
    };

    loadFeedback();
  }, [token]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSavingProfile(true);

    try {
      const response = await updateProfile(profileForm);
      toast.success(response.message || 'Profile updated successfully.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setSavingPassword(true);

    try {
      const response = await changePassword(passwordForm);
      toast.success(response.message || 'Password changed successfully.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const response = await resendVerification(user?.email);
      toast.success(response.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleFeatureRatingSaved = (targetType, response) => {
    setFeatureRatings((current) => {
      const next = { ...current };

      if (targetType === 'model') {
        next.model = {
          summary: response.summary || current.model.summary,
          myRating: response.rating || current.model.myRating,
        };
      } else {
        next.digitalMirror = {
          summary: response.summary || current.digitalMirror.summary,
          myRating: response.rating || current.digitalMirror.myRating,
        };
      }

      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#fffaf8_0%,_#ffffff_45%,_#f8fafc_100%)] pb-12 pt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">Account Center</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-slate-900">Profile</h1>
          <p className="mt-3 max-w-2xl text-base text-slate-500">
            Manage your account, track your dress feedback, and rate both the Model and Digital Mirror experiences here.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
              Role: {user?.role || (user?.isAdmin ? 'admin' : 'user')}
            </div>
            <div className={`rounded-full border px-4 py-2 text-sm font-medium ${
              user?.isVerified
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}>
              {user?.isVerified ? 'Email verified' : 'Email not verified'}
            </div>
          </div>
        </header>

        {!user?.isVerified ? (
          <div className="mb-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-amber-700">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-semibold">Verification recommended</p>
                <p className="mt-1 text-sm">
                  Your account can browse and use the protected frontend flow, but if you enable strict verification in the backend, this email must be confirmed.
                </p>
                <button
                  onClick={handleResendVerification}
                  className="mt-3 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
                >
                  Resend Verification Link
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <h2 className="text-2xl font-semibold text-slate-900">Profile Details</h2>
            <p className="mt-2 text-sm text-slate-500">Update your name and email address.</p>

            <form onSubmit={handleProfileSubmit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="profile-name" className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
                <input
                  id="profile-name"
                  name="name"
                  type="text"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                />
              </div>

              <div>
                <label htmlFor="profile-email" className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <h2 className="text-2xl font-semibold text-slate-900">Change Password</h2>
            <p className="mt-2 text-sm text-slate-500">Use your current password to set a new one.</p>

            <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="current-password" className="mb-2 block text-sm font-semibold text-slate-700">Current Password</label>
                <input
                  id="current-password"
                  name="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                />
              </div>

              <div>
                <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-slate-700">New Password</label>
                <input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingPassword ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section
            id="my-dress-ratings"
            className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] xl:col-span-2"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">My Dress Ratings</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Ratings you submitted for MongoDB-backed recommendation items appear here.
                </p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                Total rated items: {myProductReviews.length}
              </div>
            </div>

            {loadingFeedback ? (
              <p className="mt-6 text-sm font-medium text-slate-600">Loading your feedback...</p>
            ) : myProductReviews.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-sm text-slate-500">
                You have not rated any MongoDB-backed dresses yet. Open a recommended dress card and submit a review there.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {myProductReviews.map((review) => {
                  const product = review.product || {};
                  const summary = getProductRatingSummary(product);

                  return (
                    <div
                      key={review.id || review._id}
                      className="grid gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5 lg:grid-cols-[96px_minmax(0,1fr)]"
                    >
                      <div className="h-24 w-24 overflow-hidden rounded-2xl bg-white">
                        {product.image ? (
                          <img
                            src={resolveProductImageUrl(product)}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-slate-400">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-semibold text-slate-900">{product.name || 'Removed product'}</h3>
                            <ProductStarRating product={product} summary={summary} className="mt-2" />
                          </div>
                          <div className="rounded-full border border-rose-100 bg-white px-4 py-2 text-sm font-medium text-rose-600">
                            Your overall: {calculateReviewOverall(review.styleMatchRating, review.qualityRating).toFixed(1)}/5
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                          <span className="rounded-full bg-white px-3 py-1">Style Match: {review.styleMatchRating}/5</span>
                          <span className="rounded-full bg-white px-3 py-1">Quality: {review.qualityRating}/5</span>
                          <span className="rounded-full bg-white px-3 py-1">Updated: {new Date(review.updatedAt).toLocaleString()}</span>
                        </div>

                        {review.comment ? (
                          <p className="mt-4 text-sm leading-6 text-slate-600">{review.comment}</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <div id="model-feature-rating">
            <FeatureRatingCard
              title="Model Feature Rating"
              description="Rate how useful or accurate the Model feature felt after your image-based recommendations."
              targetType="model"
              data={featureRatings.model}
              token={token}
              onSaved={handleFeatureRatingSaved}
            />
          </div>

          <div id="digital-mirror-feature-rating">
            <FeatureRatingCard
              title="Digital Mirror Feature Rating"
              description="Rate the realism and usefulness of the live Digital Mirror experience."
              targetType="digital_mirror"
              data={featureRatings.digitalMirror}
              token={token}
              onSaved={handleFeatureRatingSaved}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
