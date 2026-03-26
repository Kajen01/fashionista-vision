import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLayout from '../components/auth/AuthLayout';
import { useAuth } from '../hooks/useAuth';
import { validateEmail } from '../utils/validators';

const VerifyEmail = () => {
  const { verifyEmail, resendVerification } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  useEffect(() => {
    const runVerification = async () => {
      if (!token) {
        return;
      }

      setStatus('loading');
      setMessage('Verifying your email...');

      try {
        const response = await verifyEmail(token);
        setStatus('success');
        setMessage(response.message);
        toast.success(response.message);
      } catch (error) {
        setStatus('error');
        setMessage(error.message);
        toast.error(error.message);
      }
    };

    runVerification();
  }, [token, verifyEmail]);

  const handleResend = async (event) => {
    event.preventDefault();

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setResendLoading(true);

    try {
      const response = await resendVerification(email);
      setMessage(response.verificationPreviewUrl
        ? `Verification link generated: ${response.verificationPreviewUrl}`
        : response.message);
      setStatus('resent');
      toast.success(response.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Verify Account"
      title="Confirm the email before you continue"
      description="If email verification is enabled in your backend config, this page completes the account activation flow."
      footer={(
        <p>
          After verification, you can return to{' '}
          <Link to="/login" className="font-semibold text-rose-600 hover:text-rose-700">
            Login
          </Link>
          .
        </p>
      )}
    >
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Email Verification</h2>
          <p className="mt-2 text-sm text-slate-500">Open the verification link from your email, or request a fresh one below.</p>
        </div>

        {message ? (
          <div className={`rounded-2xl px-4 py-3 text-sm ${
            status === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
              : status === 'error'
                ? 'border border-red-200 bg-red-50 text-red-600'
                : 'border border-blue-200 bg-blue-50 text-blue-700'
          }`}>
            {message}
          </div>
        ) : null}

        {!token ? (
          <form onSubmit={handleResend} className="space-y-4">
            <div>
              <label htmlFor="verify-email" className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                id="verify-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={resendLoading}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resendLoading ? 'Sending link...' : 'Resend Verification Email'}
            </button>
          </form>
        ) : null}
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;
