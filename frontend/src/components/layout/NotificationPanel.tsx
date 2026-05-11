'use client';

import { useRef, useEffect, useState } from 'react';
import { Bell, X, CheckCheck, Package, ShoppingCart, ChevronRight } from 'lucide-react';
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

function OrderPreview({ n, onClose }: { n: AppNotification; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 text-gray-400"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            n.event === 'new_order' ? 'bg-blue-100' : 'bg-amber-100'
          }`}>
            {n.event === 'new_order'
              ? <ShoppingCart size={20} className="text-blue-600" />
              : <Package size={20} className="text-amber-600" />
            }
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">
              {n.event === 'new_order' ? 'New Order' : 'Order Updated'}
            </p>
            <p className="text-xs text-gray-400">{timeAgo(n.timestamp)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <Row label="Order ID" value={`#${n.order_id}`} />
          <Row label="Customer" value={n.customer} />
          {n.phone && <Row label="Phone" value={n.phone} />}
          {n.order_type && (
            <Row label="Type" value={<span className="capitalize">{n.order_type}</span>} />
          )}
          {n.quantity != null && <Row label="Quantity" value={`${n.quantity} bottle(s)`} />}
          {n.total && <Row label="Total" value={`Rs. ${n.total}`} />}
          {n.status && (
            <Row
              label="Status"
              value={
                <span className="capitalize px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                  {n.status.replace(/_/g, ' ')}
                </span>
              }
            />
          )}
          {n.payment_status && (
            <Row
              label="Payment"
              value={
                <span className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium ${
                  n.payment_status === 'paid'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-600'
                }`}>
                  {n.payment_status}
                </span>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className="text-sm text-gray-700 font-medium text-right">{value}</span>
    </div>
  );
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<AppNotification | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clear = useNotificationStore((s) => s.clear);
  const unreadCount = useNotificationStore((s) => s.unreadCount());

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleItemClick(n: AppNotification) {
    markRead(n.id);
    setPreview(n);
  }

  return (
    <>
      <div className="relative" ref={panelRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 relative"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-full sm:mt-2 sm:w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-30 overflow-hidden flex flex-col max-h-[75dvh] sm:max-h-[480px]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800 text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-red-100 text-red-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 px-2 py-1 rounded-lg hover:bg-primary-50"
                    title="Mark all read"
                  >
                    <CheckCheck size={13} />
                    All read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clear}
                    className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                  <Bell size={28} className="opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                      !n.read ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      n.event === 'new_order' ? 'bg-blue-100' : 'bg-amber-100'
                    }`}>
                      {n.event === 'new_order'
                        ? <ShoppingCart size={15} className="text-blue-600" />
                        : <Package size={15} className="text-amber-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 leading-tight truncate">
                        {n.event === 'new_order'
                          ? `New order — ${n.customer}`
                          : `Updated — ${n.customer}`
                        }
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {n.event === 'new_order'
                          ? `${n.quantity} bottle(s) · Rs. ${n.total}`
                          : `Status: ${(n.status ?? '').replace(/_/g, ' ')}`
                        }
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{timeAgo(n.timestamp)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 mt-1">
                      {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                      <ChevronRight size={14} className="text-gray-300" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {preview && (
        <OrderPreview n={preview} onClose={() => setPreview(null)} />
      )}
    </>
  );
}
