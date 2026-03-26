import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { productReviewApi } from '../utils/productReviewApi';
import { featureRatingApi } from '../utils/featureRatingApi';
import { orderApi } from '../utils/orderApi';
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

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleString();
}

function formatCurrency(amount = 0, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: String(currency || 'usd').toUpperCase(),
  }).format((Number(amount) || 0) / 100);
}

function formatStatusLabel(value = '') {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return 'N/A';
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getOrderStatusClasses(status) {
  switch (status) {
    case 'delivered':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'shipped':
      return 'border-sky-200 bg-sky-50 text-sky-700';
    case 'processing':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'cancelled':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
}

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
  const [myOrders, setMyOrders] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const loadProfileActivity = async () => {
      if (!token) {
        setLoadingActivity(false);
        return;
      }

      setLoadingActivity(true);

      const [productRatingsResult, featureRatingsResult, ordersResult] = await Promise.allSettled([
        productReviewApi.getMyReviews(token),
        featureRatingApi.getMyRatings(token),
        orderApi.getMyOrders(token),
      ]);

      if (productRatingsResult.status === 'fulfilled') {
        setMyProductReviews(
          Array.isArray(productRatingsResult.value.reviews) ? productRatingsResult.value.reviews : []
        );
      } else {
        toast.error(productRatingsResult.reason?.message || 'Unable to load dress ratings.');
      }

      if (featureRatingsResult.status === 'fulfilled') {
        setFeatureRatings({
          model: featureRatingsResult.value.model || initialFeatureRatings.model,
          digitalMirror: featureRatingsResult.value.digitalMirror || initialFeatureRatings.digitalMirror,
        });
      } else {
        toast.error(featureRatingsResult.reason?.message || 'Unable to load feature ratings.');
      }

      if (ordersResult.status === 'fulfilled') {
        setMyOrders(Array.isArray(ordersResult.value.orders) ? ordersResult.value.orders : []);
      } else {
        toast.error(ordersResult.reason?.message || 'Unable to load your orders.');
      }

      setLoadingActivity(false);
    };

    loadProfileActivity();
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
            Manage your account, review your placed orders, track dress feedback, and rate both the Model and Digital Mirror experiences here.
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
          <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] xl:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">My Orders</h2>
                <p className="mt-2 text-sm text-slate-500">
                  All placed orders stay inside your profile. Tracking details are updated by admin when the shipment moves forward.
                </p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                Total orders: {myOrders.length}
              </div>
            </div>

            {loadingActivity ? (
              <p className="mt-6 text-sm font-medium text-slate-600">Loading your account activity...</p>
            ) : myOrders.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-sm text-slate-500">
                You do not have any placed orders yet. Once checkout succeeds, your order will appear here automatically.
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {myOrders.map((order) => {
                  const orderId = order.id || order._id;

                  return (
                    <div
                      key={orderId}
                      className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">
                            Order #{String(orderId).slice(-8).toUpperCase()}
                          </p>
                          <p className="mt-2 text-sm text-slate-500">Placed: {formatDate(order.placedAt || order.createdAt)}</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <span className={`rounded-full border px-4 py-2 text-sm font-medium ${getOrderStatusClasses(order.orderStatus)}`}>
                            {formatStatusLabel(order.orderStatus)}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                            Payment: {formatStatusLabel(order.paymentStatus)}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                            Total: {formatCurrency(order.totalAmount, order.currency)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tracking</p>
                          <p className="mt-2 text-sm font-medium text-slate-700">{order.trackingNumber || 'Not assigned yet'}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Items</p>
                          <p className="mt-2 text-sm font-medium text-slate-700">{order.items?.length || 0}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Shipped</p>
                          <p className="mt-2 text-sm font-medium text-slate-700">{formatDate(order.shippedAt)}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Delivered</p>
                          <p className="mt-2 text-sm font-medium text-slate-700">{formatDate(order.deliveredAt)}</p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        {order.items?.map((item, index) => (
                          <div
                            key={`${orderId}-${item.name}-${index}`}
                            className="grid gap-4 rounded-[1.5rem] border border-slate-100 bg-white p-4 lg:grid-cols-[84px_minmax(0,1fr)_180px]"
                          >
                            <div className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-50">
                              {item.image?.url || item.image ? (
                                <img
                                  src={resolveProductImageUrl({ image: item.image })}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                  No image
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-base font-semibold text-slate-900">{item.name}</p>
                              <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-600">
                                <span className="rounded-full bg-slate-50 px-3 py-1">Qty: {item.quantity}</span>
                                <span className="rounded-full bg-slate-50 px-3 py-1">Size: {item.size || 'N/A'}</span>
                                <span className="rounded-full bg-slate-50 px-3 py-1">Color: {item.color || 'N/A'}</span>
                              </div>
                            </div>

                            <div className="text-left lg:text-right">
                              <p className="text-sm text-slate-500">Unit Price</p>
                              <p className="text-base font-semibold text-slate-900">{formatCurrency(item.price, order.currency)}</p>
                              <p className="mt-2 text-sm text-slate-500">Line Total</p>
                              <p className="text-base font-semibold text-rose-600">
                                {formatCurrency(item.price * item.quantity, order.currency)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

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

            {loadingActivity ? (
              <p className="mt-6 text-sm font-medium text-slate-600">Loading your account activity...</p>
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
