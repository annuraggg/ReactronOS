import { create } from "zustand";
import { v4 as uuid } from "uuid";

export type NotificationType = "success" | "error" | "info";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  message: string;
};

type NotificationStore = {
  items: NotificationItem[];
  notify: (notification: Omit<NotificationItem, "id">) => void;
  dismiss: (id: string) => void;
};

export const useNotificationStore = create<NotificationStore>((set) => ({
  items: [],
  notify: (notification) => {
    const id = uuid();
    set((state) => ({ items: [...state.items, { id, ...notification }] }));
    window.setTimeout(() => {
      set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
    }, 3500);
  },
  dismiss: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
}));

export const notify = (notification: Omit<NotificationItem, "id">) => {
  useNotificationStore.getState().notify(notification);
};
