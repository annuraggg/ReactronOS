import { create } from "zustand";
import { v4 as uuid } from "uuid";

export type NotificationType = "success" | "error" | "info";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  message: string;
  createdAt: string;
  read: boolean;
};

type NotificationStore = {
  items: NotificationItem[];
  history: NotificationItem[];
  isCenterOpen: boolean;
  notify: (notification: Omit<NotificationItem, "id">) => void;
  dismiss: (id: string) => void;
  toggleCenter: () => void;
  closeCenter: () => void;
  markAllRead: () => void;
  clearHistory: () => void;
};

export const useNotificationStore = create<NotificationStore>((set) => ({
  items: [],
  history: [],
  isCenterOpen: false,
  notify: (notification) => {
    const id = uuid();
    const next = { id, ...notification };
    set((state) => ({
      items: [...state.items, next],
      history: [next, ...state.history],
    }));
    window.setTimeout(() => {
      set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
    }, 3500);
  },
  dismiss: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  toggleCenter: () =>
    set((state) => ({
      isCenterOpen: !state.isCenterOpen,
      history: state.history.map((item) => ({ ...item, read: true })),
    })),
  closeCenter: () =>
    set((state) => ({
      isCenterOpen: false,
      history: state.history.map((item) => ({ ...item, read: true })),
    })),
  markAllRead: () =>
    set((state) => ({
      history: state.history.map((item) => ({ ...item, read: true })),
    })),
  clearHistory: () => set({ history: [] }),
}));

export const notify = (notification: Omit<NotificationItem, "id" | "createdAt" | "read">) =>
  useNotificationStore.getState().notify({
    ...notification,
    createdAt: new Date().toISOString(),
    read: false,
  });
