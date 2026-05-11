'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart, Clock, CheckCircle, Package, Truck, ArrowUpRight } from 'lucide-react';
import { dashboardApi } from '@/lib/api';
import { AdminDashboardStats } from '@/types';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentOrders from '@/components/dashboard/RecentOrders';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    dashboardApi.admin()
      .then((res) => setStats(res.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" /><div className="h-7 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-0.5">Welcome back, {user?.full_name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Today's Orders" value={stats.today_orders} icon={ShoppingCart} color="blue" />
        <StatsCard title="Total Orders" value={stats.total_orders} icon={ShoppingCart} color="indigo" />
        <StatsCard title="Pending" value={stats.pending_orders} icon={Clock} color="yellow" />
        <StatsCard title="Delivered" value={stats.delivered_orders} icon={CheckCircle} color="green" />
        <StatsCard title="Out For Delivery" value={stats.out_for_delivery} icon={Truck} color="purple" />
        <StatsCard title="Pickup Orders" value={stats.pickup_orders} icon={Package} color="cyan" />
        <StatsCard title="Delivery Orders" value={stats.delivery_orders} icon={Truck} color="orange" />
      </div>

      <RecentOrders
        orders={stats.recent_orders as unknown as import('@/types').Order[]}
        viewAllHref="/admin/orders"
      />
    </div>
  );
}
