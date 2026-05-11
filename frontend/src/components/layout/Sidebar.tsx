'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, Users, Settings, LogOut,
  Droplets, Package, Truck, UserCheck, BarChart3, ClipboardList,
  X, Activity, Bell
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const superAdminNav: NavItem[] = [
  { label: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
  { label: 'All Orders', href: '/super-admin/orders', icon: ShoppingCart },
  { label: 'Users', href: '/super-admin/users', icon: Users },
  { label: 'Admins', href: '/super-admin/admins', icon: UserCheck },
  { label: 'Analytics', href: '/super-admin/analytics', icon: BarChart3 },
  { label: 'Activity Logs', href: '/super-admin/activity', icon: Activity },
  { label: 'Notifications', href: '/super-admin/notifications', icon: Bell },
  { label: 'Settings', href: '/super-admin/settings', icon: Settings },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'All Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Pickup Orders', href: '/admin/orders/pickup', icon: Package },
  { label: 'Delivery Orders', href: '/admin/orders/delivery', icon: Truck },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'Profile', href: '/admin/profile', icon: Users },
];

const userNav: NavItem[] = [
  { label: 'Dashboard', href: '/user', icon: LayoutDashboard },
  { label: 'My Orders', href: '/user/orders', icon: ClipboardList },
  { label: 'New Order', href: '/user/orders/new', icon: ShoppingCart },
  { label: 'Profile', href: '/user/profile', icon: Users },
];

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, refreshToken, clearAuth } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount());

  const navItems =
    user?.role === 'super_admin'
      ? superAdminNav
      : user?.role === 'admin'
        ? adminNav
        : userNav;

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch { /* ignore */ }
    clearAuth();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const isActive = (href: string) => {
    const path = href.split('?')[0];
    return pathname === path;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Fiver Star</p>
            <p className="text-slate-400 text-xs">Water Filter Plant</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white lg:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm flex-shrink-0">
            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary-500/20 text-primary-300 capitalize">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider px-3 mb-2">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const isNotif = item.href.endsWith('/notifications');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'sidebar-link',
                active ? 'sidebar-link-active' : 'sidebar-link-inactive'
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span>{item.label}</span>
              {isNotif && unreadCount > 0 && (
                <span className="ml-auto min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              {active && !isNotif && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="sidebar-link sidebar-link-inactive w-full text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-white/5 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={onClose}
          />
          <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar z-50 lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
