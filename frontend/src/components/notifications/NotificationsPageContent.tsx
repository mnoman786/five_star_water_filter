'use client';

import { useState } from 'react';
import { Bell, CheckCheck, Trash2, ShoppingCart, Package, ChevronRight, X, Filter } from 'lucide-react';
import { useNotificationStore, AppNotification } from '@/store/useNotificationStore';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-PK', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function OrderPreviewModal({ n, onClose }: { n: AppNotification; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className={`px-6 py-4 flex items-center gap-3 ${
          n.event === 'new_order' ? 'bg-blue-50' : 'bg-amber-50'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            n.event === 'new_order' ? 'bg-blue-100' : 'bg-amber-100'
          }`}>
            {n.event === 'new_order'
              ? <ShoppingCart size={20} className="text-blue-600" />
              : <Package size={20} className="text-amber-600" />
            }
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800">
              {n.event === 'new_order' ? 'New Order Received' : 'Order Status Updated'}
            </p>
            <p className="text-xs text-gray-500">{formatDate(n.timestamp)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/60 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Details */}
        <div className="px-6 py-5 space-y-3">
          <DetailRow label="Order ID" value={`#${n.order_id}`} mono />
          <DetailRow label="Customer" value={n.customer} />
          {n.phone && <DetailRow label="Phone" value={n.phone} />}
          {n.order_type && (
            <DetailRow
              label="Order Type"
              value={
                <span className="capitalize px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                  {n.order_type}
                </span>
              }
            />
          )}
          {n.quantity != null && <DetailRow label="Quantity" value={`${n.quantity} bottle(s)`} />}
          {n.total && <DetailRow label="Total Amount" value={`Rs. ${n.total}`} bold />}
          {n.status && (
            <DetailRow
              label="Status"
              value={
                <span className="capitalize px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                  {n.status.replace(/_/g, ' ')}
                </span>
              }
            />
          )}
          {n.payment_status && (
            <DetailRow
              label="Payment"
              value={
                <span className={`capitalize px-2 py-0.5 rounded-full text-xs font-semibold ${
                  n.payment_status === 'paid'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-600'
                }`}>
                  {n.payment_status}
                </span>
              }
            />
          )}
          <DetailRow
            label="Received"
            value={<span className="text-gray-400">{timeAgo(n.timestamp)}</span>}
          />
        </div>

        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label, value, mono, bold,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 shrink-0 w-28">{label}</span>
      <span className={`text-sm text-right ${mono ? 'font-mono' : ''} ${bold ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
        {value}
      </span>
    </div>
  );
}

type FilterType = 'all' | 'unread' | 'new_order' | 'order_updated';

export default function NotificationsPageContent() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [preview, setPreview] = useState<AppNotification | null>(null);

  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clear = useNotificationStore((s) => s.clear);
  const unreadCount = useNotificationStore((s) => s.unreadCount());

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'new_order') return n.event === 'new_order';
    if (filter === 'order_updated') return n.event === 'order_updated';
    return true;
  });

  function handleClick(n: AppNotification) {
    markRead(n.id);
    setPreview(n);
  }

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
    { key: 'new_order', label: 'New Orders' },
    { key: 'order_updated', label: 'Updates' },
  ];

  return (
    <>
      <div className="p-4 sm:p-6 space-y-5 max-w-3xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Notifications</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {notifications.length} total · {unreadCount} unread
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
              >
                <CheckCheck size={15} />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clear}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                <Trash2 size={15} />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-gray-400 shrink-0" />
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === f.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notification list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <Bell size={40} className="opacity-20" />
            <p className="text-sm font-medium">No notifications</p>
            <p className="text-xs">
              {filter !== 'all' ? 'Try a different filter' : 'New order alerts will appear here'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
            {filtered.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${
                  !n.read ? 'bg-blue-50/30' : ''
                }`}
              >
                {/* Icon */}
                <div className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  n.event === 'new_order' ? 'bg-blue-100' : 'bg-amber-100'
                }`}>
                  {n.event === 'new_order'
                    ? <ShoppingCart size={18} className="text-blue-600" />
                    : <Package size={18} className="text-amber-600" />
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {n.event === 'new_order'
                        ? `New order from ${n.customer}`
                        : `Order #${n.order_id} updated`
                      }
                    </p>
                    <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(n.timestamp)}</span>
                  </div>

                  <p className="text-xs text-gray-500 mt-1">
                    {n.event === 'new_order'
                      ? `${n.quantity} bottle(s) · Rs. ${n.total} · ${n.order_type ?? ''}`
                      : `Status: ${(n.status ?? '').replace(/_/g, ' ')} · Payment: ${n.payment_status ?? '—'}`
                    }
                  </p>

                  <p className="text-[11px] text-gray-400 mt-1">{formatDate(n.timestamp)}</p>
                </div>

                {/* Right side */}
                <div className="flex flex-col items-center gap-1.5 shrink-0 mt-1">
                  {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                  <ChevronRight size={15} className="text-gray-300" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {preview && (
        <OrderPreviewModal n={preview} onClose={() => setPreview(null)} />
      )}
    </>
  );
}
