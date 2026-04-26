import { type MouseEvent, useEffect, useMemo, useState } from "react";
import {
  ClipboardPaste,
  ChevronLeft,
  ChevronRight,
  Copy,
  File as FileIcon,
  FilePlus2,
  Folder,
  FolderPlus,
  Home,
  Pencil,
  RefreshCw,
  Save,
  Scissors,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { launchAppForFile } from "../../utils/launchAppForFile";
import useWindowStore from "../../store/windowStore";
import { useFileSystemStore, type FileNode } from "../../store/filesystemStore";
import PromptDialog from "../../components/System/PromptDialog";
import ConfirmDialog from "../../components/System/ConfirmDialog";
import { notify } from "../../store/notificationStore";

function getPathCrumbs(path: string[]) {
  const crumbs: { name: string; path: string[] }[] = [{ name: "This PC", path: [] }];
  let acc: string[] = [];
  for (const segment of path) {
    acc = [...acc, segment];
    crumbs.push({ name: segment, path: [...acc] });
  }
  return crumbs;
}

type HistoryStack = { stack: string[][]; pointer: number };
type FileExplorerMode = "manage" | "save";

type FileExplorerProps = {
  mode?: FileExplorerMode;
  initialPath?: string[];
  suggestedFileName?: string;
  onSave?: (path: string[], fileName: string) => void;
  onCancel?: () => void;
};

type RenameState = { open: boolean; path: string[] | null; currentName: string };
type DeleteState = { open: boolean; path: string[] | null; targetName: string };
const DEFAULT_SAVE_PATH = ["Documents"];

export default function FileExplorer({
  mode = "manage",
  initialPath,
  suggestedFileName = "Untitled.txt",
  onSave,
  onCancel,
}: FileExplorerProps) {
  const {
    root,
    currentPath,
    setCurrentPath,
    getNodeByPath,
    createFile,
    createFolder,
    renameNode,
    deleteNode,
    moveNode,
    clipboard,
    copyNode,
    cutNode,
    pasteClipboard,
  } = useFileSystemStore();
  const addWindow = useWindowStore((state) => state.addWindow);

  const defaultSavePath = initialPath && initialPath.length > 0 ? initialPath : DEFAULT_SAVE_PATH;
  const [localPath, setLocalPath] = useState<string[]>(defaultSavePath);
  const [saveFileName, setSaveFileName] = useState(suggestedFileName);
  const [history, setHistory] = useState<HistoryStack>({
    stack: [mode === "save" ? defaultSavePath : currentPath],
    pointer: 0,
  });

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    node: FileNode | null;
    path: string[] | null;
  }>({ visible: false, x: 0, y: 0, node: null, path: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [draggingPath, setDraggingPath] = useState<string[] | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [renameState, setRenameState] = useState<RenameState>({
    open: false,
    path: null,
    currentName: "",
  });
  const [deleteState, setDeleteState] = useState<DeleteState>({
    open: false,
    path: null,
    targetName: "",
  });

  const activePath = mode === "save" ? localPath : currentPath;
  const setActivePath = mode === "save" ? setLocalPath : setCurrentPath;

  const pathKey = useMemo(() => JSON.stringify(initialPath ?? []), [initialPath]);

  useEffect(() => {
    if (mode === "save") {
      setLocalPath(defaultSavePath);
      setHistory({ stack: [defaultSavePath], pointer: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, pathKey]);

  useEffect(() => {
    setHistory((prev) => {
      const current = prev.stack[prev.pointer];
      if (current && JSON.stringify(current) === JSON.stringify(activePath)) return prev;
      const nextStack = prev.stack.slice(0, prev.pointer + 1);
      nextStack.push([...activePath]);
      return { stack: nextStack, pointer: nextStack.length - 1 };
    });
  }, [activePath]);

  useEffect(() => {
    const closeMenu = () => setContextMenu((state) => ({ ...state, visible: false }));
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("click", closeMenu);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("keydown", onEscape);
    };
  }, []);

  useEffect(() => setSaveFileName(suggestedFileName), [suggestedFileName]);

  const currentNode = getNodeByPath(activePath) || root;
  const visibleChildren =
    currentNode.type === "folder"
      ? (currentNode.children || []).filter((child) =>
          child.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
        )
      : [];
  const crumbs = getPathCrumbs(activePath);

  const sidebarFolders = [
    { label: "Home", icon: <Home size={16} />, path: [] },
    { label: "Desktop", icon: <Folder size={16} />, path: ["Desktop"] },
    { label: "Documents", icon: <Folder size={16} />, path: ["Documents"] },
    { label: "Music", icon: <Folder size={16} />, path: ["Music"] },
    { label: "Images", icon: <Folder size={16} />, path: ["Images"] },
    { label: "Videos", icon: <Folder size={16} />, path: ["Videos"] },
  ];

  const openNode = (node: FileNode, path: string[]) => {
    if (mode === "save") {
      if (node.type === "folder") setActivePath(path);
      else setSaveFileName(node.name);
      return;
    }
    if (node.type === "folder") setActivePath(path);
    else launchAppForFile(node, addWindow, path);
  };

  const handleSaveClick = () => {
    const fileName = saveFileName.trim();
    if (!fileName || !onSave) return;
    onSave(activePath, fileName);
  };

  return (
    <>
      <div
        id="file-explorer-root"
        className="flex h-full min-h-[300px] min-w-[340px] w-full flex-col overflow-hidden border border-zinc-800 bg-gradient-to-tr from-[#20232a] via-[#1b1e23] to-[#171821] text-zinc-100"
        tabIndex={0}
      >
        <div className="flex items-center gap-1 border-b border-zinc-800 bg-gradient-to-r from-[#23272f] to-[#191b21] px-2 py-1.5">
          <button
            className={`rounded p-1 transition hover:bg-blue-700/40 ${history.pointer <= 0 ? "pointer-events-none opacity-40" : ""}`}
            onClick={() => {
              if (history.pointer > 0) {
                setActivePath(history.stack[history.pointer - 1]);
                setHistory((prev) => ({ ...prev, pointer: prev.pointer - 1 }));
              }
            }}
            aria-label="Back"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            className={`rounded p-1 transition hover:bg-blue-700/40 ${
              history.pointer >= history.stack.length - 1 ? "pointer-events-none opacity-40" : ""
            }`}
            onClick={() => {
              if (history.pointer < history.stack.length - 1) {
                setActivePath(history.stack[history.pointer + 1]);
                setHistory((prev) => ({ ...prev, pointer: prev.pointer + 1 }));
              }
            }}
            aria-label="Forward"
          >
            <ChevronRight size={17} />
          </button>
          <button
            className="rounded p-1 transition hover:bg-blue-700/40"
            onClick={() => setActivePath([])}
            aria-label="Home"
          >
            <Home size={17} />
          </button>
          <button
            className="ml-1 rounded p-1 transition hover:bg-blue-700/40"
            onClick={() => setActivePath([...activePath])}
            aria-label="Refresh"
          >
            <RefreshCw size={17} />
          </button>

          <div className="mx-2 flex-1">
            <div className="flex items-center gap-1 overflow-x-auto rounded border border-zinc-800 bg-[#212327] px-2 py-[5px] text-xs">
              {crumbs.map((crumb, idx) => (
                <span key={`${crumb.name}-${idx}`} className="flex items-center gap-1">
                  {idx > 0 && <ChevronRight size={12} className="opacity-60" />}
                  <button
                    className="rounded px-1 transition hover:bg-blue-800/30"
                    onClick={() => setActivePath(crumb.path)}
                    style={{
                      fontWeight: idx === crumbs.length - 1 ? 700 : 400,
                      color: idx === crumbs.length - 1 ? "#fff" : "#60a5fa",
                    }}
                  >
                    {crumb.name}
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="mr-1 flex w-44 items-center gap-1 rounded border border-zinc-700 bg-zinc-800/80 px-2 py-1">
            <Search size={13} className="text-zinc-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-500"
            />
          </div>

          <button
            className="rounded p-1 transition hover:bg-blue-700/40"
            onClick={() => setNewFolderOpen(true)}
            title="New Folder"
          >
            <FolderPlus size={15} />
          </button>
          {mode === "manage" && (
            <button
              className="rounded p-1 transition hover:bg-blue-700/40"
              onClick={() => setNewFileOpen(true)}
              title="New File"
            >
              <FilePlus2 size={15} />
            </button>
          )}
        </div>

        <div className="flex h-0 min-h-0 flex-1">
          <div className="flex min-w-[90px] w-40 flex-col gap-1 border-r border-zinc-800 bg-gradient-to-b from-[#1a1d22] to-[#18191d] py-2">
            {sidebarFolders.map((item) => (
              <button
                key={item.label}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-[14px] font-semibold text-zinc-200 transition hover:bg-blue-800/25 ${
                  JSON.stringify(activePath) === JSON.stringify(item.path) ? "bg-blue-700/40 text-blue-100" : ""
                }`}
                onClick={() => setActivePath(item.path)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          <div
            className="relative flex-1 overflow-auto bg-gradient-to-br from-[#1b1d22] to-[#171821] p-3"
            onContextMenu={(event) => {
              if (mode === "save") return;
              event.preventDefault();
              setContextMenu({
                visible: true,
                x: event.clientX,
                y: event.clientY,
                node: null,
                path: activePath,
              });
            }}
          >
            {currentNode.type === "folder" && currentNode.children && currentNode.children.length === 0 && (
              <div className="mt-16 text-center text-base text-zinc-500">This folder is empty.</div>
            )}
            {searchTerm && visibleChildren.length === 0 && (
              <div className="mt-16 text-center text-sm text-zinc-500">No files match “{searchTerm}”.</div>
            )}

            <div className="flex flex-wrap gap-2">
              {currentNode.type === "folder" &&
                visibleChildren.map((node) => (
                  <NodeTile
                    key={node.id}
                    node={node}
                    onOpen={() => openNode(node, [...activePath, node.name])}
                    onDragStart={() => setDraggingPath([...activePath, node.name])}
                    onDropOnFolder={() => {
                      if (!draggingPath || node.type !== "folder") return;
                      moveNode(draggingPath, [...activePath, node.name]);
                      setDraggingPath(null);
                    }}
                    onDragEnd={() => setDraggingPath(null)}
                    onContextMenu={(event) => {
                      if (mode === "save") return;
                      event.preventDefault();
                      setContextMenu({
                        visible: true,
                        x: event.clientX,
                        y: event.clientY,
                        node,
                        path: [...activePath, node.name],
                      });
                    }}
                  />
                ))}
            </div>

            {mode === "manage" && contextMenu.visible && contextMenu.path && (
              <div
                className="fixed z-50 min-w-[160px] rounded border border-zinc-700 bg-[#23242a] py-1 shadow-lg"
                style={{ top: contextMenu.y + 2, left: contextMenu.x + 2 }}
                onClick={(event) => event.stopPropagation()}
                onContextMenu={(event) => event.preventDefault()}
              >
                {contextMenu.node && (
                  <button
                    className="block w-full px-4 py-2 text-left text-sm text-zinc-200 hover:bg-blue-700/25"
                    onClick={() => {
                      setContextMenu((state) => ({ ...state, visible: false }));
                      openNode(contextMenu.node!, contextMenu.path!);
                    }}
                  >
                    Open
                  </button>
                )}
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-200 hover:bg-blue-700/25"
                  onClick={() => {
                    if (!contextMenu.node) return;
                    setContextMenu((state) => ({ ...state, visible: false }));
                    setRenameState({
                      open: true,
                      path: contextMenu.path,
                      currentName: contextMenu.node.name,
                    });
                  }}
                  disabled={!contextMenu.node}
                >
                  <Pencil size={14} /> Rename
                </button>
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-200 hover:bg-red-700/40"
                  onClick={() => {
                    if (!contextMenu.node) return;
                    setContextMenu((state) => ({ ...state, visible: false }));
                    setDeleteState({
                      open: true,
                      path: contextMenu.path,
                      targetName: contextMenu.node.name,
                    });
                  }}
                  disabled={!contextMenu.node}
                >
                  <Trash2 size={14} /> Delete
                </button>
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-200 hover:bg-blue-700/25"
                  onClick={() => {
                    if (!contextMenu.node) return;
                    copyNode(contextMenu.path!);
                    setContextMenu((state) => ({ ...state, visible: false }));
                    notify({ type: "info", message: `"${contextMenu.node.name}" copied` });
                  }}
                  disabled={!contextMenu.node}
                >
                  <Copy size={14} /> Copy
                </button>
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-200 hover:bg-blue-700/25"
                  onClick={() => {
                    if (!contextMenu.node) return;
                    cutNode(contextMenu.path!);
                    setContextMenu((state) => ({ ...state, visible: false }));
                    notify({ type: "info", message: `"${contextMenu.node.name}" cut` });
                  }}
                  disabled={!contextMenu.node}
                >
                  <Scissors size={14} /> Cut
                </button>
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-200 hover:bg-blue-700/25"
                  onClick={() => {
                    const targetPath =
                      contextMenu.node?.type === "folder"
                        ? contextMenu.path!
                        : contextMenu.path!.slice(0, -1);
                    const result = pasteClipboard(targetPath);
                    setContextMenu((state) => ({ ...state, visible: false }));
                    if (!result.ok) {
                      notify({ type: "error", message: result.error || "Paste failed" });
                      return;
                    }
                    notify({ type: "success", message: "Pasted successfully" });
                  }}
                  disabled={!clipboard}
                >
                  <ClipboardPaste size={14} /> Paste
                </button>
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-200 hover:bg-blue-700/25"
                  onClick={() => {
                    setContextMenu((state) => ({ ...state, visible: false }));
                    setNewFolderOpen(true);
                  }}
                >
                  <FolderPlus size={14} /> New Folder
                </button>
              </div>
            )}
          </div>
        </div>

        {mode === "save" && (
          <div className="flex items-center gap-2 border-t border-zinc-800 bg-[#1b1f25] px-3 py-2">
            <label className="text-xs text-zinc-400">File name</label>
            <input
              value={saveFileName}
              onChange={(e) => setSaveFileName(e.target.value)}
              className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
              placeholder="Untitled.txt"
            />
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1 rounded bg-zinc-700 px-2.5 py-1.5 text-xs hover:bg-zinc-600"
            >
              <X size={14} /> Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveClick}
              className="inline-flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1.5 text-xs font-semibold hover:bg-blue-700"
            >
              <Save size={14} /> Save
            </button>
          </div>
        )}
      </div>

      <PromptDialog
        open={newFolderOpen}
        title="New Folder"
        label="Folder name"
        placeholder="Folder"
        confirmText="Create"
        onCancel={() => setNewFolderOpen(false)}
        onConfirm={(value) => {
          if (!value) return;
          createFolder(activePath, value);
          setNewFolderOpen(false);
          notify({ type: "success", message: `Folder "${value}" created` });
        }}
      />

      <PromptDialog
        open={newFileOpen}
        title="New File"
        label="File name"
        placeholder="Untitled.txt"
        confirmText="Create"
        onCancel={() => setNewFileOpen(false)}
        onConfirm={(value) => {
          if (!value) return;
          createFile(activePath, value, "");
          setNewFileOpen(false);
          notify({ type: "success", message: `File "${value}" created` });
        }}
      />

      <PromptDialog
        open={renameState.open}
        title="Rename"
        label="New name"
        initialValue={renameState.currentName}
        confirmText="Rename"
        onCancel={() => setRenameState({ open: false, path: null, currentName: "" })}
        onConfirm={(value) => {
          if (!value || !renameState.path) return;
          renameNode(renameState.path, value);
          setRenameState({ open: false, path: null, currentName: "" });
          notify({ type: "success", message: "Renamed successfully" });
        }}
      />

      <ConfirmDialog
        open={deleteState.open}
        title="Delete"
        message={`Delete "${deleteState.targetName}"?`}
        confirmText="Delete"
        danger
        onCancel={() => setDeleteState({ open: false, path: null, targetName: "" })}
        onConfirm={() => {
          if (!deleteState.path) return;
          deleteNode(deleteState.path);
          setDeleteState({ open: false, path: null, targetName: "" });
          notify({ type: "success", message: "Deleted successfully" });
        }}
      />
    </>
  );
}

function NodeTile({
  node,
  onOpen,
  onContextMenu,
  onDragStart,
  onDropOnFolder,
  onDragEnd,
}: {
  node: FileNode;
  onOpen: () => void;
  onContextMenu: (e: MouseEvent) => void;
  onDragStart: () => void;
  onDropOnFolder: () => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      className="group relative flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded p-1 transition-all duration-100 hover:bg-blue-900/40"
      tabIndex={0}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        if (node.type === "folder") event.preventDefault();
      }}
      onDrop={(event) => {
        if (node.type !== "folder") return;
        event.preventDefault();
        onDropOnFolder();
      }}
      onDoubleClick={onOpen}
      onContextMenu={onContextMenu}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
      }}
    >
      <div className="flex h-7 w-7 items-center justify-center">
        {node.type === "folder" ? (
          <Folder size={24} className="text-yellow-400" />
        ) : (
          <FileIcon size={22} className="text-blue-400" />
        )}
      </div>
      <span className="w-14 truncate text-center text-[11px] font-medium text-zinc-100">{node.name}</span>
    </div>
  );
}
