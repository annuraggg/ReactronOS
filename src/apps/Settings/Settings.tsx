import { useRef } from "react";
import { BUILTIN_WALLPAPERS, useSettingsStore } from "../../store/settingsStore";
import { notify } from "../../store/notificationStore";

export default function Settings() {
  const currentWallpaper = useSettingsStore((state) => state.currentWallpaper);
  const setWallpaper = useSettingsStore((state) => state.setWallpaper);
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
      <h2 className="mb-3 text-base font-semibold">Personalization</h2>
      <p className="mb-4 text-xs text-zinc-400">Choose desktop wallpaper</p>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {BUILTIN_WALLPAPERS.map((wallpaper) => {
          const selected = currentWallpaper === wallpaper;
          return (
            <button
              key={wallpaper}
              type="button"
              className={`overflow-hidden rounded border ${
                selected ? "border-blue-500" : "border-zinc-700"
              }`}
              onClick={() => setWallpaper(wallpaper)}
            >
              <img src={wallpaper} alt="Wallpaper option" className="h-20 w-full object-cover" />
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
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
      </div>
    </div>
  );
}
