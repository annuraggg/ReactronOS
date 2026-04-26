import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { File, Search } from "lucide-react";
import useWindowStore from "../../store/windowStore";
import { useFileSystemStore, type FileNode } from "../../store/filesystemStore";
import { launchAppForFile } from "../../utils/launchAppForFile";
import { APP_REGISTRY } from "../../system/apps/appRegistry";

type CommandItem = {
  id: string;
  label: string;
  description?: string;
  icon: ReactNode;
  action: () => void;
};

function searchFiles(
  node: FileNode,
  query: string,
  path: string[] = []
): { node: FileNode; path: string[] }[] {
  const results: { node: FileNode; path: string[] }[] = [];
  const lq = query.toLowerCase();

  if (node.name.toLowerCase().includes(lq) && path.length > 0) {
    results.push({ node, path });
  }
  if (node.type === "folder" && node.children) {
    for (const child of node.children) {
      results.push(...searchFiles(child, query, [...path, child.name]));
    }
  }
  return results;
}

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
};

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const addWindow = useWindowStore((state) => state.addWindow);
  const root = useFileSystemStore((state) => state.root);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const appCommands = useMemo<CommandItem[]>(
    () =>
      APP_REGISTRY.map((app) => ({
        id: `app-${app.id}`,
        label: app.name,
        description: "Application",
        icon: app.icon,
        action: () => {
          app.launch(addWindow);
          onClose();
        },
      })),
    [addWindow, onClose]
  );

  const fileResults = useCallback(() => {
    if (!query || query.length < 2) return [];
    return searchFiles(root, query)
      .slice(0, 6)
      .map(({ node, path }) => ({
        id: `file-${path.join("/")}`,
        label: node.name,
        description: path.slice(0, -1).join(" / ") || "Root",
        icon: <File size={18} className="text-zinc-400" />,
        action: () => {
          launchAppForFile(node, addWindow, path);
          onClose();
        },
      }));
  }, [query, root, addWindow, onClose]);

  const items = query
    ? [
        ...appCommands.filter(
          (item) =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.description?.toLowerCase().includes(query.toLowerCase())
        ),
        ...fileResults(),
      ]
    : appCommands;

  useEffect(() => setSelectedIndex(0), [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items.length > 0) items[selectedIndex]?.action();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999999] flex items-start justify-center pt-28"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-[560px] max-w-[95vw] overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900/95 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-4">
          <Search size={20} className="shrink-0 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-base text-zinc-100 outline-none placeholder:text-zinc-500"
            placeholder="Search apps or files…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="rounded border border-zinc-700 px-1.5 py-0.5 text-xs text-zinc-500">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {items.length === 0 && <div className="py-8 text-center text-sm text-zinc-500">No results found</div>}
          {items.map((item, idx) => (
            <button
              key={item.id}
              className={`flex w-full items-center gap-4 px-5 py-3 text-left transition-colors ${
                idx === selectedIndex ? "bg-blue-600/30 text-zinc-100" : "text-zinc-300 hover:bg-zinc-800/60"
              }`}
              onClick={item.action}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.label}</span>
                {item.description && <span className="block truncate text-xs text-zinc-500">{item.description}</span>}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 border-t border-zinc-800 px-5 py-2.5 text-xs text-zinc-600">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>ESC close</span>
        </div>
      </div>
    </div>
  );
}
