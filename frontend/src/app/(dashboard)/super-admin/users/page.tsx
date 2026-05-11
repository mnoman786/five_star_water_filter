'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, UserCheck, UserX } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { User, PaginatedResponse } from '@/types';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

const createSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(['user', 'admin']),
  password: z.string().min(6),
});

type CreateForm = z.infer<typeof createSchema>;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'user' },
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await usersApi.list(params);
      setUsers(res.data.results || res.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => { setEditUser(null); reset({ role: 'user' }); setModalOpen(true); };
  const openEdit = (user: User) => {
    setEditUser(user);
    setValue('email', user.email);
    setValue('full_name', user.full_name);
    setValue('phone', user.phone);
    setValue('address', user.address);
    setValue('role', user.role as 'user' | 'admin');
    setModalOpen(true);
  };

  const onSubmit = async (data: CreateForm) => {
    try {
      if (editUser) {
        await usersApi.update(editUser.id, data);
        toast.success('User updated');
      } else {
        await usersApi.create(data);
        toast.success('User created');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } };
      const msg = Object.values(error?.response?.data || {}).flat()[0] || 'Failed to save user';
      toast.error(String(msg));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersApi.delete(deleteTarget.id);
      toast.success('User deleted');
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await usersApi.update(user.id, { is_active: !user.is_active });
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch {
      toast.error('Action failed');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-400 text-sm">{users.length} users found</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="input pl-9" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input w-36">
          <option value="">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
          <option value="super_admin">Super Admins</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="table-header text-left">User</th>
                <th className="table-header text-left">Phone</th>
                <th className="table-header text-left">Role</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-left">Joined</th>
                <th className="table-header text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="table-cell"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No users found</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
                          {user.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{user.full_name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-gray-600">{user.phone || '-'}</td>
                    <td className="table-cell">
                      <span className={`badge ${user.role === 'super_admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : user.role === 'admin' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${user.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell text-gray-400 text-xs">{formatDate(user.date_joined)}</td>
                    <td className="table-cell">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600"><Edit2 size={14} /></button>
                        <button onClick={() => handleToggleActive(user)} className={`p-1.5 rounded-lg text-gray-400 transition-colors ${user.is_active ? 'hover:bg-red-50 hover:text-red-500' : 'hover:bg-green-50 hover:text-green-500'}`} title={user.is_active ? 'Deactivate' : 'Activate'}>
                          {user.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                        <button onClick={() => setDeleteTarget(user)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-100">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))
          ) : users.length === 0 ? (
            <p className="text-center py-12 text-gray-400 text-sm">No users found</p>
          ) : (
            users.map((user) => (
              <div key={user.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold flex-shrink-0">
                    {user.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{user.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600"><Edit2 size={14} /></button>
                        <button onClick={() => handleToggleActive(user)} className={`p-1.5 rounded-lg text-gray-400 transition-colors ${user.is_active ? 'hover:bg-red-50 hover:text-red-500' : 'hover:bg-green-50 hover:text-green-500'}`}>
                          {user.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                        <button onClick={() => setDeleteTarget(user)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className={`badge ${user.role === 'super_admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : user.role === 'admin' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                      <span className={`badge ${user.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {user.phone && <p className="text-xs text-gray-500 mt-1">{user.phone}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">Joined {formatDate(user.date_joined)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        variant="danger"
        title="Delete this user?"
        message={`${deleteTarget?.full_name} (${deleteTarget?.email}) will be permanently deleted.`}
        confirmLabel="Yes, delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editUser ? 'Edit User' : 'Create New User'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Full Name</label>
              <input {...register('full_name')} className="input" placeholder="Full name" />
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input" placeholder="email@example.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Phone</label>
              <input {...register('phone')} className="input" placeholder="+92..." />
            </div>
            <div>
              <label className="label">Role</label>
              <select {...register('role')} className="input">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {!editUser && (
              <div className="col-span-2">
                <label className="label">Password</label>
                <input {...register('password')} type="password" className="input" placeholder="Min 6 characters" />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
            )}
            <div className="col-span-2">
              <label className="label">Address</label>
              <textarea {...register('address')} className="input" rows={2} placeholder="Optional address" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'Saving...' : editUser ? 'Update' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
