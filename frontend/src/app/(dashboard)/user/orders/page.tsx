'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { Order, OrderCreateData, PaginatedResponse } from '@/types';
import { useOrderSocket } from '@/hooks/useOrderSocket';
import OrderTable from '@/components/orders/OrderTable';
import OrderForm from '@/components/orders/OrderForm';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
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

  const handleCreateOrder = async (data: OrderCreateData) => {
    setSubmitting(true);
    try {
      await ordersApi.create({
        ...data,
        customer_name: data.customer_name || user?.full_name || '',
        phone: data.phone || user?.phone || '',
      });
      toast.success('Order placed successfully!');
      setNewOrderOpen(false);
      fetchOrders();
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } };
      const msg = Object.values(error?.response?.data || {}).flat()[0] || 'Failed to place order';
      toast.error(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await ordersApi.cancel(cancelTarget.id);
      toast.success('Order cancelled');
      setCancelTarget(null);
      fetchOrders();
    } catch {
      toast.error('Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const totalPages = Math.ceil(count / 10);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">My Orders</h1>
          <p className="text-gray-400 text-sm">{count} total orders</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchOrders} className="btn-secondary flex items-center gap-1.5 text-sm py-2 flex-1 sm:flex-none justify-center"><RefreshCw size={15} /> Refresh</button>
          <button onClick={() => setNewOrderOpen(true)} className="btn-primary flex items-center gap-2 text-sm flex-1 sm:flex-none justify-center">
            <Plus size={16} /> New Order
          </button>
        </div>
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
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <OrderTable
        orders={orders}
        loading={loading}
        canCancel
        onCancel={(o) => setCancelTarget(o)}
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

      <ConfirmDialog
        open={!!cancelTarget}
        variant="warning"
        title="Cancel this order?"
        message={`Order #${cancelTarget?.order_id} will be cancelled. This action cannot be undone.`}
        confirmLabel="Yes, cancel order"
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />

      <Modal open={newOrderOpen} onClose={() => setNewOrderOpen(false)} title="Place New Order" size="lg">
        <OrderForm
          defaultValues={{
            customer_name: user?.full_name || '',
            phone: user?.phone || '',
            address: user?.address || '',
          }}
          onSubmit={handleCreateOrder}
          onCancel={() => setNewOrderOpen(false)}
          isLoading={submitting}
        />
      </Modal>
    </div>
  );
}
