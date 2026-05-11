'use client';

import { useState } from 'react';
import { Order, OrderStatus, PaymentStatus } from '@/types';
import Modal from '@/components/ui/Modal';
import { ordersApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface OrderStatusModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'out_for_delivery', label: 'Out For Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
  { value: 'partial', label: 'Partial' },
];

export default function OrderStatusModal({ order, open, onClose, onUpdated }: OrderStatusModalProps) {
  const [status, setStatus] = useState<OrderStatus>(order?.status || 'pending');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order?.payment_status || 'unpaid');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync state when order changes
  useState(() => {
    if (order) {
      setStatus(order.status);
      setPaymentStatus(order.payment_status);
    }
  });

  const handleUpdate = async () => {
    if (!order) return;
    setLoading(true);
    try {
      await ordersApi.updateStatus(order.id, { status, payment_status: paymentStatus, notes });
      toast.success('Order updated successfully');
      onUpdated();
      onClose();
    } catch {
      toast.error('Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Update Order #${order.order_id}`}>
      <div className="space-y-4">
        <div>
          <label className="label">Order Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="input"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Payment Status</label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
            className="input"
          >
            {PAYMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input"
            rows={2}
            placeholder="Add a note..."
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleUpdate} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Updating...' : 'Update Order'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
