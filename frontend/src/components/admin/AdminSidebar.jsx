import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const sidebarItems = [
  { path: '/admin', label: 'Dashboard' },
  { path: '/admin/users', label: 'Users' },
  { path: '/admin/orders', label: 'Orders' },
  { path: '/admin/products', label: 'Products' },
];

const AdminSidebar = () => {
  return (
    <aside className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-100 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">Admin Panel</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">Control Center</h2>
        <p className="mt-2 text-sm text-slate-500">
          Manage users, orders, and the MongoDB product collection from one protected space.
        </p>
      </div>

      <nav className="mt-5 space-y-2">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) => `block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              isActive
                ? 'bg-rose-100 text-rose-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <Link
          to="/"
          className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-600"
        >
          Back to site
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
