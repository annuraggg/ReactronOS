import { useEffect, useRef } from "react";

type DosFactory = (
  canvas: HTMLCanvasElement,
  options: { wdosboxUrl: string }
) => Promise<DosInstance>;

type DosInstance = {
  fs: { extract: (path: string) => Promise<void> };
  main: (args: string[]) => Promise<void>;
  exit?: () => void;
  terminate?: () => void;
  close?: () => void;
};

type TrackedListener = {
  target: Window | Document;
  type: "keydown" | "keyup";
  listener: EventListenerOrEventListenerObject;
  options?: boolean | AddEventListenerOptions;
};

type DoomWindow = Window & { Dos?: DosFactory };

export default function Doom() {
  const dosRef = useRef<HTMLDivElement>(null);
  const dosInstanceRef = useRef<DosInstance | null>(null);
  const trackedListenersRef = useRef<TrackedListener[]>([]);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  const loadJsDos = (): Promise<DosFactory> =>
    new Promise((resolve, reject) => {
      const doomWindow = window as DoomWindow;
      if (doomWindow.Dos) {
        resolve(doomWindow.Dos);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://js-dos.com/6.22/current/js-dos.js";
      script.onload = () => {
        if (doomWindow.Dos) resolve(doomWindow.Dos);
        else reject(new Error("js-dos failed to load"));
      };
      script.onerror = () => reject(new Error("Failed to load js-dos script"));
      document.head.appendChild(script);
    });

  useEffect(() => {
    let cancelled = false;
    const mountNode = dosRef.current;
    const active = document.activeElement;
    lastActiveElementRef.current = active instanceof HTMLElement ? active : null;

    const originalWindowAdd = window.addEventListener.bind(window);
    const originalDocumentAdd = document.addEventListener.bind(document);

    const trackAndAdd =
      (target: Window | Document, originalAdd: typeof window.addEventListener) =>
      (
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
      ) => {
        if ((type === "keydown" || type === "keyup") && listener) {
          trackedListenersRef.current.push({
            target,
            type,
            listener,
            options,
          });
        }
        originalAdd(type, listener, options);
      };

    window.addEventListener = trackAndAdd(window, originalWindowAdd) as typeof window.addEventListener;
    document.addEventListener = trackAndAdd(
      document,
      originalDocumentAdd as typeof window.addEventListener
    ) as typeof document.addEventListener;

    const initDoom = async () => {
      if (!mountNode) return;

      try {
        const Dos = await loadJsDos();
        if (cancelled) return;

        const canvas = document.createElement("canvas");
        canvas.style.imageRendering = "pixelated";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.minHeight = "85vh";
        mountNode.innerHTML = "";
        mountNode.appendChild(canvas);

        const dos = await Dos(canvas, {
          wdosboxUrl: "https://js-dos.com/6.22/current/wdosbox.js",
        });
        if (cancelled) return;

        dosInstanceRef.current = dos;

        try {
          await dos.fs.extract("/apps/doom/doom.jsdos");
          await dos.main(["DOOM.EXE"]);
          return;
        } catch {
          // fallback to zip bundle
        }

        await dos.fs.extract("/apps/doom/doom.zip");
        await dos.main(["DOOM.EXE"]);
      } catch (error) {
        if (!mountNode) return;
        mountNode.innerHTML = `
          <div style="color:#ff6b6b;text-align:center;padding:40px;font-family:'Courier New',monospace;background:#1a1a1a;border:2px solid #333;border-radius:8px;margin:20px;">
            <h2 style="color:#ff4757;margin-bottom:20px;font-size:24px;">⚠️ DOOM Loading Failed</h2>
            <p style="margin-bottom:12px;color:#ffa502;"><strong>Error:</strong> ${
              error instanceof Error ? error.message : "Unknown error"
            }</p>
            <p>Place <code>doom.jsdos</code> or <code>doom.zip</code> under <code>/public/apps/doom/</code>.</p>
          </div>
        `;
      } finally {
        window.addEventListener = originalWindowAdd;
        document.addEventListener = originalDocumentAdd;
      }
    };

    void initDoom();

    return () => {
      cancelled = true;
      window.addEventListener = originalWindowAdd;
      document.addEventListener = originalDocumentAdd;

      for (const entry of trackedListenersRef.current) {
        entry.target.removeEventListener(entry.type, entry.listener, entry.options);
      }
      trackedListenersRef.current = [];

      if (document.pointerLockElement) {
        document.exitPointerLock?.();
      }
      if (document.fullscreenElement) {
        void document.exitFullscreen?.().catch(() => undefined);
      }

      const instance = dosInstanceRef.current;
      if (instance) {
        if (typeof instance.exit === "function") instance.exit();
        else if (typeof instance.terminate === "function") instance.terminate();
        else if (typeof instance.close === "function") instance.close();
      }
      dosInstanceRef.current = null;
      if (mountNode) mountNode.innerHTML = "";

      const restoreTarget =
        lastActiveElementRef.current && document.contains(lastActiveElementRef.current)
          ? lastActiveElementRef.current
          : (document.querySelector("input, textarea, [contenteditable='true']") as HTMLElement | null);
      window.requestAnimationFrame(() => {
        restoreTarget?.focus();
      });
    };
  }, []);

  return <div ref={dosRef} className="flex items-center justify-center" />;
}
