'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart, Clock, CheckCircle, XCircle, Plus, ArrowRight } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { Order, PaginatedResponse } from '@/types';
import StatsCard from '@/components/dashboard/StatsCard';
import { formatCurrency, formatDate, getStatusColor, getOrderTypeColor } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function UserDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    ordersApi.list({ page: 1 })
      .then((res) => {
        const data: PaginatedResponse<Order> = res.data;
        setOrders(data.results);
      })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  const pending = orders.filter((o) => o.status === 'pending').length;
  const delivered = orders.filter((o) => o.status === 'delivered').length;
  const cancelled = orders.filter((o) => o.status === 'cancelled').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-40 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
        <div className="absolute right-10 bottom-0 w-24 h-24 bg-white/5 rounded-full translate-y-8" />
        <div className="relative">
          <h1 className="text-xl font-bold">Welcome, {user?.full_name?.split(' ')[0]}! 👋</h1>
          <p className="text-primary-100 mt-1 text-sm">Manage your water delivery orders here</p>
          <Link
            href="/user/orders/new"
            className="inline-flex items-center gap-2 mt-4 bg-white text-primary-700 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-primary-50 transition-colors"
          >
            <Plus size={16} /> Place New Order
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Orders" value={orders.length} icon={ShoppingCart} color="indigo" />
        <StatsCard title="Pending" value={pending} icon={Clock} color="yellow" />
        <StatsCard title="Delivered" value={delivered} icon={CheckCircle} color="green" />
        <StatsCard title="Cancelled" value={cancelled} icon={XCircle} color="red" />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">My Recent Orders</h2>
          <Link href="/user/orders" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-7 h-7 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <ShoppingCart size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 font-medium">No orders yet</p>
            <p className="text-gray-300 text-sm mt-1">Place your first order to get started</p>
            <Link href="/user/orders/new" className="btn-primary inline-flex mt-4 text-sm">
              Place Order
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-50">
                  <tr>
                    <th className="table-header text-left">Order</th>
                    <th className="table-header text-left">Type</th>
                    <th className="table-header text-left">Qty</th>
                    <th className="table-header text-left">Amount</th>
                    <th className="table-header text-left">Status</th>
                    <th className="table-header text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 8).map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="table-cell font-mono text-xs text-gray-500">{order.order_id}</td>
                      <td className="table-cell">
                        <span className={`badge ${getOrderTypeColor(order.order_type)}`}>{order.order_type}</span>
                      </td>
                      <td className="table-cell text-center">{order.quantity}</td>
                      <td className="table-cell font-medium">{formatCurrency(order.total_price)}</td>
                      <td className="table-cell">
                        <span className={`badge ${getStatusColor(order.status)}`}>{order.status_display || order.status}</span>
                      </td>
                      <td className="table-cell text-xs text-gray-400">{formatDate(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-100">
              {orders.slice(0, 8).map((order) => (
                <div key={order.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs text-gray-400">{order.order_id}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge ${getOrderTypeColor(order.order_type)}`}>{order.order_type}</span>
                        <span className="text-xs text-gray-500">{order.quantity} bottle{order.quantity !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">{formatCurrency(order.total_price)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <span className={`badge ${getStatusColor(order.status)}`}>{order.status_display || order.status}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
