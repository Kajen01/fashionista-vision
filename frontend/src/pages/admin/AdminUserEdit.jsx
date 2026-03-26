import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import { userApi } from '../../utils/userApi';
import { validateEmail, validateRequired } from '../../utils/validators';

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleString();
}

const AdminUserEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRecord, setUserRecord] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'user',
    isVerified: false,
  });

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);

      try {
        const response = await userApi.getUserById(id, token);
        setUserRecord(response);
        setForm({
          name: response.name || '',
          email: response.email || '',
          role: response.role || (response.isAdmin ? 'admin' : 'user'),
          isVerified: Boolean(response.isVerified),
        });
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      loadUser();
    }
  }, [id, token]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateRequired(form.name)) {
      toast.error('Name is required.');
      return;
    }

    if (!validateEmail(form.email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      await userApi.updateUser(id, form, token);
      toast.success('User updated successfully.');
      navigate('/admin/users');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditingSelf = (userRecord?.id || userRecord?._id) === (user?.id || user?._id);

  return (
    <AdminLayout
      title="Edit User"
      description="Update the supported account fields for this user record."
      actions={(
        <Link
          to="/admin/users"
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
        >
          Back to Users
        </Link>
      )}
    >
      <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        {loading ? (
          <p className="text-sm font-medium text-slate-600">Loading user...</p>
        ) : !userRecord ? (
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
            User not found.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="admin-user-name" className="mb-2 block text-sm font-semibold text-slate-700">
                  Name
                </label>
                <input
                  id="admin-user-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                />
              </div>

              <div>
                <label htmlFor="admin-user-email" className="mb-2 block text-sm font-semibold text-slate-700">
                  Email
                </label>
                <input
                  id="admin-user-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                />
              </div>

              <div>
                <label htmlFor="admin-user-role" className="mb-2 block text-sm font-semibold text-slate-700">
                  Role
                </label>
                <select
                  id="admin-user-role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                {isEditingSelf ? (
                  <p className="mt-2 text-xs text-slate-500">The backend will prevent removing your own admin access.</p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-200 px-4 py-3">
                <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <input
                    name="isVerified"
                    type="checkbox"
                    checked={form.isVerified}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  Mark email as verified
                </label>
              </div>
            </div>

            <div className="grid gap-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-700">Created</p>
                <p className="mt-2 text-sm text-slate-500">{formatDate(userRecord.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Last Login</p>
                <p className="mt-2 text-sm text-slate-500">{formatDate(userRecord.lastLoginAt)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Saving...' : 'Save User'}
              </button>
              <Link
                to="/admin/users"
                className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUserEdit;
