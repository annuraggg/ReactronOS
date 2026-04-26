import { useEffect, useRef, useState } from "react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconRefresh,
  IconWorldWww,
  IconBookmark,
  IconBookmarkFilled,
  IconStar,
} from "@tabler/icons-react";

const DEFAULT_BOOKMARKS: { name: string; url: string }[] = [
  { name: "Wikipedia", url: "https://www.wikipedia.org/" },
  { name: "MDN Web Docs", url: "https://developer.mozilla.org/" },
  { name: "Example.com", url: "https://example.com/" },
  { name: "anuragsawant.in", url: "https://www.anuragsawant.in/" },
];

const DEFAULT_HOMEPAGE = "https://www.ecosia.org/";
const PAGE_LOAD_TIMEOUT = 5000;

function canBookmark(url: string) {
  return /^https:\/\/[^/]+/i.test(url);
}

function normalizeUrlForIframe(value: string): string {
  try {
    const parsed = new URL(value);
    return /^https?:$/i.test(parsed.protocol) ? parsed.toString() : DEFAULT_HOMEPAGE;
  } catch {
    return DEFAULT_HOMEPAGE;
  }
}

export default function Browser() {
  const [url, setUrl] = useState(DEFAULT_HOMEPAGE);
  const [input, setInput] = useState(url);
  const [bookmarks, setBookmarks] = useState(DEFAULT_BOOKMARKS);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    const timeout = window.setTimeout(() => {
      setLoading(false);
      setLoadError(true);
    }, PAGE_LOAD_TIMEOUT);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [url, reloadKey]);

  const handleBookmark = () => {
    if (!bookmarks.some((b) => b.url === url) && canBookmark(url)) {
      setBookmarks((prev) => [...prev, { name: url, url }]);
    }
  };

  const handleBookmarkClick = (bmUrl: string) => {
    setInput(bmUrl);
    setUrl(bmUrl);
    setLoadError(false);
  };

  const handleGo = () => {
    let val = input.trim();
    if (!val) return;
    if (!/^https?:\/\//.test(val)) {
      val = "https://www.ecosia.org/search?q=" + encodeURIComponent(val);
    }
    setUrl(normalizeUrlForIframe(val));
    setLoadError(false);
  };

  const handleInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleGo();
  };

  const handleRefresh = () => {
    setLoadError(false);
    setReloadKey((v) => v + 1);
    if (iframeRef.current) {
      iframeRef.current.src = normalizeUrlForIframe(url);
    }
  };

  const isBookmarked = bookmarks.some((b) => b.url === url);

  return (
    <div className="flex flex-col h-full w-full bg-zinc-900">
      <div className="flex items-center gap-1 px-2 py-1 bg-zinc-800 border-b border-zinc-700 overflow-x-auto">
        <IconStar size={16} className="mr-1 text-yellow-300" />
        {bookmarks.map((bm) => (
          <button
            key={bm.url}
            className="flex items-center px-2 py-1 mx-1 rounded hover:bg-zinc-700 text-xs text-zinc-100 transition whitespace-nowrap"
            onClick={() => handleBookmarkClick(bm.url)}
            title={bm.url}
            type="button"
          >
            <IconBookmark size={13} className="mr-1" />
            {bm.name.length > 25 ? bm.name.slice(0, 23) + "…" : bm.name}
          </button>
        ))}
        {!isBookmarked && canBookmark(url) && (
          <button
            className="ml-2 px-2 py-1 rounded hover:bg-blue-700 bg-blue-600 text-xs text-white flex items-center"
            onClick={handleBookmark}
            type="button"
          >
            <IconBookmarkFilled size={13} className="mr-1" /> Bookmark This
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border-b border-zinc-700">
        <button disabled className="p-1 rounded hover:bg-zinc-700 text-zinc-500" type="button">
          <IconArrowLeft size={18} />
        </button>
        <button disabled className="p-1 rounded hover:bg-zinc-700 text-zinc-500" type="button">
          <IconArrowRight size={18} />
        </button>
        <button className="p-1 rounded hover:bg-zinc-700" onClick={handleRefresh} type="button">
          <IconRefresh size={18} />
        </button>
        <div className="flex-1 mx-2">
          <div className="flex items-center bg-zinc-700 rounded px-2 py-1">
            <IconWorldWww size={16} className="mr-2 text-zinc-400" />
            <input
              className="flex-1 bg-transparent outline-none text-sm text-zinc-100"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleInputKey}
              onBlur={() => setInput(url)}
              spellCheck={false}
            />
          </div>
        </div>
        <button
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold"
          onClick={handleGo}
          type="button"
        >
          Go
        </button>
      </div>

      <div className="flex-1 bg-black relative">
        {!loadError ? (
          <>
            <iframe
              key={`${url}-${reloadKey}`}
              ref={iframeRef}
              src={normalizeUrlForIframe(url)}
              title="Browser"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              onLoad={() => {
                setLoading(false);
                setLoadError(false);
              }}
              onError={() => {
                setLoading(false);
                setLoadError(true);
              }}
            />
            {loading && (
              <div className="absolute top-3 right-3 rounded bg-zinc-900/75 px-2 py-1 text-xs text-zinc-300">
                Loading...
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/95 z-10 text-center px-6">
            <IconWorldWww size={36} className="text-yellow-400 mb-2" />
            <div className="text-zinc-100 font-semibold text-lg mb-1">Page failed to load</div>
            <div className="text-zinc-400 text-sm max-w-md mb-4">
              This page may block iframe embedding or may be temporarily unavailable.
            </div>
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={handleRefresh}
                className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-sm font-semibold"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => {
                  setInput(DEFAULT_HOMEPAGE);
                  setUrl(DEFAULT_HOMEPAGE);
                  setLoadError(false);
                }}
                className="px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-sm"
              >
                Go to home
              </button>
            </div>
            <ul className="text-zinc-500 text-xs space-y-1">
              <li>• Try websites like Wikipedia or MDN.</li>
              <li>• Check your URL format and connection.</li>
              <li>• Some sites do not allow embedding in apps.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
