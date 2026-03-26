import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Profile = () => {
  const {
    user,
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

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

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

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#fffaf8_0%,_#ffffff_45%,_#f8fafc_100%)] pb-12 pt-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">Account Center</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-slate-900">Profile</h1>
          <p className="mt-3 max-w-2xl text-base text-slate-500">
            Manage your basic account details and password here. Try-on pages, cart, and checkout now use this authenticated identity.
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
      </div>
    </div>
  );
};

export default Profile;
