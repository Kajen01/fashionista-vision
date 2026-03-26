import React from 'react';

const AuthLayout = ({ eyebrow, title, description, children, footer }) => {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#fffaf8_0%,_#ffffff_45%,_#f8fafc_100%)] pt-24 pb-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <section className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">{eyebrow}</p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            {description}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-rose-100 bg-white/90 px-5 py-4 shadow-sm shadow-rose-100/60">
              <p className="text-sm font-semibold text-slate-900">Guest-friendly browsing</p>
              <p className="mt-2 text-sm text-slate-500">Home and About stay open so users can explore before signing in.</p>
            </div>
            <div className="rounded-[1.5rem] border border-rose-100 bg-white/90 px-5 py-4 shadow-sm shadow-rose-100/60">
              <p className="text-sm font-semibold text-slate-900">Protected shopping tools</p>
              <p className="mt-2 text-sm text-slate-500">Cart, profile, and AI try-on features are now reserved for signed-in users.</p>
            </div>
          </div>
        </section>

        <section className="w-full max-w-xl rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8">
          {children}
          {footer ? <div className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-500">{footer}</div> : null}
        </section>
      </div>
    </div>
  );
};

export default AuthLayout;
