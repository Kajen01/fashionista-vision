import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import { userApi } from '../../utils/userApi';
import { productApi } from '../../utils/productApi';
import { resolveProductImageUrl } from '../../utils/runtimeConfig';

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleString();
}

const AdminDashboard = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      try {
        const [nextUsers, nextProducts] = await Promise.all([
          userApi.getUsers(token),
          productApi.getProducts(),
        ]);

        setUsers(Array.isArray(nextUsers) ? nextUsers : []);
        setProducts(Array.isArray(nextProducts) ? nextProducts : []);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadDashboard();
    }
  }, [token]);

  const summaryCards = useMemo(() => {
    const totalUsers = users.length;
    const totalAdmins = users.filter((entry) => (entry.role || (entry.isAdmin ? 'admin' : 'user')) === 'admin').length;
    const verifiedUsers = users.filter((entry) => entry.isVerified).length;
    const totalMongoProducts = products.length;

    return [
      { label: 'Total Users', value: totalUsers },
      { label: 'Admin Accounts', value: totalAdmins },
      { label: 'Verified Users', value: verifiedUsers },
      { label: 'MongoDB Products', value: totalMongoProducts },
    ];
  }, [products, users]);

  const latestUsers = [...users]
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
    .slice(0, 5);

  const latestProducts = [...products]
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
    .slice(0, 5);

  return (
    <AdminLayout
      title="Dashboard"
      description="This admin area manages the current MongoDB-backed products and every user account already available in the project."
      actions={(
        <>
          <Link
            to="/admin/users"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
          >
            Manage Users
          </Link>
          <Link
            to="/admin/products"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Manage Products
          </Link>
        </>
      )}
    >
      {loading ? (
        <div className="rounded-[2rem] border border-white/80 bg-white px-6 py-10 text-sm font-medium text-slate-600 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          Loading dashboard data...
        </div>
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]"
              >
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-3 text-4xl font-bold text-slate-900">{card.value}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Latest Users</h2>
                  <p className="mt-2 text-sm text-slate-500">Recent accounts across both normal users and admins.</p>
                </div>
                <Link to="/admin/users" className="text-sm font-semibold text-rose-600 hover:text-rose-700">
                  View all
                </Link>
              </div>

              <div className="mt-6 space-y-4">
                {latestUsers.length > 0 ? latestUsers.map((entry) => (
                  <div key={entry.id || entry._id} className="rounded-2xl border border-slate-100 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{entry.name}</p>
                        <p className="text-sm text-slate-500">{entry.email}</p>
                      </div>
                      <div className="text-right text-sm text-slate-500">
                        <p className="font-medium capitalize text-slate-700">{entry.role || (entry.isAdmin ? 'admin' : 'user')}</p>
                        <p>{formatDate(entry.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                    No users found yet.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Latest MongoDB Products</h2>
                  <p className="mt-2 text-sm text-slate-500">These are the backend products used in the model and recommendation flow.</p>
                </div>
                <Link to="/admin/products" className="text-sm font-semibold text-rose-600 hover:text-rose-700">
                  View all
                </Link>
              </div>

              <div className="mt-6 space-y-4">
                {latestProducts.length > 0 ? latestProducts.map((product) => (
                  <div key={product._id} className="rounded-2xl border border-slate-100 px-4 py-3">
                    <div className="flex items-center gap-4">
                      <img
                        src={resolveProductImageUrl(product)}
                        alt={product.name}
                        className="h-16 w-16 rounded-2xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{product.name}</p>
                        <p className="text-sm text-slate-500">{product.gender} • LKR {product.price}</p>
                      </div>
                      <p className="text-sm text-slate-500">{formatDate(product.createdAt)}</p>
                    </div>
                  </div>
                )) : (
                  <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                    No MongoDB products found yet.
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
