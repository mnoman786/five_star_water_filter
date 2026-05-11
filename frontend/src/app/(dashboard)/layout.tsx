'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, useHasHydrated } from '@/store/useAuthStore';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useSocketLifecycle } from '@/hooks/useOrderSocket';

function getDashboardRoot(role: string): string {
  switch (role) {
    case 'super_admin': return '/super-admin';
    case 'admin': return '/admin';
    default: return '/user';
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const hasHydrated = useHasHydrated();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ready, setReady] = useState(false);

  // Single persistent WebSocket for the entire dashboard lifetime
  useSocketLifecycle();

  useEffect(() => {
    // Don't do anything until Zustand has loaded from localStorage
    if (!hasHydrated) return;

    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }

    const role = user.role;

    if (pathname.startsWith('/super-admin') && role !== 'super_admin') {
      router.replace(getDashboardRoot(role));
      return;
    }
    if (pathname.startsWith('/admin') && !['admin', 'super_admin'].includes(role)) {
      router.replace(getDashboardRoot(role));
      return;
    }

    setReady(true);
  }, [hasHydrated, isAuthenticated, user, pathname, router]);

  // Show spinner while hydrating OR while redirect is in flight
  if (!hasHydrated || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
        <footer className="text-center py-4 text-xs text-gray-400 border-t border-gray-100">
          © {new Date().getFullYear()} Fiver Star Water Filter Plant. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
