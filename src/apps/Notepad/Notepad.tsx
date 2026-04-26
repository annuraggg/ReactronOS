import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  IconDeviceFloppy,
  IconFile,
  IconCopy,
  IconCut,
  IconClipboard,
  IconSearch,
  IconZoomIn,
  IconZoomOut,
  IconClipboardTextFilled,
} from "@tabler/icons-react";
import { useFileSystemStore } from "../../store/filesystemStore";
import FileExplorer from "../FileExplorer/FileExplorer";
import ConfirmDialog from "../../components/System/ConfirmDialog";
import { notify } from "../../store/notificationStore";

interface NotepadProps {
  onSave?: (content: string, fileName: string) => void;
  onFileNameChange?: (fileName: string) => void;
  initialContent?: string;
  initialFileName?: string;
  filePath?: string[];
}

const Notepad: React.FC<NotepadProps> = ({
  onSave,
  onFileNameChange,
  initialContent = "",
  initialFileName = "Untitled.txt",
  filePath,
}) => {
  const [content, setContent] = useState(initialContent);
  const [fileName, setFileName] = useState(initialFileName);
  const [currentFilePath, setCurrentFilePath] = useState<string[] | undefined>(filePath);
  const [isModified, setIsModified] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [findText, setFindText] = useState("");
  const [showFind, setShowFind] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);

  const { updateFileContent, createFile, getNodeByPath } = useFileSystemStore();

  const lines = content.split("\n");
  const totalLines = Math.max(lines.length, 20);
  const lineHeight = fontSize * 1.4;

  useEffect(() => {
    setContent(initialContent ?? "");
    setFileName(initialFileName || "Untitled.txt");
    setCurrentFilePath(filePath);
    setIsModified(false);
  }, [initialContent, initialFileName, filePath]);

  const updateCursorPosition = useCallback(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const textBeforeCursor = content.substring(0, start);
    const lineArray = textBeforeCursor.split("\n");
    const line = lineArray.length;
    const column = lineArray[lineArray.length - 1].length + 1;

    setCursorPosition({ line, column });
  }, [content]);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  useEffect(() => {
    updateCursorPosition();
  }, [content, updateCursorPosition]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setIsModified(true);
    updateCursorPosition();
  };

  const handlePersistToPath = useCallback(
    (path: string[], name: string, value: string) => {
      const fullPath = [...path, name];
      const existing = getNodeByPath(fullPath);
      if (existing?.type === "file") {
        updateFileContent(fullPath, value);
      } else {
        createFile(path, name, value);
      }
      setCurrentFilePath(fullPath);
      setFileName(name);
      onFileNameChange?.(name);
    },
    [createFile, getNodeByPath, onFileNameChange, updateFileContent]
  );

  const handleSave = useCallback(() => {
    if (currentFilePath && currentFilePath.length > 0) {
      updateFileContent(currentFilePath, content);
      setFileName(currentFilePath[currentFilePath.length - 1]);
      onSave?.(content, currentFilePath[currentFilePath.length - 1]);
      setIsModified(false);
      notify({ type: "success", message: "File saved" });
      return;
    }

    setShowSaveDialog(true);
  }, [content, currentFilePath, onSave, updateFileContent]);

  const handleSaveAs = useCallback(() => {
    setShowSaveDialog(true);
  }, []);

  const handleNew = useCallback(() => {
    if (isModified) {
      setShowDiscardConfirm(true);
      return;
    }
    setContent("");
    setFileName("Untitled.txt");
    setCurrentFilePath(undefined);
    setIsModified(false);
    onFileNameChange?.("Untitled.txt");
  }, [isModified, onFileNameChange]);

  const handleCopy = useCallback(() => {
    if (!textareaRef.current) return;
    const selectedText = textareaRef.current.value.substring(
      textareaRef.current.selectionStart,
      textareaRef.current.selectionEnd
    );
    navigator.clipboard.writeText(selectedText || content).catch(() => undefined);
  }, [content]);

  const handleCut = useCallback(() => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = content.substring(start, end);

    if (selectedText) {
      navigator.clipboard.writeText(selectedText).catch(() => undefined);
      const newContent = content.substring(0, start) + content.substring(end);
      setContent(newContent);
      setIsModified(true);
    }
  }, [content]);

  const handlePaste = useCallback(async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (textareaRef.current) {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const newContent =
          content.substring(0, start) + clipboardText + content.substring(end);
        setContent(newContent);
        setIsModified(true);
      }
    } catch {
      // ignore clipboard read failures
    }
  }, [content]);

  const handleFind = useCallback(() => {
    setShowFind((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => findInputRef.current?.focus(), 100);
      }
      return next;
    });
  }, []);

  const handleZoomIn = useCallback(() => {
    setFontSize((prev) => Math.min(prev + 2, 24));
  }, []);

  const handleZoomOut = useCallback(() => {
    setFontSize((prev) => Math.max(prev - 2, 10));
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey) {
      switch (e.key) {
        case "s":
          e.preventDefault();
          handleSave();
          break;
        case "n":
          e.preventDefault();
          handleNew();
          break;
        case "c":
          e.preventDefault();
          handleCopy();
          break;
        case "x":
          e.preventDefault();
          handleCut();
          break;
        case "v":
          e.preventDefault();
          handlePaste();
          break;
        case "f":
          e.preventDefault();
          handleFind();
          break;
        case "=":
        case "+":
          e.preventDefault();
          handleZoomIn();
          break;
        case "-":
          e.preventDefault();
          handleZoomOut();
          break;
      }
    }
  };

  return (
    <div className="relative isolate flex flex-col h-full overflow-hidden bg-zinc-900 text-zinc-100 font-sans">
      <div className="relative z-30 shrink-0 flex bg-gradient-to-r from-zinc-800 to-zinc-800/90 border-b border-zinc-700/50 px-4 py-2.5 shadow-lg backdrop-blur-sm">
        <div className="flex gap-8 text-sm font-medium">
          <MenuDropdown title="File">
            <MenuItem onClick={handleNew} icon={<IconFile size={16} />} shortcut="Ctrl+N">
              New
            </MenuItem>
            <MenuItem
              onClick={handleSave}
              icon={<IconDeviceFloppy size={16} />}
              shortcut="Ctrl+S"
            >
              Save
            </MenuItem>
            <MenuItem onClick={handleSaveAs} icon={<IconDeviceFloppy size={16} />}>
              Save As…
            </MenuItem>
          </MenuDropdown>

          <MenuDropdown title="Edit">
            <MenuItem onClick={handleCopy} icon={<IconCopy size={16} />} shortcut="Ctrl+C">
              Copy
            </MenuItem>
            <MenuItem onClick={handleCut} icon={<IconCut size={16} />} shortcut="Ctrl+X">
              Cut
            </MenuItem>
            <MenuItem onClick={handlePaste} icon={<IconClipboard size={16} />} shortcut="Ctrl+V">
              Paste
            </MenuItem>
            <MenuDivider />
            <MenuItem onClick={handleFind} icon={<IconSearch size={16} />} shortcut="Ctrl+F">
              Find
            </MenuItem>
          </MenuDropdown>

          <MenuDropdown title="View">
            <MenuItem onClick={handleZoomIn} icon={<IconZoomIn size={16} />} shortcut="Ctrl++">
              Zoom In
            </MenuItem>
            <MenuItem onClick={handleZoomOut} icon={<IconZoomOut size={16} />} shortcut="Ctrl+-">
              Zoom Out
            </MenuItem>
            <MenuDivider />
            <MenuItem onClick={() => setLineNumbers(!lineNumbers)}>
              <span className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-sm ${
                    lineNumbers ? "bg-blue-500" : "border border-zinc-500"
                  }`}
                />
                Line Numbers
              </span>
            </MenuItem>
            <MenuItem onClick={() => setWordWrap(!wordWrap)}>
              <span className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-sm ${
                    wordWrap ? "bg-blue-500" : "border border-zinc-500"
                  }`}
                />
                Word Wrap
              </span>
            </MenuItem>
          </MenuDropdown>
        </div>
      </div>

      {showFind && (
        <div className="relative z-20 flex items-center gap-4 bg-zinc-800/80 backdrop-blur border-b border-zinc-700/50 px-6 py-3">
          <div className="flex items-center gap-3 flex-1">
            <IconSearch size={18} className="text-zinc-400" />
            <input
              ref={findInputRef}
              type="text"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder="Find in document..."
              className="bg-zinc-700/70 border border-zinc-600/50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 flex-1 max-w-md transition-all"
            />
          </div>
          <button
            onClick={() => setShowFind(false)}
            className="text-zinc-400 hover:text-zinc-200 p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      <div className="relative z-0 flex flex-1 min-h-0 bg-zinc-900">
        {lineNumbers && (
          <div
            ref={lineNumbersRef}
            className="bg-zinc-850 border-r border-zinc-700/50 px-4 py-4 text-zinc-500 text-right select-none font-mono overflow-hidden w-16 flex-shrink-0"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: `${lineHeight}px`,
              height: "100%",
            }}
          >
            <div style={{ paddingBottom: "50vh" }}>
              {Array.from({ length: totalLines }, (_, i) => (
                <div
                  key={i + 1}
                  style={{
                    height: `${lineHeight}px`,
                    lineHeight: `${lineHeight}px`,
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onClick={updateCursorPosition}
            onKeyUp={updateCursorPosition}
            onScroll={handleScroll}
            className="w-full h-full bg-transparent text-zinc-100 p-4 border-none outline-none resize-none font-mono"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: `${lineHeight}px`,
              whiteSpace: wordWrap ? "pre-wrap" : "pre",
              overflowWrap: wordWrap ? "break-word" : "normal",
              tabSize: 4,
            }}
            placeholder="Start typing your document..."
            spellCheck={false}
          />
        </div>
      </div>

      <div className="shrink-0 bg-gradient-to-r from-zinc-800 to-zinc-800/90 border-t border-zinc-700/50 px-6 py-2.5 text-xs text-zinc-400 flex justify-between items-center backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            {fileName}
            {isModified ? " •" : ""}
          </span>
          <span>{content.length} chars</span>
          <span>{lines.length} lines</span>
          <span>{content.split(/\s+/).filter((w) => w.length > 0).length} words</span>
        </div>
        <div className="flex items-center gap-6">
          <span>
            Line {cursorPosition.line}, Column {cursorPosition.column}
          </span>
          <span>{fontSize}px</span>
          <span>UTF-8</span>
          <span className="text-green-400">Ready</span>
        </div>
      </div>

      {showSaveDialog && (
        <div className="absolute inset-0 z-50 bg-black/50 p-4">
          <div className="h-full w-full rounded-xl overflow-hidden border border-zinc-700 shadow-2xl">
            <FileExplorer
              mode="save"
              initialPath={currentFilePath?.slice(0, -1) ?? ["Documents"]}
              suggestedFileName={fileName}
              onCancel={() => setShowSaveDialog(false)}
              onSave={(path, targetName) => {
                handlePersistToPath(path, targetName, content);
                setIsModified(false);
                setShowSaveDialog(false);
                onSave?.(content, targetName);
                notify({ type: "success", message: "File saved" });
              }}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDiscardConfirm}
        title="Discard changes?"
        message="You have unsaved changes. Do you want to discard them?"
        confirmText="Discard"
        danger
        onCancel={() => setShowDiscardConfirm(false)}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          setContent("");
          setFileName("Untitled.txt");
          setCurrentFilePath(undefined);
          setIsModified(false);
          onFileNameChange?.("Untitled.txt");
        }}
      />
    </div>
  );
};

const MenuDropdown = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative z-40">
      <button
        className="px-4 py-2 hover:bg-zinc-700/50 rounded-lg transition-all duration-200 text-zinc-200 hover:text-white"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
      >
        {title}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 bg-zinc-800/95 backdrop-blur-xl border border-zinc-600/50 shadow-2xl rounded-lg mt-1 min-w-56 z-50 overflow-hidden">
          {children}
        </div>
      )}
    </div>
  );
};

const MenuItem = ({
  children,
  onClick,
  icon,
  shortcut,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  shortcut?: string;
}) => (
  <button
    onClick={onClick}
    className="w-full text-left px-4 py-3 hover:bg-zinc-700/70 flex items-center gap-3 text-sm transition-all text-zinc-200 hover:text-white first:rounded-t-lg last:rounded-b-lg"
  >
    <span className="flex items-center gap-3 flex-1">
      {icon && <span className="text-zinc-400 flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
    {shortcut && <span className="text-zinc-500 text-xs font-mono">{shortcut}</span>}
  </button>
);

const MenuDivider = () => <div className="border-t border-zinc-600/50 my-1 mx-2" />;

export const createNotepadWindow = () => {
  const notepadId = `notepad-${Date.now()}`;
  return {
    id: notepadId,
    title: "Untitled.txt - Notepad",
    content: <Notepad initialContent="" initialFileName="Untitled.txt" />,
    icon: <IconClipboardTextFilled className="w-4 h-4" color="#5ac1df" />,
    appType: "notepad",
    appData: { fileName: "Untitled.txt" } as Record<string, unknown>,
    width: 900,
    height: 500,
    x: 0,
    y: 0,
    isFocused: true,
    isMaximized: false,
    isMinimized: false,
    zIndex: 1,
    resizable: true,
  };
};

export default Notepad;
