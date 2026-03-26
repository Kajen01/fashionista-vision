import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';

const isAdminUser = (account) => (account?.role || (account?.isAdmin ? 'admin' : 'user')) === 'admin';

const resolveDestination = (requestedPath, account) => {
  if (!requestedPath) {
    return isAdminUser(account) ? '/admin' : '/profile';
  }

  if (requestedPath.startsWith('/admin') && !isAdminUser(account)) {
    return '/profile';
  }

  return requestedPath;
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailWarning, setEmailWarning] = useState('');
  const [loginMode, setLoginMode] = useState('user');
  const requestedPath = location.state?.from;

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      navigate(resolveDestination(requestedPath, user), { replace: true });
    }
  }, [requestedPath, isAuthenticated, loading, navigate, user]);

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    setEmailWarning('');

    try {
      const response = await login(values);
      toast.success('Welcome back.');
      navigate(resolveDestination(requestedPath, response.user), { replace: true });
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
      eyebrow={loginMode === 'admin' ? 'Admin Access' : 'Member Access'}
      title={loginMode === 'admin' ? 'Sign in to manage users and products' : 'Sign in to unlock cart and try-on features'}
      description={loginMode === 'admin'
        ? 'Admin accounts use the same login page, with an extra protected dashboard once signed in.'
        : 'Guests can keep browsing Home and About, but shopping actions and AI tools now require a signed-in account.'}
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
          <h2 className="text-2xl font-semibold text-slate-900">
            {loginMode === 'admin' ? 'Admin Login' : 'Login'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {loginMode === 'admin'
              ? 'Use an admin account to open the dashboard while keeping all normal authenticated access.'
              : 'Continue to your profile, cart, and AI-powered styling tools.'}
          </p>
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

        <LoginForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          loginMode={loginMode}
          onLoginModeChange={setLoginMode}
        />
      </div>
    </AuthLayout>
  );
};

export default Login;
