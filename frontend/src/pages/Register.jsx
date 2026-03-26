import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLayout from '../components/auth/AuthLayout';
import RegisterForm from '../components/auth/RegisterForm';
import { useAuth } from '../hooks/useAuth';

const Register = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationPreviewUrl, setVerificationPreviewUrl] = useState('');
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    setVerificationPreviewUrl('');

    try {
      const response = await register(values);

      if (response.verificationRequired) {
        setVerificationPreviewUrl(response.verificationPreviewUrl || '');
        toast.success('Account created. Verify your email to finish setup.');
        return;
      }

      toast.success('Account created successfully.');
      navigate('/profile', { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Create Account"
      title="Register once, then unlock the full fashion workflow"
      description="Signing up gives the user access to cart, profile, virtual try-on, model analysis, and future personalized recommendations."
      footer={(
        <p>
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-rose-600 hover:text-rose-700">
            Sign in instead
          </Link>
          .
        </p>
      )}
    >
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Register</h2>
          <p className="mt-2 text-sm text-slate-500">Create a user account to start shopping and using the protected AI features.</p>
        </div>

        {verificationPreviewUrl ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Verification is enabled. For local development, the generated verification link is available here:{' '}
            <a href={verificationPreviewUrl} className="font-semibold underline">
              open verification
            </a>
            .
          </div>
        ) : null}

        <RegisterForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </AuthLayout>
  );
};

export default Register;
