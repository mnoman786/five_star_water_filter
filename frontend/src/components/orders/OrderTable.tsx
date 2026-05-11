'use client';

import { Order } from '@/types';
import {
  formatCurrency, formatDateTime, getStatusColor,
  getPaymentStatusColor, getOrderTypeColor
} from '@/lib/utils';
import { Eye, Edit2, Trash2, XCircle } from 'lucide-react';

interface OrderTableProps {
  orders: Order[];
  loading?: boolean;
  showActions?: boolean;
  canUpdateStatus?: boolean;
  canCancel?: boolean;
  onView?: (order: Order) => void;
  onEdit?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  onCancel?: (order: Order) => void;
  onStatusUpdate?: (order: Order) => void;
}

function ActionButtons({
  order, onView, onEdit, onCancel, onDelete, canCancel,
}: Pick<OrderTableProps, 'onView' | 'onEdit' | 'onCancel' | 'onDelete' | 'canCancel'> & { order: Order }) {
  return (
    <div className="flex items-center gap-1">
      {onView && (
        <button onClick={() => onView(order)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="View">
          <Eye size={15} />
        </button>
      )}
      {onEdit && (
        <button onClick={() => onEdit(order)} className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 transition-colors" title="Edit">
          <Edit2 size={15} />
        </button>
      )}
      {canCancel && order.status === 'pending' && onCancel && (
        <button onClick={() => onCancel(order)} className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-600 transition-colors" title="Cancel">
          <XCircle size={15} />
        </button>
      )}
      {onDelete && (
        <button onClick={() => onDelete(order)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Delete">
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}

export default function OrderTable({
  orders, loading, showActions = true, canUpdateStatus, canCancel,
  onView, onEdit, onDelete, onCancel, onStatusUpdate,
}: OrderTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-sm mt-3">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="text-center py-12 text-gray-400">
          <p className="text-base font-medium">No orders found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

      {/* ── Desktop table (sm+) ── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-100">
            <tr>
              <th className="table-header text-left">Order</th>
              <th className="table-header text-left">Customer</th>
              <th className="table-header text-left">Type</th>
              <th className="table-header text-left">Qty</th>
              <th className="table-header text-left">Amount</th>
              <th className="table-header text-left">Status</th>
              <th className="table-header text-left">Payment</th>
              <th className="table-header text-left">Date</th>
              {showActions && <th className="table-header text-center">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="table-cell">
                  <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{order.order_id}</span>
                </td>
                <td className="table-cell">
                  <p className="font-medium text-gray-800 text-sm">{order.customer_name}</p>
                  <p className="text-xs text-gray-400">{order.phone}</p>
                </td>
                <td className="table-cell">
                  <span className={`badge ${getOrderTypeColor(order.order_type)}`}>{order.order_type_display || order.order_type}</span>
                </td>
                <td className="table-cell text-center font-medium">{order.quantity}</td>
                <td className="table-cell">
                  <span className="font-semibold text-gray-800">{formatCurrency(order.total_price)}</span>
                </td>
                <td className="table-cell">
                  <span
                    className={`badge cursor-pointer ${getStatusColor(order.status)}`}
                    onClick={() => canUpdateStatus && onStatusUpdate?.(order)}
                    title={canUpdateStatus ? 'Click to update status' : undefined}
                  >
                    {order.status_display || order.status}
                  </span>
                </td>
                <td className="table-cell">
                  <span className={`badge ${getPaymentStatusColor(order.payment_status)}`}>{order.payment_status_display || order.payment_status}</span>
                </td>
                <td className="table-cell text-xs text-gray-400">{formatDateTime(order.created_at)}</td>
                {showActions && (
                  <td className="table-cell">
                    <div className="flex items-center justify-center">
                      <ActionButtons order={order} onView={onView} onEdit={onEdit} onCancel={onCancel} onDelete={onDelete} canCancel={canCancel} />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards (< sm) ── */}
      <div className="sm:hidden divide-y divide-gray-100">
        {orders.map((order) => (
          <div key={order.id} className="p-4 space-y-3">
            {/* Top row: order id + actions */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{order.order_id}</span>
                <p className="font-semibold text-gray-800 mt-1">{order.customer_name}</p>
                <p className="text-xs text-gray-400">{order.phone}</p>
              </div>
              {showActions && (
                <ActionButtons order={order} onView={onView} onEdit={onEdit} onCancel={onCancel} onDelete={onDelete} canCancel={canCancel} />
              )}
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap gap-1.5">
              <span className={`badge ${getOrderTypeColor(order.order_type)}`}>{order.order_type_display || order.order_type}</span>
              <span
                className={`badge ${getStatusColor(order.status)} ${canUpdateStatus ? 'cursor-pointer' : ''}`}
                onClick={() => canUpdateStatus && onStatusUpdate?.(order)}
              >
                {order.status_display || order.status}
              </span>
              <span className={`badge ${getPaymentStatusColor(order.payment_status)}`}>{order.payment_status_display || order.payment_status}</span>
            </div>

            {/* Details row */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{order.quantity} bottle{order.quantity !== 1 ? 's' : ''}</span>
              <span className="font-bold text-gray-800">{formatCurrency(order.total_price)}</span>
              <span className="text-xs text-gray-400">{formatDateTime(order.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
