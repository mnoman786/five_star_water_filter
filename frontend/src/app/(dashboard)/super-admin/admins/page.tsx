'use client';

import { useEffect, useState } from 'react';
import { usersApi } from '@/lib/api';
import { User } from '@/types';
import { formatDate } from '@/lib/utils';
import { UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminsPage() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.admins()
      .then((res) => setAdmins(res.data?.results ?? res.data))
      .catch(() => toast.error('Failed to load admins'))
      .finally(() => setLoading(false));
  }, []);

  const skeletonRows = Array.from({ length: 3 });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Admin Management</h1>
        <p className="text-gray-400 text-sm">{admins.length} admins</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="table-header text-left">Admin</th>
                <th className="table-header text-left">Phone</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-left">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? skeletonRows.map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <td key={j} className="table-cell"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              )) : admins.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">No admins found</td></tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <UserCheck size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{admin.full_name}</p>
                          <p className="text-xs text-gray-400">{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">{admin.phone || '-'}</td>
                    <td className="table-cell">
                      <span className={`badge ${admin.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell text-gray-400 text-xs">{formatDate(admin.date_joined)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-100">
          {loading ? skeletonRows.map((_, i) => (
            <div key={i} className="p-4 space-y-2 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          )) : admins.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">No admins found</p>
          ) : (
            admins.map((admin) => (
              <div key={admin.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserCheck size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-800 text-sm truncate">{admin.full_name}</p>
                      <span className={`badge shrink-0 ${admin.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{admin.email}</p>
                    {admin.phone && <p className="text-xs text-gray-500 mt-0.5">{admin.phone}</p>}
                    <p className="text-xs text-gray-400 mt-1">Joined {formatDate(admin.date_joined)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
