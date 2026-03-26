import React, { useState } from 'react';
import { validateEmail, validatePassword } from '../../utils/validators';

const LoginForm = ({ onSubmit, isSubmitting }) => {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateEmail(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!validatePassword(form.password)) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError('');
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-slate-700">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-slate-700">
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
          placeholder="Enter your password"
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
};

export default LoginForm;
