'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/api';
import { OrderCreateData } from '@/types';
import OrderForm from '@/components/orders/OrderForm';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewOrderPage() {
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (data: OrderCreateData) => {
    setSubmitting(true);
    try {
      await ordersApi.create(data);
      toast.success('Order placed successfully!');
      router.push('/user/orders');
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } };
      const msg = Object.values(error?.response?.data || {}).flat()[0] || 'Failed to place order';
      toast.error(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="mb-5">
        <Link href="/user/orders" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={16} /> Back to Orders
        </Link>
        <h1 className="text-xl font-bold text-gray-800">Place New Order</h1>
        <p className="text-gray-400 text-sm">Order water bottles for pickup or delivery</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <OrderForm
          defaultValues={{
            customer_name: user?.full_name || '',
            phone: user?.phone || '',
            address: user?.address || '',
          }}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/user/orders')}
          isLoading={submitting}
        />
      </div>
    </div>
  );
}
