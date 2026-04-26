import { useEffect } from "react";

export function useClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  onOutsideClick: () => void,
  enabled = true,
  ignoreRefs: Array<React.RefObject<HTMLElement | null>> = []
) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!ref.current || !target) return;
      const shouldIgnore = ignoreRefs.some((ignoreRef) => {
        const ignoreNode = ignoreRef.current;
        return ignoreNode ? ignoreNode.contains(target) : false;
      });
      if (shouldIgnore) return;
      if (!ref.current.contains(target)) {
        onOutsideClick();
      }
    };

    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, [enabled, ignoreRefs, onOutsideClick, ref]);
}
