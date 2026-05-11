import { Order } from '@/types';
import { formatCurrency, formatDateTime, getStatusColor, getOrderTypeColor } from '@/lib/utils';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface RecentOrdersProps {
  orders: Order[];
  viewAllHref: string;
}

export default function RecentOrders({ orders, viewAllHref }: RecentOrdersProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">Recent Orders</h3>
        <Link href={viewAllHref} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
          View All <ArrowRight size={14} />
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-center py-8 text-gray-400 text-sm">No orders yet</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="table-header text-left">Order ID</th>
                  <th className="table-header text-left">Customer</th>
                  <th className="table-header text-left">Type</th>
                  <th className="table-header text-left">Amount</th>
                  <th className="table-header text-left">Status</th>
                  <th className="table-header text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="table-cell"><span className="font-mono text-xs text-gray-500">{order.order_id}</span></td>
                    <td className="table-cell">
                      <p className="font-medium text-gray-800">{order.customer_name}</p>
                      <p className="text-xs text-gray-400">{order.phone}</p>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getOrderTypeColor(order.order_type)}`}>{order.order_type_display || order.order_type}</span>
                    </td>
                    <td className="table-cell font-medium">{formatCurrency(order.total_price)}</td>
                    <td className="table-cell">
                      <span className={`badge ${getStatusColor(order.status)}`}>{order.status_display || order.status}</span>
                    </td>
                    <td className="table-cell text-gray-400 text-xs">{formatDateTime(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-gray-100">
            {orders.map((order) => (
              <div key={order.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs text-gray-400">{order.order_id}</span>
                    <p className="font-semibold text-gray-800 text-sm mt-0.5">{order.customer_name}</p>
                  </div>
                  <span className="font-bold text-gray-800 text-sm shrink-0">{formatCurrency(order.total_price)}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`badge ${getOrderTypeColor(order.order_type)}`}>{order.order_type_display || order.order_type}</span>
                  <span className={`badge ${getStatusColor(order.status)}`}>{order.status_display || order.status}</span>
                  <span className="text-xs text-gray-400 ml-auto">{formatDateTime(order.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
