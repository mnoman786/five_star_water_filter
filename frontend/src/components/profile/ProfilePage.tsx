'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usersApi } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import { User, Lock, Camera } from 'lucide-react';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const passwordSchema = z.object({
  old_password: z.string().min(1, 'Current password required'),
  new_password: z.string().min(6, 'Min 6 characters'),
  confirm_password: z.string().min(6),
}).refine((d) => d.new_password === d.confirm_password, { message: 'Passwords do not match', path: ['confirm_password'] });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting, isDirty: profileDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: user?.full_name || '', phone: user?.phone || '', address: user?.address || '' },
  });

  const {
    register: regPass,
    handleSubmit: handlePass,
    reset: resetPass,
    formState: { errors: passErrors, isSubmitting: passSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v) formData.append(k, v); });
      const res = await usersApi.updateProfile(formData);
      updateUser(res.data);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      await usersApi.changePassword(data);
      toast.success('Password changed successfully');
      resetPass();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error || 'Failed to change password');
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-800">My Profile</h1>
        <p className="text-gray-400 text-sm">Manage your account information</p>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-lg">{user?.full_name}</p>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700 mt-1 capitalize">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <User size={16} className="text-blue-600" />
          </div>
          <h2 className="font-semibold text-gray-800">Personal Information</h2>
        </div>
        <form onSubmit={handleProfile(onProfileSubmit)} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input {...regProfile('full_name')} className="input" />
            {profileErrors.full_name && <p className="text-red-500 text-xs mt-1">{profileErrors.full_name.message}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input value={user?.email || ''} disabled className="input bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input {...regProfile('phone')} className="input" placeholder="+92-300-1234567" />
          </div>
          <div>
            <label className="label">Address</label>
            <textarea {...regProfile('address')} className="input" rows={2} placeholder="Your address" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={profileSubmitting || !profileDirty} className="btn-primary">
              {profileSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
            <Lock size={16} className="text-orange-600" />
          </div>
          <h2 className="font-semibold text-gray-800">Change Password</h2>
        </div>
        <form onSubmit={handlePass(onPasswordSubmit)} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input {...regPass('old_password')} type="password" className="input" placeholder="••••••••" />
            {passErrors.old_password && <p className="text-red-500 text-xs mt-1">{passErrors.old_password.message}</p>}
          </div>
          <div>
            <label className="label">New Password</label>
            <input {...regPass('new_password')} type="password" className="input" placeholder="Min 6 characters" />
            {passErrors.new_password && <p className="text-red-500 text-xs mt-1">{passErrors.new_password.message}</p>}
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input {...regPass('confirm_password')} type="password" className="input" placeholder="Repeat new password" />
            {passErrors.confirm_password && <p className="text-red-500 text-xs mt-1">{passErrors.confirm_password.message}</p>}
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={passSubmitting} className="btn-primary">
              {passSubmitting ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
