import { useEffect, useState } from "react";
import Desktop from "./components/Desktop/Desktop";
import WindowManager from "./components/WindowManager/WindowManager";
import useWindowStore from "./store/windowStore";
import { motion, AnimatePresence } from "framer-motion";
import { loadSystemState } from "./utils/persistence";
import { createWindowFromPersisted } from "./utils/windowFactory";
import CommandPalette from "./components/CommandPalette/CommandPalette";
import AuthScreen from "./components/Auth/AuthScreen";
import { useAuthStore } from "./store/authStore";
import { useFileSystemStore } from "./store/filesystemStore";
import { useSettingsStore } from "./store/settingsStore";
import NotificationCenter from "./components/System/NotificationCenter";

const BOOT_MIN_DURATION = 1500; // Keep boot animation visible long enough to avoid visual flashing.

const BootScreen = () => (
  <motion.div
    initial={{ opacity: 1 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, transition: { duration: 0.4 } }}
    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#111827]"
    style={{
      background:
        "radial-gradient(ellipse at 50% 45%, #0d1b2a 0%, #111827 60%, #090a0f 100%)",
    }}
  >
    <motion.img
      src="/logo.png"
      alt="Reactron Logo"
      width={96}
      height={96}
      className="mb-7 rounded-2xl shadow-xl"
      initial={{ opacity: 0, scale: 0.82, rotate: -10, y: 60 }}
      animate={{
        opacity: 1,
        scale: 1,
        rotate: 0,
        y: 0,
        transition: {
          type: "spring",
          stiffness: 120,
          damping: 18,
          delay: 0.15,
        },
      }}
      exit={{ opacity: 0, scale: 1.1, y: -40, transition: { duration: 0.35 } }}
      draggable={false}
    />

    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { delay: 0.3, duration: 0.45 },
      }}
      exit={{ opacity: 0, y: 30, transition: { duration: 0.2 } }}
      className="text-2xl font-semibold text-white/90 tracking-wide select-none"
      style={{ textShadow: "0 2px 24px #000b" }}
    >
      Starting ReactronOS
    </motion.div>
  </motion.div>
);

const App = () => {
  const [booting, setBooting] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const currentUser = useAuthStore((state) => state.currentUser);
  const loadFsForCurrentUser = useFileSystemStore((state) => state.loadForCurrentUser);
  const loadSettingsForCurrentUser = useSettingsStore((state) => state.loadForCurrentUser);
  const windows = useWindowStore((state) => state.windows);
  const {
    addWindow,
    focusWindow,
    maximizeWindow,
    minimizeWindow,
    closeWindow,
    updateWindowPosition,
    updateWindowSize,
    snapWindow,
    resetForSession,
  } = useWindowStore();

  const waitForAllAssets = () =>
    new Promise<void>((resolve) => {
      if (document.readyState === "complete") {
        resolve();
      } else {
        window.addEventListener("load", () => {
          setTimeout(() => resolve(), 150);
        });
      }
    });

  useEffect(() => {
    let cancelled = false;

    const doBoot = async () => {
      if (!currentUser) {
        setBooting(false);
        resetForSession();
        return;
      }

      resetForSession();
      loadFsForCurrentUser();
      loadSettingsForCurrentUser();
      setBooting(true);

      const bootStartTime = Date.now();
      const minBootTime = new Promise((r) =>
        setTimeout(r, BOOT_MIN_DURATION - Math.max(0, Date.now() - bootStartTime))
      );
      const assetLoad = waitForAllAssets();
      await Promise.all([minBootTime, assetLoad]);
      if (cancelled) return;

      const { windows: persistedWindows } = loadSystemState(currentUser);
      if (persistedWindows && persistedWindows.length > 0) {
        for (const pw of persistedWindows) {
          const result = createWindowFromPersisted(pw);
          if (result) {
            addWindow({
              id: pw.id,
              title: pw.title,
              appType: pw.appType,
              appData: pw.appData,
              content: result.content,
              icon: result.icon,
              width: pw.width,
              height: pw.height,
              x: pw.x,
              y: pw.y,
              zIndex: pw.zIndex,
              isMaximized: pw.isMaximized,
              isMinimized: pw.isMinimized,
              isFocused: false,
              resizable: true,
            });
          }
        }
      } else {
        addWindow({
          id: "welcome",
          title: "Welcome",
          content: (
            <div style={{ padding: 32, fontSize: 22 }}>
              Welcome to Reactron, {currentUser}!
            </div>
          ),
          icon: null,
          isTransient: true,
          x: 200,
          y: 140,
        });
      }

      if (!cancelled) {
        setBooting(false);
      }
    };

    void doBoot();

    return () => {
      cancelled = true;
    };
  }, [addWindow, currentUser, loadFsForCurrentUser, loadSettingsForCurrentUser, resetForSession]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div>
      <AnimatePresence>{booting && <BootScreen key="boot" />}</AnimatePresence>
      {!booting && (
        <>
          <Desktop />
          {windows.map((window) => (
            <WindowManager
              key={window.id}
              title={window.title}
              icon={window.icon}
              isFocused={window.isFocused || false}
              isMaximized={window.isMaximized || false}
              isMinimized={window.isMinimized || false}
              zIndex={window.zIndex || 1}
              position={{ x: window.x || 100, y: window.y || 100 }}
              size={{
                width: window.width || 500,
                height: window.height || 400,
              }}
              onFocus={() => focusWindow(window.id)}
              onMaximize={() => maximizeWindow(window.id)}
              onMinimize={() => minimizeWindow(window.id)}
              onClose={() => closeWindow(window.id)}
              onPositionChange={(position) => updateWindowPosition(window.id, position)}
              onSizeChange={(size) => updateWindowSize(window.id, size)}
              onSnap={(side) => snapWindow(window.id, side)}
            >
              {window.content}
            </WindowManager>
          ))}
          <CommandPalette
            open={commandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
          />
          <NotificationCenter />
        </>
      )}
    </div>
  );
};

export default App;
