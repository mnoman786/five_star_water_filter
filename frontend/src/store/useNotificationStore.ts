import { create } from 'zustand';

export interface AppNotification {
  id: string;
  event: 'new_order' | 'order_updated';
  order_id: string;
  customer: string;
  phone?: string;
  order_type?: string;
  quantity?: number;
  total?: string;
  status?: string;
  payment_status?: string;
  read: boolean;
  timestamp: string;
}

interface NotificationState {
  notifications: AppNotification[];
  add: (n: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  add: (n) =>
    set((state) => ({
      notifications: [
        {
          ...n,
          id: `${n.order_id}-${Date.now()}`,
          read: false,
          timestamp: new Date().toISOString(),
        },
        ...state.notifications,
      ].slice(0, 50), // keep last 50
    })),

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  clear: () => set({ notifications: [] }),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
