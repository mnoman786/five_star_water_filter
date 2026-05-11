'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search, Filter, Download, Plus, RefreshCw } from 'lucide-react';
import { ordersApi, dashboardApi } from '@/lib/api';
import { Order, OrderCreateData, PaginatedResponse } from '@/types';
import { useOrderSocket } from '@/hooks/useOrderSocket';
import OrderTable from '@/components/orders/OrderTable';
import OrderStatusModal from '@/components/orders/OrderStatusModal';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import OrderForm from '@/components/orders/OrderForm';
import toast from 'react-hot-toast';

export default function SuperAdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.order_type = typeFilter;
      if (paymentFilter) params.payment_status = paymentFilter;
      const res = await ordersApi.list(params);

      const data: PaginatedResponse<Order> = res.data;
      setOrders(data.results);
      setCount(data.count);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter, paymentFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useOrderSocket(fetchOrders);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await ordersApi.delete(deleteTarget.id);
      toast.success('Order deleted');
      setDeleteTarget(null);
      fetchOrders();
    } catch {
      toast.error('Failed to delete order');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await dashboardApi.exportReport();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'orders_report.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">All Orders</h1>
          <p className="text-gray-400 text-sm">{count} total orders</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={fetchOrders} className="btn-secondary flex items-center gap-1.5 text-sm py-2 flex-1 sm:flex-none justify-center">
            <RefreshCw size={15} /> Refresh
          </button>
          <button onClick={handleExport} disabled={exporting} className="btn-secondary flex items-center gap-1.5 text-sm py-2 flex-1 sm:flex-none justify-center">
            <Download size={15} /> {exporting ? 'Exporting...' : 'Export'}
          </button>
          <button onClick={() => setNewOrderOpen(true)} className="btn-primary flex items-center gap-2 text-sm flex-1 sm:flex-none justify-center">
            <Plus size={16} /> New Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search orders, customers..."
              className="input pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input sm:w-40"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="input sm:w-36"
          >
            <option value="">All Types</option>
            <option value="pickup">Pickup</option>
            <option value="delivery">Delivery</option>
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
            className="input sm:w-36"
          >
            <option value="">All Payments</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <OrderTable
        orders={orders}
        loading={loading}
        canUpdateStatus
        onView={(o) => setViewOrder(o)}
        onDelete={(o) => setDeleteTarget(o)}
        onStatusUpdate={(o) => { setSelectedOrder(o); setStatusModalOpen(true); }}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 flex-wrap text-sm text-gray-500">
          <span>Page {page} of {totalPages} ({count} total)</span>
          <div className="flex gap-2 ml-auto">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary py-1.5 text-xs disabled:opacity-40">Previous</button>
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-secondary py-1.5 text-xs disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      <OrderStatusModal
        order={selectedOrder}
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onUpdated={fetchOrders}
      />

      {/* View Order Modal */}
      {viewOrder && (
        <Modal open={!!viewOrder} onClose={() => setViewOrder(null)} title={`Order #${viewOrder.order_id}`} size="lg">
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-gray-400 text-xs">Customer</p><p className="font-medium">{viewOrder.customer_name}</p></div>
              <div><p className="text-gray-400 text-xs">Phone</p><p className="font-medium">{viewOrder.phone}</p></div>
              <div><p className="text-gray-400 text-xs">Order Type</p><p className="font-medium capitalize">{viewOrder.order_type}</p></div>
              <div><p className="text-gray-400 text-xs">Quantity</p><p className="font-medium">{viewOrder.quantity} bottles</p></div>
              <div><p className="text-gray-400 text-xs">Unit Price</p><p className="font-medium">Rs. {viewOrder.unit_price}</p></div>
              <div><p className="text-gray-400 text-xs">Delivery Charge</p><p className="font-medium">Rs. {viewOrder.delivery_charge}</p></div>
              <div><p className="text-gray-400 text-xs">Total Price</p><p className="font-semibold text-primary-600">Rs. {viewOrder.total_price}</p></div>
              <div><p className="text-gray-400 text-xs">Status</p><p className="font-medium capitalize">{viewOrder.status.replace('_', ' ')}</p></div>
              <div><p className="text-gray-400 text-xs">Payment</p><p className="font-medium capitalize">{viewOrder.payment_status}</p></div>
            </div>
            {viewOrder.address && (
              <div><p className="text-gray-400 text-xs">Address</p><p className="font-medium">{viewOrder.address}</p></div>
            )}
            {viewOrder.notes && (
              <div><p className="text-gray-400 text-xs">Notes</p><p className="font-medium">{viewOrder.notes}</p></div>
            )}
          </div>
        </Modal>
      )}

      {/* New Order Modal */}
      <Modal open={newOrderOpen} onClose={() => setNewOrderOpen(false)} title="Create New Order" size="lg">
        <OrderForm
          onSubmit={handleCreateOrder}
          onCancel={() => setNewOrderOpen(false)}
          isLoading={submitting}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        variant="danger"
        title="Delete this order?"
        message={`Order #${deleteTarget?.order_id} will be permanently deleted and cannot be recovered.`}
        confirmLabel="Yes, delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
