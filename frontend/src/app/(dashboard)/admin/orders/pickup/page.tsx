'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { Order, PaginatedResponse } from '@/types';
import OrderTable from '@/components/orders/OrderTable';
import OrderStatusModal from '@/components/orders/OrderStatusModal';
import { useOrderSocket } from '@/hooks/useOrderSocket';
import toast from 'react-hot-toast';

export default function PickupOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, order_type: 'pickup' };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await ordersApi.list(params);
      const data: PaginatedResponse<Order> = res.data;
      setOrders(data.results);
      setCount(data.count);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useOrderSocket(fetchOrders);

  const totalPages = Math.ceil(count / 10);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Pickup Orders</h1>
          <p className="text-gray-400 text-sm">{count} pickup orders</p>
        </div>
        <button onClick={fetchOrders} className="btn-secondary flex items-center justify-center gap-1.5 text-sm py-2 sm:w-auto">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search orders..." className="input pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <OrderTable
        orders={orders}
        loading={loading}
        canUpdateStatus
        onStatusUpdate={(o) => { setSelectedOrder(o); setStatusModalOpen(true); }}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 flex-wrap text-sm text-gray-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2 ml-auto">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary py-1.5 text-xs disabled:opacity-40">Previous</button>
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-secondary py-1.5 text-xs disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      <OrderStatusModal order={selectedOrder} open={statusModalOpen} onClose={() => setStatusModalOpen(false)} onUpdated={fetchOrders} />
    </div>
  );
}
