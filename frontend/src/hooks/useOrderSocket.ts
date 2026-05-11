/**
 * Singleton WebSocket manager.
 *
 * useSocketLifecycle() — call once in the dashboard layout to own the connection.
 * useOrderSocket(fn)   — call in any page to receive order-event callbacks.
 * useWsStatus()        — read the connection status from any component.
 */
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// ── token helpers ────────────────────────────────────────────────────────────

function isExpired(token: string): boolean {
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1]));
    return Date.now() / 1000 > exp - 60;
  } catch {
    return true;
  }
}

async function getFreshToken(): Promise<string | null> {
  const state = useAuthStore.getState();
  const { accessToken, refreshToken } = state;
  if (!accessToken) return null;
  if (!isExpired(accessToken)) return accessToken;
  if (!refreshToken) { state.clearAuth(); return null; }
  try {
    const res = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh: refreshToken });
    const { access, refresh: newRefresh } = res.data;
    state.setAccessToken(access);
    if (newRefresh) state.setRefreshToken(newRefresh);
    return access;
  } catch {
    state.clearAuth();
    return null;
  }
}

// ── global singleton state ───────────────────────────────────────────────────

export type WsStatus = 'connecting' | 'connected' | 'disconnected';

let globalStatus: WsStatus = 'disconnected';
const statusListeners = new Set<(s: WsStatus) => void>();
function setGlobalStatus(s: WsStatus) {
  globalStatus = s;
  statusListeners.forEach((fn) => fn(s));
}

const refreshCallbacks = new Set<() => void>();
function triggerRefresh() {
  refreshCallbacks.forEach((fn) => fn());
}

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let socketDestroyed = false;

async function connectSocket() {
  if (socketDestroyed) return;

  const token = await getFreshToken();
  if (!token || socketDestroyed) return;

  setGlobalStatus('connecting');
  ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/orders/?token=${token}`);

  const addNotification = useNotificationStore.getState().add;

  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);

      if (data.event === 'connected') {
        setGlobalStatus('connected');
        return;
      }

      if (data.event === 'new_order') {
        toast.success(
          `New order from ${data.customer}\n${data.quantity} bottle(s) · Rs. ${data.total}`,
          { duration: 6000, icon: '🛒', id: data.order_id }
        );
        addNotification({
          event: 'new_order',
          order_id: data.order_id,
          customer: data.customer,
          order_type: data.order_type,
          quantity: data.quantity,
          total: data.total,
        });
        triggerRefresh();
      } else if (data.event === 'order_updated') {
        toast(`Order #${data.order_id} → ${(data.status ?? '').replace(/_/g, ' ')}`, {
          icon: '📦', duration: 4000, id: `upd-${data.order_id}`,
        });
        addNotification({
          event: 'order_updated',
          order_id: data.order_id,
          customer: data.customer,
          status: data.status,
          payment_status: data.payment_status,
        });
        triggerRefresh();
      }
    } catch { /* ignore malformed */ }
  };

  ws.onclose = () => {
    setGlobalStatus('disconnected');
    if (!socketDestroyed) {
      reconnectTimer = setTimeout(connectSocket, 2000);
    }
  };

  ws.onerror = () => ws?.close();
}

function startSocket() {
  socketDestroyed = false;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  // Don't open a second connection if one is already live
  if (ws && ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING) return;
  connectSocket();
}

function stopSocket() {
  socketDestroyed = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  ws?.close();
  ws = null;
  setGlobalStatus('disconnected');
}

// ── public hooks ─────────────────────────────────────────────────────────────

/** Read WS connection state from any component. */
export function useWsStatus(): WsStatus {
  const [status, setStatus] = useState<WsStatus>(globalStatus);
  useEffect(() => {
    setStatus(globalStatus); // sync immediately in case it changed before mount
    statusListeners.add(setStatus);
    return () => { statusListeners.delete(setStatus); };
  }, []);
  return status;
}

/**
 * Call once in the dashboard layout.
 * Starts the socket when authenticated; stops it on logout/unmount.
 */
export function useSocketLifecycle() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      startSocket();
    } else {
      stopSocket();
    }
    return () => { stopSocket(); };
  }, [isAuthenticated]);
}

/**
 * Register a per-page refresh callback.
 * Call in any page that should reload its data when an order event arrives.
 */
export function useOrderSocket(onRefresh: () => void) {
  useEffect(() => {
    refreshCallbacks.add(onRefresh);
    return () => { refreshCallbacks.delete(onRefresh); };
  }, [onRefresh]);
}
