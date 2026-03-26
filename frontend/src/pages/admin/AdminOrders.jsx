import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import { orderApi } from '../../utils/orderApi';
import { resolveProductImageUrl } from '../../utils/runtimeConfig';

const statusOptions = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleString();
}

function formatCurrency(amount = 0, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: String(currency || 'usd').toUpperCase(),
  }).format((Number(amount) || 0) / 100);
}

function formatStatusLabel(value = '') {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return 'N/A';
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getOrderStatusClasses(status) {
  switch (status) {
    case 'delivered':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'shipped':
      return 'border-sky-200 bg-sky-50 text-sky-700';
    case 'processing':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'cancelled':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
}

const AdminOrders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [savingOrderId, setSavingOrderId] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);

      try {
        const response = await orderApi.getAllOrders(token);
        const nextOrders = Array.isArray(response.orders) ? response.orders : [];

        setOrders(nextOrders);
        setDrafts(
          nextOrders.reduce((accumulator, order) => {
            const orderId = order.id || order._id;
            accumulator[orderId] = {
              orderStatus: order.orderStatus || 'placed',
              trackingNumber: order.trackingNumber || '',
            };
            return accumulator;
          }, {})
        );
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadOrders();
    }
  }, [token]);

  const filteredOrders = useMemo(() => {
    if (filterStatus === 'all') {
      return orders;
    }

    return orders.filter((order) => order.orderStatus === filterStatus);
  }, [filterStatus, orders]);

  const handleDraftChange = (orderId, field, value) => {
    setDrafts((current) => ({
      ...current,
      [orderId]: {
        ...current[orderId],
        [field]: value,
      },
    }));
  };

  const handleSave = async (orderId) => {
    const draft = drafts[orderId];
    if (!draft) {
      return;
    }

    setSavingOrderId(orderId);

    try {
      const response = await orderApi.updateOrderStatus(
        orderId,
        {
          orderStatus: draft.orderStatus,
          trackingNumber: draft.trackingNumber,
        },
        token
      );

      const nextOrder = response.order;

      setOrders((current) =>
        current.map((order) => ((order.id || order._id) === orderId ? nextOrder : order))
      );
      setDrafts((current) => ({
        ...current,
        [orderId]: {
          orderStatus: nextOrder.orderStatus || 'placed',
          trackingNumber: nextOrder.trackingNumber || '',
        },
      }));
      toast.success(response.message || 'Order updated successfully.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingOrderId('');
    }
  };

  return (
    <AdminLayout
      title="Orders"
      description="Review all placed orders, see customer and item details, and update tracking or progress from one admin panel."
      actions={(
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100 sm:w-56"
          >
            <option value="all">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {formatStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>
      )}
    >
      <div className="space-y-5">
        {loading ? (
          <div className="rounded-[2rem] border border-white/80 bg-white px-6 py-10 text-sm font-medium text-slate-600 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            Loading orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white px-6 py-10 text-sm text-slate-500 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            No orders match the current filter.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const orderId = order.id || order._id;
            const draft = drafts[orderId] || {
              orderStatus: order.orderStatus || 'placed',
              trackingNumber: order.trackingNumber || '',
            };

            return (
              <section
                key={orderId}
                className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-500">
                      Order #{String(orderId).slice(-8).toUpperCase()}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                      {order.user?.name || 'Unknown customer'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">{order.user?.email || 'No email available'}</p>
                    <p className="mt-2 text-sm text-slate-500">Placed: {formatDate(order.placedAt || order.createdAt)}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <span className={`rounded-full border px-4 py-2 text-sm font-medium ${getOrderStatusClasses(order.orderStatus)}`}>
                      {formatStatusLabel(order.orderStatus)}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                      Payment: {formatStatusLabel(order.paymentStatus)}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                      Total: {formatCurrency(order.totalAmount, order.currency)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tracking</p>
                    <p className="mt-2 text-sm font-medium text-slate-700">{order.trackingNumber || 'Not assigned yet'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Items</p>
                    <p className="mt-2 text-sm font-medium text-slate-700">{order.items?.length || 0}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Shipped</p>
                    <p className="mt-2 text-sm font-medium text-slate-700">{formatDate(order.shippedAt)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Delivered</p>
                    <p className="mt-2 text-sm font-medium text-slate-700">{formatDate(order.deliveredAt)}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
                  <div>
                    <label htmlFor={`status-${orderId}`} className="mb-2 block text-sm font-semibold text-slate-700">
                      Order Status
                    </label>
                    <select
                      id={`status-${orderId}`}
                      value={draft.orderStatus}
                      onChange={(event) => handleDraftChange(orderId, 'orderStatus', event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {formatStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor={`tracking-${orderId}`} className="mb-2 block text-sm font-semibold text-slate-700">
                      Tracking Number
                    </label>
                    <input
                      id={`tracking-${orderId}`}
                      type="text"
                      value={draft.trackingNumber}
                      onChange={(event) => handleDraftChange(orderId, 'trackingNumber', event.target.value)}
                      placeholder="Add or update tracking"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => handleSave(orderId)}
                      disabled={savingOrderId === orderId}
                      className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingOrderId === orderId ? 'Saving...' : 'Save Order'}
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {order.items?.map((item, index) => (
                    <div
                      key={`${orderId}-${item.name}-${index}`}
                      className="grid gap-4 rounded-[1.5rem] border border-slate-100 bg-white p-4 lg:grid-cols-[84px_minmax(0,1fr)_180px]"
                    >
                      <div className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-50">
                        {item.image?.url || item.image ? (
                          <img
                            src={resolveProductImageUrl({ image: item.image })}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-slate-400">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-base font-semibold text-slate-900">{item.name}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-600">
                          <span className="rounded-full bg-slate-50 px-3 py-1">Qty: {item.quantity}</span>
                          <span className="rounded-full bg-slate-50 px-3 py-1">Size: {item.size || 'N/A'}</span>
                          <span className="rounded-full bg-slate-50 px-3 py-1">Color: {item.color || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="text-left lg:text-right">
                        <p className="text-sm text-slate-500">Unit Price</p>
                        <p className="text-base font-semibold text-slate-900">{formatCurrency(item.price, order.currency)}</p>
                        <p className="mt-2 text-sm text-slate-500">Line Total</p>
                        <p className="text-base font-semibold text-rose-600">
                          {formatCurrency(item.price * item.quantity, order.currency)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
