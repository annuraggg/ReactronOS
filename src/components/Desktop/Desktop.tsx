import { useEffect, useMemo, useState } from "react";
import { File as FileIcon, Folder } from "lucide-react";
import { useFileSystemStore } from "../../store/filesystemStore";
import { BUILTIN_WALLPAPERS, useSettingsStore } from "../../store/settingsStore";
import useWindowStore from "../../store/windowStore";
import Dock from "./Dock";
import { launchAppForFile } from "../../utils/launchAppForFile";
import FileExplorer from "../../apps/FileExplorer/FileExplorer";

export default function Desktop() {
  const wallpaper = useSettingsStore((state) => state.currentWallpaper);
  const accent = useSettingsStore((state) => state.currentAccent);
  const root = useFileSystemStore((state) => state.root);
  const desktopNode = useMemo(
    () => root.children?.find((child) => child.type === "folder" && child.name === "Desktop"),
    [root]
  );
  const addWindow = useWindowStore((state) => state.addWindow);
  const [resolvedWallpaper, setResolvedWallpaper] = useState(wallpaper || BUILTIN_WALLPAPERS[0]);

  useEffect(() => {
    const candidate = wallpaper || BUILTIN_WALLPAPERS[0];
    if (candidate.startsWith("data:image/")) {
      setResolvedWallpaper(candidate);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setResolvedWallpaper(candidate);
    };
    img.onerror = () => {
      if (!cancelled) setResolvedWallpaper(BUILTIN_WALLPAPERS[0]);
    };
    img.src = candidate;
    return () => {
      cancelled = true;
    };
  }, [wallpaper]);

  return (
    <div className="flex flex-col">
      <div
        className="relative h-[calc(100vh-55px)] bg-cover bg-center bg-no-repeat px-3 py-3"
        style={{ backgroundImage: `url(${resolvedWallpaper})`, zIndex: 0, backgroundColor: "#0b1220" }}
      >
        <div className="flex flex-col gap-2">
          {desktopNode?.type === "folder" &&
            desktopNode.children?.map((node) => (
              <button
                key={node.id}
                type="button"
                className="flex w-20 flex-col items-center gap-1 rounded p-1 text-zinc-100 hover:bg-black/25"
                onDoubleClick={() => {
                  if (node.type === "file") {
                    launchAppForFile(node, addWindow, ["Desktop", node.name]);
                    return;
                  }
                  addWindow({
                    id: `explorer-desktop-${Date.now()}`,
                    title: "File Explorer",
                    content: <FileExplorer initialPath={["Desktop", node.name]} />,
                    icon: <Folder className="h-4 w-4 text-amber-300" />,
                    appType: "explorer",
                    width: 440,
                    height: 520,
                    x: 120 + Math.random() * 200,
                    y: 120 + Math.random() * 140,
                    isFocused: true,
                  });
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (node.type === "file") {
                      launchAppForFile(node, addWindow, ["Desktop", node.name]);
                      return;
                    }
                    addWindow({
                      id: `explorer-desktop-${Date.now()}`,
                      title: "File Explorer",
                      content: <FileExplorer initialPath={["Desktop", node.name]} />,
                      icon: <Folder className="h-4 w-4 text-amber-300" />,
                      appType: "explorer",
                      width: 440,
                      height: 520,
                      x: 120 + Math.random() * 200,
                      y: 120 + Math.random() * 140,
                      isFocused: true,
                    });
                  }
                }}
                style={{ outlineColor: accent }}
              >
                {node.type === "folder" ? (
                  <Folder className="h-8 w-8 text-yellow-300" />
                ) : (
                  <FileIcon className="h-8 w-8 text-blue-300" />
                )}
                <span className="w-full truncate text-center text-[11px]">{node.name}</span>
              </button>
            ))}
        </div>
      </div>
      <Dock />
    </div>
  );
}
