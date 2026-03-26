import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import { userApi } from '../../utils/userApi';

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleString();
}

const AdminUsers = () => {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);

      try {
        const response = await userApi.getUsers(token);
        setUsers(Array.isArray(response) ? response : []);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadUsers();
    }
  }, [token]);

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await userApi.deleteUser(userId, token);
      setUsers((current) => current.filter((entry) => (entry.id || entry._id) !== userId));
      toast.success('User deleted successfully.');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <AdminLayout
      title="Users"
      description="View every account in the system, including admin accounts, and update the supported user fields safely."
    >
      <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        {loading ? (
          <p className="text-sm font-medium text-slate-600">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
            No users found yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-3 py-3 font-semibold">Name</th>
                  <th className="px-3 py-3 font-semibold">Email</th>
                  <th className="px-3 py-3 font-semibold">Role</th>
                  <th className="px-3 py-3 font-semibold">Verified</th>
                  <th className="px-3 py-3 font-semibold">Created</th>
                  <th className="px-3 py-3 font-semibold">Last Login</th>
                  <th className="px-3 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((entry) => {
                  const userId = entry.id || entry._id;
                  const isCurrentUser = userId === (user?.id || user?._id);

                  return (
                    <tr key={userId}>
                      <td className="px-3 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">{entry.name}</p>
                          {isCurrentUser ? (
                            <p className="text-xs text-rose-600">Current session</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-slate-600">{entry.email}</td>
                      <td className="px-3 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 font-medium capitalize text-slate-700">
                          {entry.role || (entry.isAdmin ? 'admin' : 'user')}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span className={`rounded-full px-3 py-1 font-medium ${
                          entry.isVerified
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {entry.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-slate-600">{formatDate(entry.createdAt)}</td>
                      <td className="px-3 py-4 text-slate-600">{formatDate(entry.lastLoginAt)}</td>
                      <td className="px-3 py-4">
                        <div className="flex justify-end gap-3">
                          <Link
                            to={`/admin/users/${userId}/edit`}
                            className="rounded-full border border-slate-200 px-3 py-2 font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(userId, entry.name)}
                            className="rounded-full border border-red-200 px-3 py-2 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isCurrentUser}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
