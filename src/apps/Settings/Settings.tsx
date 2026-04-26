import { useRef } from "react";
import { BUILTIN_WALLPAPERS, useSettingsStore } from "../../store/settingsStore";
import { notify } from "../../store/notificationStore";
import { useAuthStore } from "../../store/authStore";

export default function Settings() {
  const currentWallpaper = useSettingsStore((state) => state.currentWallpaper);
  const currentTheme = useSettingsStore((state) => state.currentTheme);
  const currentAccent = useSettingsStore((state) => state.currentAccent);
  const setWallpaper = useSettingsStore((state) => state.setWallpaper);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setAccent = useSettingsStore((state) => state.setAccent);
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setWallpaper(result);
        notify({ type: "success", message: "Wallpaper updated" });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="h-full overflow-auto bg-zinc-900 p-4 text-zinc-100">
      <section className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
        <h2 className="mb-3 text-base font-semibold">Appearance</h2>
        <div className="mb-3">
          <p className="mb-1 text-xs text-zinc-400">Theme</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`rounded px-3 py-1.5 text-sm ${currentTheme === "dark" ? "bg-blue-600 text-white" : "bg-zinc-800 hover:bg-zinc-700"}`}
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`rounded px-3 py-1.5 text-sm ${currentTheme === "light" ? "bg-blue-600 text-white" : "bg-zinc-800 hover:bg-zinc-700"}`}
            >
              Light
            </button>
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-1 text-xs text-zinc-400">Accent color</p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentAccent}
              onChange={(e) => setAccent(e.target.value)}
              className="h-9 w-14 cursor-pointer rounded border border-zinc-700 bg-transparent"
            />
            <span className="text-xs text-zinc-300">{currentAccent}</span>
          </div>
        </div>

        <p className="mb-2 text-xs text-zinc-400">Wallpaper</p>
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BUILTIN_WALLPAPERS.map((wallpaper) => {
            const selected = currentWallpaper === wallpaper;
            return (
              <button
                key={wallpaper}
                type="button"
                className={`overflow-hidden rounded border ${selected ? "border-blue-500" : "border-zinc-700"}`}
                onClick={() => setWallpaper(wallpaper)}
              >
                <img src={wallpaper} alt="Wallpaper option" className="h-20 w-full object-cover" />
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded bg-zinc-700 px-3 py-2 text-xs hover:bg-zinc-600"
        >
          Upload wallpaper
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onUpload(e.target.files?.[0])}
        />
      </section>

      <section className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
        <h2 className="mb-3 text-base font-semibold">User Profile</h2>
        <p className="mb-2 text-sm text-zinc-300">Signed in as: {currentUser || "Guest"}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              logout();
              notify({ type: "info", message: "Select a user to continue." });
            }}
            className="rounded bg-zinc-700 px-3 py-2 text-xs hover:bg-zinc-600"
          >
            Switch user
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              notify({ type: "info", message: "Logged out." });
            }}
            className="rounded bg-red-700/80 px-3 py-2 text-xs hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
        <h2 className="mb-3 text-base font-semibold">System Info</h2>
        <div className="space-y-1 text-sm text-zinc-300">
          <div>CPU: Reactron Virtual CPU (8 cores)</div>
          <div>Memory: 16 GB (simulated)</div>
          <div>Storage: 512 GB virtual disk</div>
          <div>Version: ReactronOS v2.0.0</div>
        </div>
      </section>
    </div>
  );
}
