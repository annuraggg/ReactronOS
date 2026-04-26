export interface PersistedWindow {
  id: string;
  title: string;
  appType: string;
  appData?: Record<string, unknown>;
  width: number;
  height: number;
  x: number;
  y: number;
  zIndex: number;
  isMaximized: boolean;
  isMinimized: boolean;
}

export interface SystemState {
  fileSystem?: unknown;
  windows?: PersistedWindow[];
}

const FS_KEY_BASE = "reactron_fs";
const WINDOWS_KEY_BASE = "reactron_windows";

type AuthStorageShape = {
  currentUser?: string | null;
};

function getStorageKey(base: string, userId?: string | null): string {
  return userId ? `${base}:${userId}` : base;
}

export function getActiveUserId(): string | null {
  try {
    const raw = localStorage.getItem("reactron_auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthStorageShape;
    return typeof parsed.currentUser === "string" && parsed.currentUser.length > 0
      ? parsed.currentUser
      : null;
  } catch {
    return null;
  }
}

export function saveSystemState(state: SystemState, userId?: string | null): void {
  const scopedUser = userId ?? getActiveUserId();
  const fsKey = getStorageKey(FS_KEY_BASE, scopedUser);
  const windowsKey = getStorageKey(WINDOWS_KEY_BASE, scopedUser);
  try {
    if (state.fileSystem !== undefined) {
      localStorage.setItem(fsKey, JSON.stringify(state.fileSystem));
    }
    if (state.windows !== undefined) {
      localStorage.setItem(windowsKey, JSON.stringify(state.windows));
    }
  } catch {
    // ignore storage errors (e.g. private browsing quota)
  }
}

export function loadSystemState(userId?: string | null): SystemState {
  const scopedUser = userId ?? getActiveUserId();
  const fsKey = getStorageKey(FS_KEY_BASE, scopedUser);
  const windowsKey = getStorageKey(WINDOWS_KEY_BASE, scopedUser);
  try {
    const rawFs = localStorage.getItem(fsKey);
    const rawWins = localStorage.getItem(windowsKey);
    return {
      fileSystem: rawFs ? JSON.parse(rawFs) : undefined,
      windows: rawWins ? (JSON.parse(rawWins) as PersistedWindow[]) : undefined,
    };
  } catch {
    return {};
  }
}

let fsDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export function debouncedSaveFs(
  root: unknown,
  delay = 7000,
  userId?: string | null
): void {
  if (fsDebounceTimer !== null) clearTimeout(fsDebounceTimer);
  fsDebounceTimer = setTimeout(
    () => saveSystemState({ fileSystem: root }, userId),
    delay
  );
}
