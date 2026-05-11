'use client';

import { useEffect, useState } from 'react';
import { usersApi } from '@/lib/api';
import { ActivityLog } from '@/types';
import { timeAgo, formatDateTime } from '@/lib/utils';
import { Activity, LogIn, LogOut, Edit, Plus, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const actionIcon: Record<string, React.ElementType> = {
  login: LogIn, logout: LogOut, create: Plus,
  update: Edit, delete: Trash2, status_change: RefreshCw,
};
const actionColor: Record<string, string> = {
  login: 'bg-green-100 text-green-600',
  logout: 'bg-gray-100 text-gray-500',
  create: 'bg-blue-100 text-blue-600',
  update: 'bg-yellow-100 text-yellow-600',
  delete: 'bg-red-100 text-red-600',
  status_change: 'bg-purple-100 text-purple-600',
};

function ActionBadge({ action }: { action: string }) {
  const Icon = actionIcon[action] || Activity;
  const color = actionColor[action] || 'bg-gray-100 text-gray-500';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${color}`}>
      <Icon size={12} />
      <span className="capitalize">{action.replace('_', ' ')}</span>
    </span>
  );
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.activityLogs()
      .then((res) => setLogs(res.data?.results ?? res.data))
      .catch(() => toast.error('Failed to load activity logs'))
      .finally(() => setLoading(false));
  }, []);

  const skeletonRows = Array.from({ length: 6 });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Activity size={22} className="text-primary-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-800">Activity Logs</h1>
          <p className="text-gray-400 text-sm">Recent system activity</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="table-header text-left">Action</th>
                <th className="table-header text-left">User</th>
                <th className="table-header text-left">Description</th>
                <th className="table-header text-left">IP Address</th>
                <th className="table-header text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? skeletonRows.map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="table-cell"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              )) : logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No activity logs found</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="table-cell"><ActionBadge action={log.action} /></td>
                    <td className="table-cell">
                      <p className="font-medium text-sm">{log.user_name || 'System'}</p>
                      <p className="text-xs text-gray-400">{log.user_email}</p>
                    </td>
                    <td className="table-cell text-gray-600 max-w-xs">{log.description}</td>
                    <td className="table-cell text-gray-400 font-mono text-xs">{log.ip_address || '-'}</td>
                    <td className="table-cell">
                      <p className="text-xs text-gray-500">{timeAgo(log.created_at)}</p>
                      <p className="text-xs text-gray-300">{formatDateTime(log.created_at)}</p>
                    </td>
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
              <div className="h-4 bg-gray-100 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          )) : logs.length === 0 ? (
            <p className="text-center py-12 text-gray-400 text-sm">No activity logs found</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <ActionBadge action={log.action} />
                  <span className="text-xs text-gray-400 shrink-0">{timeAgo(log.created_at)}</span>
                </div>
                <p className="text-sm font-medium text-gray-800">{log.user_name || 'System'}</p>
                {log.user_email && <p className="text-xs text-gray-400">{log.user_email}</p>}
                <p className="text-sm text-gray-600 leading-snug">{log.description}</p>
                {log.ip_address && <p className="text-xs text-gray-400 font-mono">{log.ip_address}</p>}
                <p className="text-xs text-gray-300">{formatDateTime(log.created_at)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
