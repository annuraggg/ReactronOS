import { Code2, Folder, Gamepad2, Globe, MonitorCog, NotebookText, Settings2 } from "lucide-react";
import type { ReactNode } from "react";
import Browser from "../../apps/Browser/Browser";
import Doom from "../../apps/Doom/Doom";
import FileExplorer from "../../apps/FileExplorer/FileExplorer";
import { createNotepadWindow } from "../../apps/Notepad/Notepad";
import Settings from "../../apps/Settings/Settings";
import TaskManager from "../../apps/TaskManager/TaskManager";
import VsCode from "../../apps/VSCode/VSCode";
import VsCodeIcon from "../../apps/VSCode/VSCodeIcon";
import type { Window } from "../../store/windowStore";

type AddWindowFn = (window: Window) => void;

export type AppDescriptor = {
  id: string;
  name: string;
  icon: ReactNode;
  launch: (addWindow: AddWindowFn) => void;
};

const randomPosition = () => ({
  x: 120 + Math.random() * 200,
  y: 120 + Math.random() * 140,
});

export const APP_REGISTRY: AppDescriptor[] = [
  {
    id: "explorer",
    name: "File Explorer",
    icon: <Folder className="h-5 w-5 text-zinc-100" />,
    launch: (addWindow) => {
      const pos = randomPosition();
      addWindow({
        id: `explorer-${Date.now()}`,
        title: "File Explorer",
        content: <FileExplorer />,
        icon: <Folder className="h-4 w-4 text-amber-300" />,
        appType: "explorer",
        width: 440,
        height: 520,
        x: pos.x,
        y: pos.y,
        isFocused: true,
      });
    },
  },
  {
    id: "notepad",
    name: "Notepad",
    icon: <NotebookText className="h-5 w-5 text-zinc-100" />,
    launch: (addWindow) => addWindow(createNotepadWindow()),
  },
  {
    id: "browser",
    name: "Browser",
    icon: <Globe className="h-5 w-5 text-zinc-100" />,
    launch: (addWindow) => {
      const pos = randomPosition();
      addWindow({
        id: `browser-${Date.now()}`,
        title: "Browser",
        content: <Browser />,
        icon: <Globe className="h-4 w-4 text-sky-300" />,
        appType: "browser",
        width: 950,
        height: 670,
        x: pos.x,
        y: pos.y,
        isFocused: true,
      });
    },
  },
  {
    id: "taskmanager",
    name: "Task Manager",
    icon: <MonitorCog className="h-5 w-5 text-zinc-100" />,
    launch: (addWindow) => {
      const pos = randomPosition();
      addWindow({
        id: `taskmanager-${Date.now()}`,
        title: "Task Manager",
        content: <TaskManager />,
        icon: <MonitorCog className="h-4 w-4 text-blue-300" />,
        appType: "taskmanager",
        width: 700,
        height: 440,
        x: pos.x,
        y: pos.y,
        isFocused: true,
      });
    },
  },
  {
    id: "vscode",
    name: "VSCode",
    icon: <Code2 className="h-5 w-5 text-zinc-100" />,
    launch: (addWindow) => {
      const pos = randomPosition();
      addWindow({
        id: `vscode-${Date.now()}`,
        title: "VSCode",
        content: <VsCode fileName="untitled.txt" initialValue="// Start coding!" />,
        icon: <VsCodeIcon />,
        appType: "vscode",
        appData: { fileName: "untitled.txt", initialValue: "// Start coding!" },
        width: 900,
        height: 600,
        x: pos.x,
        y: pos.y,
        isFocused: true,
      });
    },
  },
  {
    id: "doom",
    name: "DOOM",
    icon: <Gamepad2 className="h-5 w-5 text-zinc-100" />,
    launch: (addWindow) => {
      addWindow({
        id: `doom-${Date.now()}`,
        title: "DOOM",
        icon: <Gamepad2 className="h-4 w-4 text-red-400" />,
        content: <Doom />,
        appType: "doom",
        width: 1200,
        height: 1000,
        isFocused: true,
        isMaximized: true,
      });
    },
  },
  {
    id: "settings",
    name: "Settings",
    icon: <Settings2 className="h-5 w-5 text-zinc-100" />,
    launch: (addWindow) => {
      const pos = randomPosition();
      addWindow({
        id: `settings-${Date.now()}`,
        title: "Settings",
        content: <Settings />,
        icon: <Settings2 className="h-4 w-4 text-zinc-200" />,
        appType: "settings",
        width: 560,
        height: 430,
        x: pos.x,
        y: pos.y,
        isFocused: true,
      });
    },
  },
];
