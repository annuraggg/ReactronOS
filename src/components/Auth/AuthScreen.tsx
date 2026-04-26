import { useMemo, useState } from "react";
import { Lock, UserRound } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useSettingsStore } from "../../store/settingsStore";

type AuthMode = "login" | "signup";

export default function AuthScreen() {
  const users = useAuthStore((state) => state.users);
  const login = useAuthStore((state) => state.login);
  const signUp = useAuthStore((state) => state.signUp);
  const wallpaper = useSettingsStore((state) => state.currentWallpaper);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const hasUsers = useMemo(() => Object.keys(users).length > 0, [users]);
  const mode: AuthMode = hasUsers ? "login" : "signup";

  const submit = async () => {
    setPending(true);
    const result = mode === "login" ? await login(username, password) : await signUp(username, password);
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
      style={{ backgroundImage: `url(${wallpaper})` }}
    >
      <div className="absolute inset-0 bg-black/35 backdrop-blur-md" />
      <div className="relative z-10 w-[420px] max-w-[92vw] rounded-2xl border border-zinc-700/70 bg-zinc-900/75 p-7 text-zinc-100 shadow-2xl">
        <div className="mb-5 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/90">
            <UserRound className="h-8 w-8 text-zinc-100" />
          </div>
        </div>

        <h1 className="mb-1 text-center text-xl font-semibold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="mb-6 text-center text-sm text-zinc-300">
          {mode === "login" ? "Sign in to unlock ReactronOS" : "First boot setup"}
        </p>

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
        </div>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={pending}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold transition hover:bg-blue-700 disabled:opacity-60"
        >
          <Lock className="h-4 w-4" />
          {pending ? "Please wait..." : mode === "login" ? "Unlock" : "Create user"}
        </button>
      </div>
    </div>
  );
}
