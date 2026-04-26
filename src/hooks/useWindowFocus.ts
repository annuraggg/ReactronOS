import { useEffect, useState } from "react";

export function useWindowFocus() {
  const [isWindowFocused, setIsWindowFocused] = useState(
    typeof document !== "undefined" ? document.hasFocus() : true
  );

  useEffect(() => {
    const onFocus = () => setIsWindowFocused(true);
    const onBlur = () => setIsWindowFocused(false);

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return isWindowFocused;
}

