'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign, ShoppingCart, Clock, CheckCircle,
  Package, Truck, Users, UserCheck, TrendingUp, Activity
} from 'lucide-react';
import { dashboardApi } from '@/lib/api';
import { DashboardStats } from '@/types';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentOrders from '@/components/dashboard/RecentOrders';
import { formatCurrency, timeAgo } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.superAdmin()
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Welcome back, Super Admin</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="h-7 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { title: "Today's Earnings", value: formatCurrency(stats.today_earnings), icon: DollarSign, color: 'green' as const, subtitle: 'From paid orders today' },
    { title: 'Total Earnings', value: formatCurrency(stats.total_earnings), icon: TrendingUp, color: 'blue' as const, subtitle: 'All time earnings' },
    { title: 'Total Orders', value: stats.total_orders, icon: ShoppingCart, color: 'indigo' as const },
    { title: 'Pending Orders', value: stats.pending_orders, icon: Clock, color: 'yellow' as const },
    { title: 'Delivered Orders', value: stats.delivered_orders, icon: CheckCircle, color: 'green' as const },
    { title: 'Pickup Orders', value: stats.pickup_orders, icon: Package, color: 'purple' as const },
    { title: 'Delivery Orders', value: stats.delivery_orders, icon: Truck, color: 'cyan' as const },
    { title: 'Total Customers', value: stats.total_customers, icon: Users, color: 'orange' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Fiver Star Water Filter Plant overview</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-700">
            {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.monthly_data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Earnings']}
                contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#earningsGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Monthly Orders</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.monthly_data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="xl:col-span-2">
          <RecentOrders
            orders={stats.recent_orders as unknown as import('@/types').Order[]}
            viewAllHref="/super-admin/orders"
          />
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <Activity size={18} className="text-primary-600" />
            <h3 className="font-semibold text-gray-800">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recent_activities.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">No recent activity</p>
            ) : (
              stats.recent_activities.slice(0, 8).map((activity) => (
                <div key={activity.id} className="px-5 py-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary-600 font-semibold text-xs">
                        {activity.user?.charAt(0).toUpperCase() || 'S'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-700 leading-snug">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(activity.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
