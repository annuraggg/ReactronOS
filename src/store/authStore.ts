import { create } from "zustand";

type UserRecord = {
  username: string;
  password: string;
  createdAt: string;
};

type AuthState = {
  users: Record<string, UserRecord>;
  currentUser: string | null;
  signUp: (
    username: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  login: (
    username: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
};

const AUTH_KEY = "reactron_auth";

function loadInitialAuthState(): Pick<AuthState, "users" | "currentUser"> {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return { users: {}, currentUser: null };
    const parsed = JSON.parse(raw) as Partial<AuthState>;
    return {
      users: parsed.users ?? {},
      currentUser: parsed.currentUser ?? null,
    };
  } catch {
    return { users: {}, currentUser: null };
  }
}

function persistAuthState(users: Record<string, UserRecord>, currentUser: string | null) {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ users, currentUser }));
  } catch {
    // ignore storage errors
  }
}

const initial = loadInitialAuthState();

async function hashPassword(password: string): Promise<string> {
  if (!crypto?.subtle) {
    throw new Error("Secure hashing is unavailable in this environment.");
  }
  const encoded = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const useAuthStore = create<AuthState>((set, get) => ({
  users: initial.users,
  currentUser: initial.currentUser,
  signUp: async (username, password) => {
    const normalized = username.trim();
    if (!normalized) return { ok: false, error: "Username is required." };
    if (password.length < 8)
      return { ok: false, error: "Password must be at least 8 characters." };

    const { users } = get();
    if (users[normalized]) {
      return { ok: false, error: "Username already exists." };
    }
    let passwordHash: string;
    try {
      passwordHash = await hashPassword(password);
    } catch {
      return { ok: false, error: "Secure hashing is unavailable." };
    }
    const nextUsers: Record<string, UserRecord> = {
      ...users,
      [normalized]: {
        username: normalized,
        password: passwordHash,
        createdAt: new Date().toISOString(),
      },
    };
    persistAuthState(nextUsers, normalized);
    set({ users: nextUsers, currentUser: normalized });
    return { ok: true };
  },
  login: async (username, password) => {
    const normalized = username.trim();
    const { users } = get();
    const user = users[normalized];
    let passwordHash: string;
    try {
      passwordHash = await hashPassword(password);
    } catch {
      return { ok: false, error: "Secure hashing is unavailable." };
    }
    if (!user || user.password !== passwordHash) {
      return { ok: false, error: "Invalid username or password." };
    }
    persistAuthState(users, normalized);
    set({ currentUser: normalized });
    return { ok: true };
  },
  logout: () => {
    const { users } = get();
    persistAuthState(users, null);
    set({ currentUser: null });
  },
}));
