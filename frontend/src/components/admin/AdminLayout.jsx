import React from 'react';
import AdminSidebar from './AdminSidebar';

const AdminLayout = ({ title, description, actions, children }) => {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#fffaf8_0%,_#ffffff_42%,_#f8fafc_100%)] pb-12 pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">Admin Dashboard</p>
              <h1 className="mt-3 font-display text-4xl font-bold text-slate-900">{title}</h1>
              {description ? (
                <p className="mt-3 max-w-3xl text-base text-slate-500">{description}</p>
              ) : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <AdminSidebar />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
