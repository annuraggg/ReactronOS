import { create } from "zustand";
import { v4 as uuid } from "uuid";
import { debouncedSaveFs, getActiveUserId, loadSystemState, saveSystemState } from "../utils/persistence";

export type FileNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  fileType?: string;
  content?: string;
  url?: string;
  children?: FileNode[];
  createdAt: string;
  updatedAt: string;
};

type VirtualFileSystem = {
  users: Record<
    string,
    {
      files: FileNode;
    }
  >;
};

type FileSystemStore = {
  fileSystem: VirtualFileSystem;
  currentUserId: string | null;
  root: FileNode;
  currentPath: string[];
  clipboard: { path: string[]; mode: "copy" | "cut" } | null;
  loadForCurrentUser: () => void;
  setCurrentPath: (path: string[]) => void;
  getNodeByPath: (path: string[]) => FileNode | null;
  createFile: (path: string[], name: string, content?: string, url?: string) => void;
  createFolder: (path: string[], name: string) => void;
  renameNode: (path: string[], newName: string) => void;
  deleteNode: (path: string[]) => void;
  moveNode: (fromPath: string[], toPath: string[]) => void;
  copyNode: (path: string[]) => void;
  cutNode: (path: string[]) => void;
  clearClipboard: () => void;
  pasteClipboard: (toPath: string[]) => { ok: boolean; error?: string };
  updateFileContent: (path: string[], content: string) => void;
};

const nowIso = () => new Date().toISOString();

function createFolderNode(name: string, children: FileNode[] = []): FileNode {
  const now = nowIso();
  return {
    id: uuid(),
    name,
    type: "folder",
    createdAt: now,
    updatedAt: now,
    children,
  };
}

function createDefaultRoot(): FileNode {
  return createFolderNode("/", [
    createFolderNode("Desktop"),
    createFolderNode("Documents", [
      {
        id: uuid(),
        name: "welcome.txt",
        type: "file",
        fileType: "txt",
        content: "Welcome to ReactronOS!",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
    ]),
    createFolderNode("Music"),
    createFolderNode("Images", [
      {
        id: uuid(),
        name: "sample1.jpg",
        type: "file",
        fileType: "jpg",
        url: "/images/sample1.jpg",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      {
        id: uuid(),
        name: "sample2.jpg",
        type: "file",
        fileType: "jpg",
        url: "/images/sample2.jpg",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
    ]),
    createFolderNode("Videos", [
      {
        id: uuid(),
        name: "video1.mp4",
        type: "file",
        fileType: "mp4",
        url: "/videos/video1.mp4",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
    ]),
  ]);
}

function isFolderNode(node: FileNode | null): node is FileNode {
  return Boolean(node && node.type === "folder");
}

function findNode(root: FileNode, path: string[]): FileNode | null {
  let current: FileNode = root;
  for (const segment of path) {
    if (current.type !== "folder" || !current.children) return null;
    const next = current.children.find((child) => child.name === segment);
    if (!next) return null;
    current = next;
  }
  return current;
}

function findParent(root: FileNode, path: string[]): [FileNode, string] | null {
  if (path.length === 0) return null;
  const parentPath = path.slice(0, -1);
  const targetName = path[path.length - 1];
  const parent = findNode(root, parentPath);
  if (!isFolderNode(parent) || !parent.children) return null;
  return [parent, targetName];
}

function inferFileType(name: string): string | undefined {
  if (!name.includes(".")) return undefined;
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return undefined;
  return ext;
}

function isPathEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((segment, idx) => segment === b[idx]);
}

function isPathPrefix(prefix: string[], path: string[]): boolean {
  if (prefix.length > path.length) return false;
  return prefix.every((segment, idx) => path[idx] === segment);
}

function cloneNodeWithFreshIds(node: FileNode): FileNode {
  const now = nowIso();
  if (node.type === "file") {
    return {
      ...node,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    };
  }
  return {
    ...node,
    id: uuid(),
    createdAt: now,
    updatedAt: now,
    children: (node.children || []).map((child) => cloneNodeWithFreshIds(child)),
  };
}

function readPersistedFs(): VirtualFileSystem {
  const { fileSystem } = loadSystemState();
  if (
    fileSystem &&
    typeof fileSystem === "object" &&
    "users" in (fileSystem as Record<string, unknown>)
  ) {
    const casted = fileSystem as VirtualFileSystem;
    if (casted.users && typeof casted.users === "object") return casted;
  }
  return { users: {} };
}

function ensureUserRoot(fileSystem: VirtualFileSystem, userId: string): FileNode {
  if (!fileSystem.users[userId]?.files) {
    fileSystem.users[userId] = { files: createDefaultRoot() };
  }
  return fileSystem.users[userId].files;
}

function persistFs(fileSystem: VirtualFileSystem) {
  saveSystemState({ fileSystem });
}

const initialFs = readPersistedFs();
const initialUser = getActiveUserId();
const initialRoot = initialUser ? ensureUserRoot(initialFs, initialUser) : createDefaultRoot();

export const useFileSystemStore = create<FileSystemStore>((set, get) => ({
  fileSystem: initialFs,
  currentUserId: initialUser,
  root: initialRoot,
  currentPath: [],
  clipboard: null,
  loadForCurrentUser: () => {
    const userId = getActiveUserId();
    if (!userId) {
      set({
        currentUserId: null,
        currentPath: [],
        root: createDefaultRoot(),
        clipboard: null,
      });
      return;
    }
    const fileSystem = readPersistedFs();
    const root = ensureUserRoot(fileSystem, userId);
    persistFs(fileSystem);
    set({
      currentUserId: userId,
      fileSystem,
      root,
      currentPath: ["Desktop"],
      clipboard: null,
    });
  },
  setCurrentPath: (path) => set({ currentPath: path }),
  getNodeByPath: (path) => findNode(get().root, path),

  createFile: (path, name, content = "", url) => {
    set((state) => {
      if (!state.currentUserId) return {};
      const nextFs = structuredClone(state.fileSystem);
      const root = ensureUserRoot(nextFs, state.currentUserId);
      const parent = findNode(root, path);
      if (!isFolderNode(parent)) return {};
      if (parent.children?.some((node) => node.name === name)) return {};
      const now = nowIso();
      parent.children = [
        ...(parent.children || []),
        {
          id: uuid(),
          name,
          type: "file",
          fileType: inferFileType(name),
          content,
          url,
          createdAt: now,
          updatedAt: now,
        },
      ];
      parent.updatedAt = now;
      persistFs(nextFs);
      return { fileSystem: nextFs, root };
    });
  },

  createFolder: (path, name) => {
    set((state) => {
      if (!state.currentUserId) return {};
      const nextFs = structuredClone(state.fileSystem);
      const root = ensureUserRoot(nextFs, state.currentUserId);
      const parent = findNode(root, path);
      if (!isFolderNode(parent)) return {};
      if (parent.children?.some((node) => node.name === name)) return {};
      const folder = createFolderNode(name, []);
      parent.children = [...(parent.children || []), folder];
      parent.updatedAt = nowIso();
      persistFs(nextFs);
      return { fileSystem: nextFs, root };
    });
  },

  renameNode: (path, newName) => {
    set((state) => {
      if (!state.currentUserId || path.length === 0) return {};
      const nextFs = structuredClone(state.fileSystem);
      const root = ensureUserRoot(nextFs, state.currentUserId);
      const parentInfo = findParent(root, path);
      if (!parentInfo) return {};
      const [parent, oldName] = parentInfo;
      if (
        parent.children?.some(
          (child) =>
            child.name.toLowerCase() === newName.toLowerCase() &&
            child.name.toLowerCase() !== oldName.toLowerCase()
        )
      ) {
        return {};
      }
      const target = parent.children?.find((child) => child.name === oldName);
      if (!target) return {};
      target.name = newName;
      target.fileType = target.type === "file" ? inferFileType(newName) : undefined;
      target.updatedAt = nowIso();
      parent.updatedAt = nowIso();
      persistFs(nextFs);
      return { fileSystem: nextFs, root };
    });
  },

  deleteNode: (path) => {
    set((state) => {
      if (!state.currentUserId || path.length === 0) return {};
      const nextFs = structuredClone(state.fileSystem);
      const root = ensureUserRoot(nextFs, state.currentUserId);
      const parentInfo = findParent(root, path);
      if (!parentInfo) return {};
      const [parent, targetName] = parentInfo;
      parent.children = (parent.children || []).filter((child) => child.name !== targetName);
      parent.updatedAt = nowIso();
      persistFs(nextFs);
      return { fileSystem: nextFs, root };
    });
  },

  moveNode: (fromPath, toPath) => {
    set((state) => {
      if (!state.currentUserId || fromPath.length === 0) return {};
      if (isPathEqual(fromPath.slice(0, -1), toPath)) return {};
      if (isPathPrefix(fromPath, toPath)) return {};
      const nextFs = structuredClone(state.fileSystem);
      const root = ensureUserRoot(nextFs, state.currentUserId);
      const sourceParentInfo = findParent(root, fromPath);
      if (!sourceParentInfo) return {};
      const [sourceParent, sourceName] = sourceParentInfo;
      const targetFolder = findNode(root, toPath);
      if (!isFolderNode(targetFolder)) return {};
      const sourceNode = (sourceParent.children || []).find((child) => child.name === sourceName);
      if (!sourceNode) return {};
      if (targetFolder.children?.some((child) => child.name === sourceNode.name)) return {};
      const sourceIndex = (sourceParent.children || []).findIndex((child) => child.name === sourceName);
      if (sourceIndex < 0) return {};
      const [node] = (sourceParent.children || []).splice(sourceIndex, 1);
      targetFolder.children = [...(targetFolder.children || []), node];
      sourceParent.updatedAt = nowIso();
      targetFolder.updatedAt = nowIso();
      persistFs(nextFs);
      return { fileSystem: nextFs, root };
    });
  },

  copyNode: (path) => set({ clipboard: { path: [...path], mode: "copy" } }),

  cutNode: (path) => set({ clipboard: { path: [...path], mode: "cut" } }),

  clearClipboard: () => set({ clipboard: null }),

  pasteClipboard: (toPath) => {
    let result: { ok: boolean; error?: string } = { ok: false, error: "Nothing to paste." };

    set((state) => {
      if (!state.currentUserId) {
        result = { ok: false, error: "No active user." };
        return {};
      }
      if (!state.clipboard) {
        result = { ok: false, error: "Clipboard is empty." };
        return {};
      }

      const { path: fromPath, mode } = state.clipboard;
      const sourceParentPath = fromPath.slice(0, -1);

      if (isPathEqual(sourceParentPath, toPath)) {
        result = { ok: false, error: "Cannot paste into the same location without renaming." };
        return {};
      }

      if (isPathPrefix(fromPath, toPath)) {
        result = { ok: false, error: "Cannot paste a folder into itself." };
        return {};
      }

      const nextFs = structuredClone(state.fileSystem);
      const root = ensureUserRoot(nextFs, state.currentUserId);
      const sourceNode = findNode(root, fromPath);
      const targetFolder = findNode(root, toPath);

      if (!sourceNode) {
        result = { ok: false, error: "Source item no longer exists." };
        return {};
      }
      if (!isFolderNode(targetFolder)) {
        result = { ok: false, error: "Target location is invalid." };
        return {};
      }
      if (targetFolder.children?.some((child) => child.name === sourceNode.name)) {
        result = { ok: false, error: `An item named "${sourceNode.name}" already exists here.` };
        return {};
      }

      if (mode === "copy") {
        targetFolder.children = [...(targetFolder.children || []), cloneNodeWithFreshIds(sourceNode)];
        targetFolder.updatedAt = nowIso();
        persistFs(nextFs);
        result = { ok: true };
        return { fileSystem: nextFs, root };
      }

      const sourceParentInfo = findParent(root, fromPath);
      if (!sourceParentInfo) {
        result = { ok: false, error: "Source parent is invalid." };
        return {};
      }
      const [sourceParent, sourceName] = sourceParentInfo;
      const sourceIndex = (sourceParent.children || []).findIndex((child) => child.name === sourceName);
      if (sourceIndex < 0) {
        result = { ok: false, error: "Source item no longer exists." };
        return {};
      }
      const [nodeToMove] = (sourceParent.children || []).splice(sourceIndex, 1);
      targetFolder.children = [...(targetFolder.children || []), nodeToMove];
      sourceParent.updatedAt = nowIso();
      targetFolder.updatedAt = nowIso();
      persistFs(nextFs);
      result = { ok: true };
      return { fileSystem: nextFs, root, clipboard: null };
    });

    return result;
  },

  updateFileContent: (path, content) => {
    set((state) => {
      if (!state.currentUserId) return {};
      const nextFs = structuredClone(state.fileSystem);
      const root = ensureUserRoot(nextFs, state.currentUserId);
      const node = findNode(root, path);
      if (!node || node.type !== "file") return {};
      node.content = content;
      node.updatedAt = nowIso();
      persistFs(nextFs);
      return { fileSystem: nextFs, root };
    });
  },
}));

let lastRoot = useFileSystemStore.getState().root;
useFileSystemStore.subscribe((state) => {
  if (state.root !== lastRoot) {
    lastRoot = state.root;
    debouncedSaveFs(state.fileSystem);
  }
});
