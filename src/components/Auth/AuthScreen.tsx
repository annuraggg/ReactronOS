import { useEffect, useMemo, useState } from "react";
import { Lock, UserRound } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { BUILTIN_WALLPAPERS, useSettingsStore } from "../../store/settingsStore";

type AuthMode = "select" | "login" | "signup";

export default function AuthScreen() {
  const users = useAuthStore((state) => state.users);
  const login = useAuthStore((state) => state.login);
  const signUp = useAuthStore((state) => state.signUp);
  const wallpaper = useSettingsStore((state) => state.currentWallpaper);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [mode, setMode] = useState<AuthMode>("select");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const userList = useMemo(() => Object.keys(users), [users]);
  const hasUsers = userList.length > 0;

  useEffect(() => {
    if (!hasUsers) {
      setMode("signup");
      setSelectedUser(null);
      return;
    }
    if (selectedUser && !users[selectedUser]) {
      setSelectedUser(null);
      setMode("select");
    }
    if (!selectedUser && mode === "login") {
      setMode("select");
    }
  }, [hasUsers, mode, selectedUser, users]);

  const submit = async () => {
    setPending(true);
    const result =
      mode === "login"
        ? await login(selectedUser ?? "", password)
        : await signUp(username, password);
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "Authentication failed.");
      return;
    }
    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${wallpaper || BUILTIN_WALLPAPERS[0]})` }}
    >
      <div className="absolute inset-0 bg-black/35 backdrop-blur-md" />
      <div className="relative z-10 w-[420px] max-w-[92vw] rounded-2xl border border-zinc-700/70 bg-zinc-900/75 p-7 text-zinc-100 shadow-2xl">
        <div className="mb-5 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/90">
            <UserRound className="h-8 w-8 text-zinc-100" />
          </div>
        </div>

        <h1 className="mb-1 text-center text-xl font-semibold">
          {mode === "signup" ? "Create your account" : mode === "login" ? "Welcome back" : "Select user"}
        </h1>
        <p className="mb-6 text-center text-sm text-zinc-300">
          {mode === "signup"
            ? "Create a user profile for ReactronOS"
            : mode === "login"
              ? "Sign in to unlock ReactronOS"
              : "Choose an existing user or create a new one"}
        </p>

        {mode === "select" && (
          <>
            <div className="mb-3 max-h-52 space-y-2 overflow-auto">
              {userList.map((user) => (
                <button
                  key={user}
                  type="button"
                  onClick={() => {
                    setSelectedUser(user);
                    setPassword("");
                    setError(null);
                    setMode("login");
                  }}
                  className="flex w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/90 px-3 py-2 text-left text-sm hover:border-blue-500/60 hover:bg-zinc-800"
                >
                  <span>{user}</span>
                  <span className="text-xs text-zinc-400">Unlock</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setUsername("");
                setPassword("");
                setError(null);
              }}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 py-2 text-sm font-semibold hover:bg-zinc-700"
            >
              Create new user
            </button>
          </>
        )}

        {mode === "login" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/70 px-3 py-2 text-sm text-zinc-200">
              User: <span className="font-semibold">{selectedUser}</span>
            </div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/90 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            {error && <div className="text-sm text-red-400">{error}</div>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode("select");
                  setPassword("");
                  setError(null);
                }}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/80 py-2 text-sm font-semibold hover:bg-zinc-700"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={pending || !selectedUser}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-semibold transition hover:bg-blue-700 disabled:opacity-60"
              >
                <Lock className="h-4 w-4" />
                {pending ? "Please wait..." : "Unlock"}
              </button>
            </div>
          </div>
        )}

        {mode === "signup" && (
          <div className="space-y-3">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/90 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/90 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            {error && <div className="text-sm text-red-400">{error}</div>}
            <div className="flex gap-2">
              {hasUsers && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("select");
                    setError(null);
                  }}
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/80 py-2 text-sm font-semibold hover:bg-zinc-700"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={() => void submit()}
                disabled={pending}
                className="mt-0 flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-semibold transition hover:bg-blue-700 disabled:opacity-60"
              >
                <Lock className="h-4 w-4" />
                {pending ? "Please wait..." : "Create user"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
