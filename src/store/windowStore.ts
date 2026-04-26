import { create } from "zustand";
import { saveSystemState, type PersistedWindow } from "../utils/persistence";

const TASKBAR_HEIGHT = 55;

export type Window = {
  id: string;
  title: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  appType?: string;
  appData?: Record<string, unknown>;
  /** When true, the window is not persisted across sessions (e.g. welcome dialogs). */
  isTransient?: boolean;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  isFocused?: boolean;
  isMaximized?: boolean;
  isMinimized?: boolean;
  zIndex?: number;
  resizable?: boolean;
  prevState?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

type WindowStore = {
  windows: Window[];
  nextZIndex: number;

  addWindow: (window: Window) => void;
  removeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  closeWindow: (id: string) => void;
  updateWindowPosition: (
    id: string,
    position: { x: number; y: number }
  ) => void;
  updateWindowSize: (
    id: string,
    size: { width: number; height: number }
  ) => void;
  snapWindow: (
    id: string,
    side: "left" | "right"
  ) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  resetForSession: () => void;
};

function serializeWindows(windows: Window[]): PersistedWindow[] {
  return windows
    .filter((w) => !w.isTransient && w.appType)
    .map((w) => ({
      id: w.id,
      title: w.title,
      appType: w.appType as string,
      appData: w.appData,
      width: w.width ?? 500,
      height: w.height ?? 400,
      x: w.x ?? 100,
      y: w.y ?? 100,
      zIndex: w.zIndex ?? 100,
      isMaximized: w.isMaximized ?? false,
      isMinimized: w.isMinimized ?? false,
    }));
}

const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  nextZIndex: 100,

  addWindow: (window) => {
    const { nextZIndex } = get();
    const newWindow: Window = {
      ...window,
      zIndex: nextZIndex,
      isFocused: window.isFocused ?? true,
      width: window.width || 500,
      height: window.height || 400,
      x: window.x || 100,
      y: window.y || 100,
      isMaximized: window.isMaximized ?? false,
      isMinimized: window.isMinimized ?? false,
      resizable: window.resizable ?? true,
    };

    set((state) => {
      const updated = [
        ...state.windows.map((w) => ({ ...w, isFocused: false })),
        newWindow,
      ];
      saveSystemState({ windows: serializeWindows(updated) });
      return { windows: updated, nextZIndex: nextZIndex + 1 };
    });
  },

  removeWindow: (id) => {
    set((state) => {
      const updated = state.windows.filter((w) => w.id !== id);
      saveSystemState({ windows: serializeWindows(updated) });
      return { windows: updated };
    });
  },

  focusWindow: (id) => {
    const { windows, nextZIndex } = get();
    const targetWindow = windows.find((w) => w.id === id);

    if (targetWindow?.isFocused && !targetWindow.isMinimized) return;

    set((state) => ({
      windows: state.windows.map((w) => ({
        ...w,
        isFocused: w.id === id,
        zIndex: w.id === id ? nextZIndex : w.zIndex,
        isMinimized: w.id === id ? false : w.isMinimized,
      })),
      nextZIndex: nextZIndex + 1,
    }));
  },

  maximizeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) => {
        if (w.id === id) {
          if (!w.isMaximized) {
            return {
              ...w,
              isMaximized: true,
              prevState: {
                x: w.x || 100,
                y: w.y || 100,
                width: w.width || 500,
                height: w.height || 400,
              },
            };
          } else {
            return {
              ...w,
              isMaximized: false,
              x: w.prevState?.x || w.x,
              y: w.prevState?.y || w.y,
              width: w.prevState?.width || w.width,
              height: w.prevState?.height || w.height,
            };
          }
        }
        return w;
      }),
    }));
  },

  minimizeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: !w.isMinimized } : w
      ),
    }));
  },

  closeWindow: (id) => {
    set((state) => {
      const closingWindow = state.windows.find((w) => w.id === id);
      const updated = state.windows.filter((w) => w.id !== id);
      let nextWindows = updated;

      if (closingWindow?.isFocused && updated.length > 0) {
        const topWindow = [...updated].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))[0];
        nextWindows = updated.map((w) => ({ ...w, isFocused: w.id === topWindow.id }));
      }

      saveSystemState({ windows: serializeWindows(nextWindows) });
      return { windows: nextWindows };
    });
  },

  updateWindowPosition: (id, position) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, x: position.x, y: position.y } : w
      ),
    }));
  },

  updateWindowSize: (id, size) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, width: size.width, height: size.height } : w
      ),
    }));
  },

  snapWindow: (id, side) => {
    const width = Math.floor(window.innerWidth / 2);
    const height = window.innerHeight - TASKBAR_HEIGHT;
    const x = side === "left" ? 0 : width;
    const y = 0;
    const { nextZIndex } = get();
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id
          ? {
              ...w,
              x,
              y,
              width,
              height,
              isMaximized: false,
              isMinimized: false,
              isFocused: true,
              zIndex: nextZIndex,
            }
          : { ...w, isFocused: false }
      ),
      nextZIndex: nextZIndex + 1,
    }));
  },

  bringToFront: (id) => {
    const { nextZIndex } = get();
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id
          ? { ...w, zIndex: nextZIndex, isFocused: true }
          : { ...w, isFocused: false }
      ),
      nextZIndex: nextZIndex + 1,
    }));
  },

  sendToBack: (id) => {
    set((state) => {
      const minZ = Math.min(...state.windows.map((w) => w.zIndex || 0));
      return {
        windows: state.windows.map((w) =>
          w.id === id ? { ...w, zIndex: minZ - 1, isFocused: false } : w
        ),
      };
    });
  },

  resetForSession: () => {
    set({ windows: [], nextZIndex: 100 });
  },
}));

export default useWindowStore;
