import React from "react";
import type { PersistedWindow } from "./persistence";
import Notepad from "../apps/Notepad/Notepad";
import FileExplorer from "../apps/FileExplorer/FileExplorer";
import Browser from "../apps/Browser/Browser";
import TaskManager from "../apps/TaskManager/TaskManager";
import VsCode from "../apps/VSCode/VSCode";
import VsCodeIcon from "../apps/VSCode/VSCodeIcon";
import Settings from "../apps/Settings/Settings";
import {
  IconClipboardTextFilled,
  IconFolderFilled,
  IconWorld,
  IconWindow,
  IconSettings,
} from "@tabler/icons-react";
import { useFileSystemStore } from "../store/filesystemStore";

export function createWindowFromPersisted(win: PersistedWindow): {
  content: React.ReactNode;
  icon: React.ReactNode;
} | null {
  const { appType, appData } = win;

  switch (appType) {
    case "notepad": {
      const filePath = appData?.filePath as string[] | undefined;
      const fileName = (appData?.fileName as string) || "Untitled.txt";
      let content = "";
      if (filePath) {
        const node = useFileSystemStore.getState().getNodeByPath(filePath);
        content = node?.content ?? "";
      }
      return {
        content: (
          <Notepad
            initialContent={content}
            initialFileName={fileName}
            filePath={filePath}
          />
        ),
        icon: <IconClipboardTextFilled className="w-4 h-4" color="#5ac1df" />,
      };
    }
    case "explorer":
      return {
        content: <FileExplorer />,
        icon: <IconFolderFilled color="#feca3c" />,
      };
    case "browser":
      return {
        content: <Browser />,
        icon: <IconWorld color="#38bdf8" />,
      };
    case "taskmanager":
      return {
        content: <TaskManager />,
        icon: <IconWindow color="#60a5fa" />,
      };
    case "vscode": {
      const fileName = (appData?.fileName as string) || "untitled.txt";
      const initialValue = (appData?.initialValue as string) || "";
      return {
        content: <VsCode fileName={fileName} initialValue={initialValue} />,
        icon: <VsCodeIcon />,
      };
    }
    case "settings":
      return {
        content: <Settings />,
        icon: <IconSettings color="#cbd5e1" />,
      };
    default:
      return null;
  }
}
