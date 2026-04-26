import { create } from "zustand";
import { getActiveUserId } from "../utils/persistence";

const KEY_BASE = "reactron_settings";

export const BUILTIN_WALLPAPERS = [
  "/wallpapers/default.jpg",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%230f172a'/%3E%3Cstop offset='1' stop-color='%231d4ed8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'%3E%3Cdefs%3E%3CradialGradient id='g'%3E%3Cstop stop-color='%233b82f6'/%3E%3Cstop offset='1' stop-color='%23090f1f'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E",
];

type UserSettings = {
  wallpaper: string;
  theme: "dark" | "light";
  accent: string;
};

type SettingsStore = {
  settingsByUser: Record<string, UserSettings>;
  currentWallpaper: string;
  currentTheme: "dark" | "light";
  currentAccent: string;
  loadForCurrentUser: () => void;
  setWallpaper: (wallpaper: string) => void;
  setTheme: (theme: "dark" | "light") => void;
  setAccent: (accent: string) => void;
};

const DEFAULT_THEME: "dark" | "light" = "dark";
const DEFAULT_ACCENT = "#3b82f6";

export function resolveWallpaper(value?: string | null): string {
  if (!value || typeof value !== "string" || !value.trim()) return BUILTIN_WALLPAPERS[0];
  return value;
}

function loadByUser(userId: string): UserSettings {
  try {
    const raw = localStorage.getItem(`${KEY_BASE}:${userId}`);
    if (!raw) return { wallpaper: BUILTIN_WALLPAPERS[0], theme: DEFAULT_THEME, accent: DEFAULT_ACCENT };
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      wallpaper: resolveWallpaper(parsed.wallpaper),
      theme: parsed.theme === "light" ? "light" : DEFAULT_THEME,
      accent: typeof parsed.accent === "string" && parsed.accent ? parsed.accent : DEFAULT_ACCENT,
    };
  } catch {
    return { wallpaper: BUILTIN_WALLPAPERS[0], theme: DEFAULT_THEME, accent: DEFAULT_ACCENT };
  }
}

function persistByUser(userId: string, settings: UserSettings) {
  try {
    localStorage.setItem(`${KEY_BASE}:${userId}`, JSON.stringify(settings));
  } catch {
    // ignore storage failures
  }
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settingsByUser: {},
  currentWallpaper: BUILTIN_WALLPAPERS[0],
  currentTheme: DEFAULT_THEME,
  currentAccent: DEFAULT_ACCENT,
  loadForCurrentUser: () => {
    const userId = getActiveUserId();
    if (!userId) {
      set({
        currentWallpaper: BUILTIN_WALLPAPERS[0],
        currentTheme: DEFAULT_THEME,
        currentAccent: DEFAULT_ACCENT,
      });
      return;
    }
    const existing = get().settingsByUser[userId] ?? loadByUser(userId);
    set((state) => ({
      settingsByUser: { ...state.settingsByUser, [userId]: existing },
      currentWallpaper: existing.wallpaper,
      currentTheme: existing.theme,
      currentAccent: existing.accent,
    }));
  },
  setWallpaper: (wallpaper) => {
    const userId = getActiveUserId();
    if (!userId) return;
    const current = get().settingsByUser[userId] ?? loadByUser(userId);
    const next = { ...current, wallpaper: resolveWallpaper(wallpaper) };
    persistByUser(userId, next);
    set((state) => ({
      settingsByUser: { ...state.settingsByUser, [userId]: next },
      currentWallpaper: next.wallpaper,
    }));
  },
  setTheme: (theme) => {
    const userId = getActiveUserId();
    if (!userId) return;
    const current = get().settingsByUser[userId] ?? loadByUser(userId);
    const next = { ...current, theme };
    persistByUser(userId, next);
    set((state) => ({
      settingsByUser: { ...state.settingsByUser, [userId]: next },
      currentTheme: next.theme,
    }));
  },
  setAccent: (accent) => {
    const userId = getActiveUserId();
    if (!userId) return;
    const current = get().settingsByUser[userId] ?? loadByUser(userId);
    const next = { ...current, accent };
    persistByUser(userId, next);
    set((state) => ({
      settingsByUser: { ...state.settingsByUser, [userId]: next },
      currentAccent: next.accent,
    }));
  },
}));
