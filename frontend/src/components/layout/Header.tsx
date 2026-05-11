'use client';

import { Menu, User, ChevronDown, Wifi, WifiOff } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWsStatus } from '@/hooks/useOrderSocket';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import NotificationPanel from './NotificationPanel';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export default function Header({ onMenuClick, title }: HeaderProps) {
  const { user, refreshToken, clearAuth } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  const wsStatus = useWsStatus();

  const profilePath =
    user?.role === 'super_admin'
      ? '/super-admin/profile'
      : user?.role === 'admin'
        ? '/admin/profile'
        : '/user/profile';

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch { /* ignore */ }
    clearAuth();
    toast.success('Logged out');
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <Menu size={20} />
        </button>
        {title && (
          <h1 className="text-base font-semibold text-gray-800 hidden sm:block">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* WebSocket connection indicator */}
        <div
          title={wsStatus === 'connected' ? 'Live updates active' : wsStatus === 'connecting' ? 'Connecting...' : 'Disconnected — run daphne'}
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium"
        >
          {wsStatus === 'connected' ? (
            <><Wifi size={14} className="text-green-500" /><span className="text-green-600">Live</span></>
          ) : wsStatus === 'connecting' ? (
            <><div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" /><span className="text-yellow-600">Connecting</span></>
          ) : (
            <><WifiOff size={14} className="text-red-400" /><span className="text-red-500">Offline</span></>
          )}
        </div>

        <NotificationPanel />

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-700 leading-tight">{user?.full_name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
                <Link
                  href={profilePath}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User size={16} />
                  My Profile
                </Link>
                <div className="border-t border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
