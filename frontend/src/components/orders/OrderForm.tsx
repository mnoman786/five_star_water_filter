'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { OrderCreateData, PlantSettings } from '@/types';
import { ordersApi } from '@/lib/api';

const schema = z.object({
  customer_name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone required'),
  address: z.string().optional(),
  order_type: z.enum(['pickup', 'delivery']),
  quantity: z.coerce.number().min(1, 'Min 1 bottle'),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.order_type === 'delivery' && !data.address) {
    return false;
  }
  return true;
}, { message: 'Address is required for delivery', path: ['address'] });

type FormData = z.infer<typeof schema>;

interface OrderFormProps {
  defaultValues?: Partial<FormData>;
  onSubmit: (data: OrderCreateData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  prefillFromUser?: boolean;
}

export default function OrderForm({ defaultValues, onSubmit, onCancel, isLoading, prefillFromUser }: OrderFormProps) {
  const [settings, setSettings] = useState<{ bottle_price: string; delivery_charge: string } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { order_type: 'delivery', quantity: 1, ...defaultValues },
  });

  const orderType = watch('order_type');
  const quantity = watch('quantity') || 1;

  useEffect(() => {
    ordersApi.publicSettings().then((res) => setSettings(res.data));
  }, []);

  const unitPrice = parseFloat(settings?.bottle_price || '50');
  const deliveryCharge = orderType === 'delivery' ? parseFloat(settings?.delivery_charge || '20') : 0;
  const total = (unitPrice + deliveryCharge) * quantity;

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit({
      ...data,
      unit_price: unitPrice,
      delivery_charge: deliveryCharge,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Customer Name *</label>
          <input {...register('customer_name')} className="input" placeholder="Full name" />
          {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name.message}</p>}
        </div>
        <div>
          <label className="label">Phone Number *</label>
          <input {...register('phone')} className="input" placeholder="+92-300-1234567" />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Order Type *</label>
        <div className="grid grid-cols-2 gap-3">
          {(['pickup', 'delivery'] as const).map((type) => (
            <label key={type} className="relative cursor-pointer">
              <input {...register('order_type')} type="radio" value={type} className="peer sr-only" />
              <div className="border-2 rounded-lg p-3 text-center transition-all peer-checked:border-primary-500 peer-checked:bg-primary-50 border-gray-200 hover:border-gray-300">
                <p className="font-medium text-sm capitalize text-gray-700 peer-checked:text-primary-700">{type}</p>
                {type === 'delivery' && (
                  <p className="text-xs text-gray-400 mt-0.5">+Rs. {deliveryCharge}</p>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {orderType === 'delivery' && (
        <div>
          <label className="label">Delivery Address *</label>
          <textarea
            {...register('address')}
            className="input"
            rows={2}
            placeholder="Full delivery address"
          />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
        </div>
      )}

      <div>
        <label className="label">Quantity (bottles) *</label>
        <input
          {...register('quantity')}
          type="number"
          min={1}
          className="input"
          placeholder="1"
        />
        {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
      </div>

      <div>
        <label className="label">Notes (optional)</label>
        <textarea {...register('notes')} className="input" rows={2} placeholder="Any special instructions..." />
      </div>

      {/* Price Summary */}
      {settings && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between font-semibold text-gray-800 text-sm">
            <span>Total ({quantity} bottle{quantity > 1 ? 's' : ''})</span>
            <span className="text-primary-600">Rs. {total.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex-1"
        >
          {isLoading ? 'Submitting...' : 'Place Order'}
        </button>
      </div>
    </form>
  );
}
