import { extensionToApp } from "./extensionAppMap";
import Notepad from "../apps/Notepad/Notepad";
import {
  IconClipboardTextFilled,
  IconPhoto,
  IconVideo,
} from "@tabler/icons-react";
import ImageViewer from "../apps/ImageViewer/ImageViewer";
import VideoPlayer from "../apps/VideoPlayer/VideoPlayer";
import VsCode from "../apps/VSCode/VSCode";
import VsCodeIcon from "../apps/VSCode/VSCodeIcon";
import type { FileNode } from "../store/filesystemStore";
import { notify } from "../store/notificationStore";
import type { Window } from "../store/windowStore";

export function launchAppForFile(
  node: FileNode,
  addWindow: (win: Window) => void,
  filePath?: string[],
  onClose?: () => void
) {
  if (node.type !== "file") return;

  const ext = node.name.split(".").pop()?.toLowerCase() || "";
  const appKey = extensionToApp[ext];

  if (appKey === "notepad") {
    addWindow({
      id: `notepad-${Date.now()}`,
      title: node.name + " - Notepad",
      content: (
        <Notepad
          initialContent={node.content || ""}
          initialFileName={node.name}
          filePath={filePath}
        />
      ),
      icon: <IconClipboardTextFilled className="w-4 h-4" color="#5ac1df" />,
      appType: "notepad",
      appData: {
        fileName: node.name,
        filePath: filePath ?? null,
      },
      width: 900,
      height: 500,
      x: 120 + Math.random() * 200,
      y: 120 + Math.random() * 150,
      isFocused: true,
      isMaximized: false,
      isMinimized: false,
      zIndex: 10,
      resizable: true,
    });
    return;
  }

  if (appKey === "imageviewer") {
    const windowId = `imageviewer-${Date.now()}`;
    addWindow({
      id: windowId,
      title: node.name + " - Image Viewer",
      icon: <IconPhoto className="w-4 h-4" color="#a3e635" />,
      appType: "imageviewer",
      width: 820,
      height: 650,
      x: 120 + Math.random() * 200,
      y: 120 + Math.random() * 150,
      isFocused: true,
      isMaximized: false,
      isMinimized: false,
      zIndex: 14,
      resizable: true,
      content: (
        <ImageViewer
          src={node.url || node.content || ""}
          alt={node.name}
          onClose={onClose}
        />
      ),
    });
    return;
  }

  if (appKey === "videoplayer") {
    const windowId = `videoplayer-${Date.now()}`;
    addWindow({
      id: windowId,
      title: node.name + " - Video Player",
      icon: <IconVideo className="w-4 h-4" color="#38bdf8" />,
      appType: "videoplayer",
      width: 900,
      height: 600,
      x: 140 + Math.random() * 180,
      y: 130 + Math.random() * 120,
      isFocused: true,
      isMaximized: false,
      isMinimized: false,
      zIndex: 14,
      resizable: true,
      content: (
        <VideoPlayer
          src={node.url || node.content || ""}
          alt={node.name}
          onClose={onClose}
        />
      ),
    });
    return;
  }

  if (appKey === "vscode") {
    addWindow({
      id: `vscode-${Date.now()}`,
      title: node.name + " - VSCode",
      content: (
        <VsCode
          fileName={node.name}
          initialValue={node.content || ""}
        />
      ),
      icon: <VsCodeIcon />,
      appType: "vscode",
      appData: {
        fileName: node.name,
        filePath: filePath ?? null,
        initialValue: node.content || "",
      },
      width: 900,
      height: 600,
      isFocused: true,
      isMaximized: false,
      isMinimized: false,
      zIndex: 10,
      resizable: true,
    });
    return;
  }

  notify({ type: "error", message: "No app registered for this file type." });
}
