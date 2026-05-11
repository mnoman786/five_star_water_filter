'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search, RefreshCw, Plus } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { Order, OrderCreateData, PaginatedResponse } from '@/types';
import { useOrderSocket } from '@/hooks/useOrderSocket';
import OrderTable from '@/components/orders/OrderTable';
import OrderStatusModal from '@/components/orders/OrderStatusModal';
import Modal from '@/components/ui/Modal';
import OrderForm from '@/components/orders/OrderForm';
import toast from 'react-hot-toast';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.order_type = typeFilter;
      const res = await ordersApi.list(params);
      const data: PaginatedResponse<Order> = res.data;
      setOrders(data.results);
      setCount(data.count);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useOrderSocket(fetchOrders);

  const handleCreateOrder = async (data: OrderCreateData) => {
    setSubmitting(true);
    try {
      await ordersApi.create(data);
      toast.success('Order created successfully!');
      setNewOrderOpen(false);
      fetchOrders();
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } };
      const msg = Object.values(error?.response?.data || {}).flat()[0] || 'Failed to create order';
      toast.error(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(count / 10);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Orders</h1>
          <p className="text-gray-400 text-sm">{count} total orders</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchOrders} className="btn-secondary flex items-center gap-1.5 text-sm py-2 flex-1 sm:flex-none justify-center">
            <RefreshCw size={15} /> Refresh
          </button>
          <button onClick={() => setNewOrderOpen(true)} className="btn-primary flex items-center gap-2 text-sm flex-1 sm:flex-none justify-center">
            <Plus size={16} /> New Order
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search orders..."
            className="input pl-9"
          />
        </div>
        <div className="flex gap-3">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input flex-1">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="input flex-1">
            <option value="">All Types</option>
            <option value="pickup">Pickup</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>
      </div>

      <OrderTable
        orders={orders}
        loading={loading}
        canUpdateStatus
        onView={(o) => setViewOrder(o)}
        onStatusUpdate={(o) => { setSelectedOrder(o); setStatusModalOpen(true); }}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500 gap-3 flex-wrap">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2 ml-auto">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary py-1.5 text-xs disabled:opacity-40">Previous</button>
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-secondary py-1.5 text-xs disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      <OrderStatusModal
        order={selectedOrder}
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onUpdated={fetchOrders}
      />

      {viewOrder && (
        <Modal open={!!viewOrder} onClose={() => setViewOrder(null)} title={`Order #${viewOrder.order_id}`} size="lg">
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-gray-400 text-xs">Customer</p><p className="font-medium">{viewOrder.customer_name}</p></div>
              <div><p className="text-gray-400 text-xs">Phone</p><p className="font-medium">{viewOrder.phone}</p></div>
              <div><p className="text-gray-400 text-xs">Type</p><p className="font-medium capitalize">{viewOrder.order_type}</p></div>
              <div><p className="text-gray-400 text-xs">Qty</p><p className="font-medium">{viewOrder.quantity} bottles</p></div>
              <div><p className="text-gray-400 text-xs">Total</p><p className="font-semibold text-primary-600">{formatCurrency(viewOrder.total_price)}</p></div>
              <div><p className="text-gray-400 text-xs">Status</p><p className="font-medium capitalize">{viewOrder.status.replace('_', ' ')}</p></div>
              <div><p className="text-gray-400 text-xs">Payment</p><p className="font-medium capitalize">{viewOrder.payment_status?.replace('_', ' ')}</p></div>
            </div>
            {viewOrder.address && <div><p className="text-gray-400 text-xs">Address</p><p className="font-medium">{viewOrder.address}</p></div>}
            {viewOrder.notes && <div><p className="text-gray-400 text-xs">Notes</p><p className="font-medium">{viewOrder.notes}</p></div>}
            <div className="text-xs text-gray-400 pt-2 border-t">Created: {formatDateTime(viewOrder.created_at)}</div>
          </div>
        </Modal>
      )}

      <Modal open={newOrderOpen} onClose={() => setNewOrderOpen(false)} title="Create New Order" size="lg">
        <OrderForm
          onSubmit={handleCreateOrder}
          onCancel={() => setNewOrderOpen(false)}
          isLoading={submitting}
        />
      </Modal>
    </div>
  );
}
