import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailWarning, setEmailWarning] = useState('');

  const destination = location.state?.from || '/profile';

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(destination, { replace: true });
    }
  }, [destination, isAuthenticated, loading, navigate]);

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    setEmailWarning('');

    try {
      await login(values);
      toast.success('Welcome back.');
      navigate(destination, { replace: true });
    } catch (error) {
      if (error.code === 'EMAIL_NOT_VERIFIED') {
        setEmailWarning('Your account exists, but the email is not verified yet.');
      }

      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Member Access"
      title="Sign in to unlock cart and try-on features"
      description="Guests can keep browsing Home and About, but shopping actions and AI tools now require a signed-in account."
      footer={(
        <p>
          Need an account?{' '}
          <Link to="/register" className="font-semibold text-rose-600 hover:text-rose-700">
            Create one here
          </Link>
          .
        </p>
      )}
    >
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Login</h2>
          <p className="mt-2 text-sm text-slate-500">Continue to your profile, cart, and AI-powered styling tools.</p>
        </div>

        {emailWarning ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {emailWarning}{' '}
            <Link to="/verify-email" className="font-semibold underline">
              Open email verification
            </Link>
            .
          </div>
        ) : null}

        <LoginForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </AuthLayout>
  );
};

export default Login;
