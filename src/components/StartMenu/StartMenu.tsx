import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Search } from "lucide-react";
import useWindowStore from "../../store/windowStore";
import { useClickOutside } from "../../hooks/useClickOutside";
import { APP_REGISTRY } from "../../system/apps/appRegistry";

type StartMenuProps = {
  visible: boolean;
  onClose: () => void;
  userName?: string;
  onLogout?: () => void;
  ignoreRefs?: Array<React.RefObject<HTMLElement | null>>;
};

export default function StartMenu({
  visible,
  onClose,
  userName,
  onLogout,
  ignoreRefs = [],
}: StartMenuProps) {
  const [search, setSearch] = useState("");
  const addWindow = useWindowStore((state) => state.addWindow);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, onClose, visible, ignoreRefs);

  const filteredApps = useMemo(
    () =>
      APP_REGISTRY.filter((app) => app.name.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={menuRef}
          tabIndex={-1}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="fixed bottom-20 left-1/2 z-[999] flex h-[520px] w-[520px] max-w-[98vw] -translate-x-1/2 flex-col rounded-2xl border border-zinc-800 bg-zinc-900/90 text-zinc-100 shadow-2xl"
          style={{ backdropFilter: "blur(16px)" }}
        >
          <div className="flex items-center rounded-t-2xl border-b border-zinc-800/60 bg-zinc-900/90 px-7 py-3">
            <Search size={18} className="mr-2 text-zinc-400" />
            <input
              type="text"
              className="flex-1 border-0 bg-transparent text-base text-zinc-100 outline-none"
              placeholder="Type to search apps…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid flex-1 content-start grid-cols-2 gap-4 overflow-y-auto px-8 pb-4 pt-6 sm:grid-cols-3 lg:grid-cols-4">
            {filteredApps.length === 0 && (
              <div className="col-span-full py-10 text-center text-base text-zinc-400">No apps found</div>
            )}
            {filteredApps.map((app) => (
              <button
                key={app.id}
                className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border border-transparent px-1 transition-all hover:border-zinc-600 hover:bg-zinc-800/70 active:bg-zinc-700/80"
                onClick={() => {
                  onClose();
                  app.launch(addWindow);
                }}
                type="button"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-100">
                  {app.icon}
                </span>
                <span className="mt-1 max-w-[72px] truncate text-[13px] font-semibold text-zinc-100">
                  {app.name}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-auto flex items-center justify-between rounded-b-2xl border-t border-zinc-800/70 bg-zinc-800/80 px-7 py-3">
            <span className="flex items-center gap-2 text-base font-semibold text-zinc-300">
              {userName || "User"}
            </span>
            <button
              className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-[13px] text-zinc-300 transition hover:bg-zinc-800/60 hover:text-red-400"
              onClick={() => {
                onClose();
                onLogout?.();
              }}
              type="button"
            >
              <LogOut size={15} /> Log out
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
