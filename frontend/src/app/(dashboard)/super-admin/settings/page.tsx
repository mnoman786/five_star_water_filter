'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ordersApi } from '@/lib/api';
import { PlantSettings } from '@/types';
import { Settings, DollarSign, Truck, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  plant_name: z.string().min(2),
  plant_address: z.string().optional(),
  plant_phone: z.string().optional(),
  bottle_price: z.coerce.number().min(0.01),
  delivery_charge: z.coerce.number().min(0),
});

type FormData = z.infer<typeof schema>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    ordersApi.settings()
      .then((res) => {
        const s: PlantSettings = res.data;
        reset({
          plant_name: s.plant_name,
          plant_address: s.plant_address,
          plant_phone: s.plant_phone,
          bottle_price: parseFloat(s.bottle_price),
          delivery_charge: parseFloat(s.delivery_charge),
        });
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await ordersApi.updateSettings(data);
      toast.success('Settings saved successfully');
      reset(data);
    } catch {
      toast.error('Failed to save settings');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
            <div className="h-5 bg-gray-100 rounded w-1/4 mb-4" />
            <div className="space-y-3">
              <div className="h-10 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Plant Settings</h1>
        <p className="text-gray-400 text-sm">Configure your water filter plant settings</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Plant Info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Building2 size={16} className="text-blue-600" />
            </div>
            <h2 className="font-semibold text-gray-800">Plant Information</h2>
          </div>
          <div>
            <label className="label">Plant Name *</label>
            <input {...register('plant_name')} className="input" />
            {errors.plant_name && <p className="text-red-500 text-xs mt-1">{errors.plant_name.message}</p>}
          </div>
          <div>
            <label className="label">Plant Address</label>
            <textarea {...register('plant_address')} className="input" rows={2} placeholder="Plant physical address" />
          </div>
          <div>
            <label className="label">Contact Phone</label>
            <input {...register('plant_phone')} className="input" placeholder="+92-300-1234567" />
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign size={16} className="text-green-600" />
            </div>
            <h2 className="font-semibold text-gray-800">Pricing</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Bottle Price (Rs.) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rs.</span>
                <input
                  {...register('bottle_price')}
                  type="number"
                  step="0.01"
                  className="input pl-10"
                  placeholder="50.00"
                />
              </div>
              {errors.bottle_price && <p className="text-red-500 text-xs mt-1">{errors.bottle_price.message}</p>}
            </div>
            <div>
              <label className="label">Delivery Charge (Rs.) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rs.</span>
                <input
                  {...register('delivery_charge')}
                  type="number"
                  step="0.01"
                  className="input pl-10"
                  placeholder="20.00"
                />
              </div>
              {errors.delivery_charge && <p className="text-red-500 text-xs mt-1">{errors.delivery_charge.message}</p>}
            </div>
          </div>
          <p className="text-xs text-gray-400">These prices are used when creating new orders</p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="btn-primary min-w-[120px]"
          >
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
