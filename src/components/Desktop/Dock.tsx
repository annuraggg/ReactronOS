import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Folder, NotebookText } from "lucide-react";
import useWindowStore, { type Window } from "../../store/windowStore";
import { createNotepadWindow } from "../../apps/Notepad/Notepad";
import FileExplorer from "../../apps/FileExplorer/FileExplorer";
import StartMenu from "../StartMenu/StartMenu";
import { useAuthStore } from "../../store/authStore";

const PINNED_APPS = [
  {
    appType: "start",
    label: "Start",
    icon: <img src="/logo.png" alt="Logo" className="w-8 h-8" />,
    open: null,
  },
  {
    appType: "explorer",
    label: "Files",
    icon: <Folder className="w-5 h-5 text-amber-300" />,
    open: null,
  },
  {
    appType: "notepad",
    label: "Notepad",
    icon: <NotebookText className="w-5 h-5 text-cyan-300" />,
    open: null,
  },
];

function getAppType(window: Window): string {
  if (window.appType) return window.appType;
  if (window.title.includes("Notepad")) return "notepad";
  if (window.title.includes("File Explorer")) return "explorer";
  return window.appType || window.title;
}

const Dock = () => {
  const { addWindow, focusWindow, minimizeWindow, windows } = useWindowStore();
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const logout = useAuthStore((s) => s.logout);
  const startButtonRef = useRef<HTMLButtonElement>(null);

  const handleNotepadClick = () => {
    const group = windows.filter((w) => getAppType(w) === "notepad");
    if (group.length) {
      const focused = group.find((w) => w.isFocused && !w.isMinimized);
      if (focused) {
        minimizeWindow(focused.id);
      } else {
        focusWindow(group[0].id);
      }
    } else {
      addWindow(createNotepadWindow());
    }
  };

  const handleFileExplorerClick = () => {
    addWindow({
      id: `explorer-${Date.now()}`,
      title: "File Explorer",
      content: <FileExplorer />,
      icon: <Folder className="w-4 h-4 text-amber-300" />,
      width: 440,
      height: 520,
      x: 120 + Math.random() * 200,
      y: 120 + Math.random() * 150,
      isFocused: true,
      isMaximized: false,
      isMinimized: false,
      zIndex: 1,
      resizable: true,
      appType: "explorer",
    });
  };

  const runningAppGroups: Record<string, { windows: Window[]; icon: ReactNode; label: string }> =
    {};
  for (const win of windows) {
    const appType = getAppType(win);
    if (!runningAppGroups[appType]) {
      const pin = PINNED_APPS.find((p) => p.appType === appType);
      runningAppGroups[appType] = {
        windows: [],
        icon: pin?.icon || win.icon,
        label: pin?.label || win.title,
      };
    }
    runningAppGroups[appType].windows.push(win);
  }

  const dockApps = [
    ...PINNED_APPS.map((p) => {
      const group = runningAppGroups[p.appType];
      return {
        ...p,
        running: !!group,
        windows: group?.windows || [],
      };
    }),
    ...Object.entries(runningAppGroups)
      .filter(([appType]) => !PINNED_APPS.some((p) => p.appType === appType))
      .map(([appType, group]) => ({
        appType,
        label: group.label,
        icon: group.icon,
        running: true,
        windows: group.windows,
      })),
  ];

  function showHoverMenu(e: React.MouseEvent, appType: string) {
    setHoveredApp(appType);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setHoverPos({ left: rect.left + rect.width / 2, top: rect.top });
  }

  function hideHoverMenu(appType: string) {
    setTimeout(() => {
      if (activePopup !== appType) {
        setHoveredApp(null);
        setHoverPos(null);
      }
    }, 50);
  }

  return (
    <div className="bg-zinc-900 text-white fixed left-0 right-0 bottom-0 p-1 h-[55px] grid grid-cols-3 gap-4 border-t border-zinc-600 z-[9999999999999999]">
      <div className="justify-self-start"></div>
      <div className="justify-self-center flex items-center justify-center">
        {dockApps.map((app) => {
          if (app.appType === "start")
            return (
                <DockItem
                  key="start"
                  icon={app.icon}
                  label={app.label}
                  hasIndicator={false}
                  onClick={() => setStartMenuOpen((v) => !v)}
                  buttonRef={startButtonRef}
                />
              );

          const onClick =
            app.appType === "explorer"
              ? handleFileExplorerClick
              : app.appType === "notepad"
              ? handleNotepadClick
              : app.windows && app.windows.length === 1
              ? () => focusWindow(app.windows[0].id)
              : undefined;

          const isFocused =
            app.windows && app.windows.some((w) => w.isFocused && !w.isMinimized);
          const isMinimized = app.windows && app.windows.every((w) => w.isMinimized);

          return (
            <div
              key={app.appType}
              className="relative"
              onMouseEnter={
                app.windows && app.windows.length > 1
                  ? (e) => showHoverMenu(e, app.appType)
                  : undefined
              }
              onMouseLeave={
                app.windows && app.windows.length > 1
                  ? () => hideHoverMenu(app.appType)
                  : undefined
              }
            >
              <DockItem
                icon={app.icon}
                label={app.label}
                onClick={onClick}
                hasIndicator={!!app.running}
                isFocused={isFocused}
                isMinimized={isMinimized}
              />
              {(hoveredApp === app.appType || activePopup === app.appType) &&
                app.windows &&
                app.windows.length > 1 &&
                hoverPos && (
                  <div
                    className="absolute z-[99999] bottom-14 left-1/2 -translate-x-1/2 bg-zinc-900/95 border border-zinc-700 rounded-lg shadow-xl px-2 py-2 min-w-[180px] animate-fade-in"
                    style={{ pointerEvents: "auto" }}
                    onMouseEnter={() => setActivePopup(app.appType)}
                    onMouseLeave={() => {
                      setActivePopup(null);
                      setHoveredApp(null);
                      setHoverPos(null);
                    }}
                  >
                    {app.windows.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-blue-600/40 cursor-pointer text-sm"
                        onClick={() => {
                          focusWindow(w.id);
                          setActivePopup(null);
                          setHoveredApp(null);
                          setHoverPos(null);
                        }}
                      >
                        {w.icon}
                        <span className="truncate">{w.title}</span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          );
        })}
      </div>
      <div className="justify-self-end flex items-center gap-2">
        <DockEnd />
      </div>
      <StartMenu
        visible={startMenuOpen}
        onClose={() => setStartMenuOpen(false)}
        userName={useAuthStore.getState().currentUser ?? "User"}
        onLogout={logout}
        ignoreRefs={[startButtonRef]}
      />
    </div>
  );
};

const DockItem = ({
  icon,
  label,
  onClick,
  hasIndicator = false,
  isFocused = false,
  isMinimized = false,
  buttonRef,
}: {
  icon: string | ReactNode;
  label: string;
  onClick?: () => void;
  hasIndicator?: boolean;
  isFocused?: boolean;
  isMinimized?: boolean;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}) => {
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        className="flex flex-col items-center justify-center hover:bg-zinc-700 p-1 w-10 h-10 rounded-lg transition-colors cursor-pointer"
        onClick={onClick}
        title={label}
      >
        {typeof icon === "string" ? (
          <img src={icon} alt={label} className="w-6 h-6 mb-1" />
        ) : (
          icon
        )}
      </button>
      {hasIndicator && (
        <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2">
          <div
            className={`
              h-0.5 rounded-full transition-all duration-200
              ${
                isFocused
                  ? "w-6 bg-blue-400"
                  : isMinimized
                  ? "w-2 bg-zinc-500"
                  : "w-2 bg-zinc-400"
              }
            `}
          />
        </div>
      )}
    </div>
  );
};

const DockEnd = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-end justify-center p-1 mr-3">
      <div className="text-xs">{time?.toLocaleTimeString()}</div>
      <div className="text-xs">{time?.toLocaleDateString()}</div>
    </div>
  );
};

export default Dock;
