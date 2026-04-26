import { useEffect, useMemo, useState } from "react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBookmark,
  IconBookmarkFilled,
  IconPlus,
  IconRefresh,
  IconWorldWww,
  IconX,
} from "@tabler/icons-react";
import { Loader2, TriangleAlert } from "lucide-react";

const DEFAULT_BOOKMARKS: { name: string; url: string }[] = [
  { name: "Wikipedia", url: "https://www.wikipedia.org/" },
  { name: "MDN Web Docs", url: "https://developer.mozilla.org/" },
  { name: "Example.com", url: "https://example.com/" },
  { name: "anuragsawant.in", url: "https://www.anuragsawant.in/" },
];

const DEFAULT_HOMEPAGE = "https://www.ecosia.org/";
const PAGE_LOAD_TIMEOUT = 5000;

type BrowserTab = {
  id: string;
  url: string;
  title: string;
  history: string[];
  historyIndex: number;
  input: string;
  loading: boolean;
  loadError: boolean;
  reloadKey: number;
};

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

function createTab(url: string = DEFAULT_HOMEPAGE): BrowserTab {
  const safeUrl = normalizeUrlForIframe(url);
  let title = safeUrl;
  try {
    title = new URL(safeUrl).hostname.replace(/^www\./, "");
  } catch {
    // noop
  }
  return {
    id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url: safeUrl,
    title,
    history: [safeUrl],
    historyIndex: 0,
    input: safeUrl,
    loading: true,
    loadError: false,
    reloadKey: 0,
  };
}

export default function Browser() {
  const [tabs, setTabs] = useState<BrowserTab[]>([createTab()]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [bookmarks, setBookmarks] = useState(DEFAULT_BOOKMARKS);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0],
    [activeTabId, tabs]
  );
  const activeTabKey = activeTab?.id;
  const isActiveTabLoading = activeTab?.loading ?? false;

  const updateActiveTab = (updater: (tab: BrowserTab) => BrowserTab) => {
    setTabs((prev) => prev.map((tab) => (tab.id === activeTabId ? updater(tab) : tab)));
  };

  const navigateActive = (rawInput: string, pushToHistory = true) => {
    let value = rawInput.trim();
    if (!value) return;
    if (!/^https?:\/\//.test(value)) {
      value = `https://www.ecosia.org/search?q=${encodeURIComponent(value)}`;
    }
    const safeUrl = normalizeUrlForIframe(value);
    updateActiveTab((tab) => {
      if (!pushToHistory) {
        return {
          ...tab,
          url: safeUrl,
          input: safeUrl,
          title: safeUrl,
          loadError: false,
          loading: true,
        };
      }
      const truncatedHistory = tab.history.slice(0, tab.historyIndex + 1);
      const nextHistory = [...truncatedHistory, safeUrl];
      return {
        ...tab,
        url: safeUrl,
        input: safeUrl,
        title: safeUrl,
        history: nextHistory,
        historyIndex: nextHistory.length - 1,
        loadError: false,
        loading: true,
      };
    });
  };

  const handleRefresh = () => {
    updateActiveTab((tab) => ({
      ...tab,
      loading: true,
      loadError: false,
      reloadKey: tab.reloadKey + 1,
    }));
  };

  const handleBack = () => {
    updateActiveTab((tab) => {
      if (tab.historyIndex <= 0) return tab;
      const idx = tab.historyIndex - 1;
      const nextUrl = tab.history[idx];
      return {
        ...tab,
        historyIndex: idx,
        url: nextUrl,
        input: nextUrl,
        loadError: false,
        loading: true,
      };
    });
  };

  const handleForward = () => {
    updateActiveTab((tab) => {
      if (tab.historyIndex >= tab.history.length - 1) return tab;
      const idx = tab.historyIndex + 1;
      const nextUrl = tab.history[idx];
      return {
        ...tab,
        historyIndex: idx,
        url: nextUrl,
        input: nextUrl,
        loadError: false,
        loading: true,
      };
    });
  };

  const closeTab = (id: string) => {
    setTabs((prev) => {
      if (prev.length === 1) return prev;
      const idx = prev.findIndex((tab) => tab.id === id);
      const nextTabs = prev.filter((tab) => tab.id !== id);
      if (id === activeTabId) {
        const nextActive = nextTabs[Math.max(0, idx - 1)] ?? nextTabs[0];
        setActiveTabId(nextActive.id);
      }
      return nextTabs;
    });
  };

  const addTab = () => {
    const tab = createTab();
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(tab.id);
  };

  const handleBookmark = () => {
    if (!activeTab || !canBookmark(activeTab.url)) return;
    if (bookmarks.some((bookmark) => bookmark.url === activeTab.url)) return;
    setBookmarks((prev) => [...prev, { name: activeTab.title, url: activeTab.url }]);
  };

  useEffect(() => {
    if (!activeTabKey || !isActiveTabLoading) return;
    const timeout = window.setTimeout(() => {
      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === activeTabKey ? { ...tab, loading: false, loadError: true } : tab
        )
      );
    }, PAGE_LOAD_TIMEOUT);
    return () => window.clearTimeout(timeout);
  }, [activeTabKey, isActiveTabLoading]);

  if (!activeTab) return null;
  const isBookmarked = bookmarks.some((bookmark) => bookmark.url === activeTab.url);
  const canGoBack = activeTab.historyIndex > 0;
  const canGoForward = activeTab.historyIndex < activeTab.history.length - 1;

  return (
    <div className="flex h-full w-full flex-col bg-zinc-900">
      <div className="flex items-center gap-1 border-b border-zinc-700 bg-zinc-900 px-2 py-1">
        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`flex min-w-[120px] max-w-[220px] items-center gap-2 rounded-t-md px-3 py-1 text-xs ${
                tab.id === activeTabId
                  ? "bg-zinc-800 text-zinc-100"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800/60"
              }`}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span className="truncate">{tab.title}</span>
              <span
                onClick={(event) => {
                  event.stopPropagation();
                  closeTab(tab.id);
                }}
                className="rounded p-0.5 hover:bg-zinc-700"
              >
                <IconX size={12} />
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={addTab}
          className="rounded p-1 text-zinc-300 hover:bg-zinc-800"
          aria-label="Add tab"
        >
          <IconPlus size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1 border-b border-zinc-700 bg-zinc-800 px-2 py-1">
        {bookmarks.map((bookmark) => (
          <button
            key={bookmark.url}
            className="flex items-center whitespace-nowrap rounded px-2 py-1 text-xs text-zinc-100 transition hover:bg-zinc-700"
            onClick={() => navigateActive(bookmark.url, true)}
            title={bookmark.url}
            type="button"
          >
            <IconBookmark size={12} className="mr-1" />
            {bookmark.name.length > 20 ? `${bookmark.name.slice(0, 18)}…` : bookmark.name}
          </button>
        ))}
        {!isBookmarked && canBookmark(activeTab.url) && (
          <button
            className="ml-2 flex items-center rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
            onClick={handleBookmark}
            type="button"
          >
            <IconBookmarkFilled size={12} className="mr-1" /> Bookmark
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 border-b border-zinc-700 bg-zinc-800 px-3 py-2">
        <button
          disabled={!canGoBack}
          className={`rounded p-1 ${canGoBack ? "hover:bg-zinc-700 text-zinc-100" : "text-zinc-500"}`}
          type="button"
          onClick={handleBack}
        >
          <IconArrowLeft size={18} />
        </button>
        <button
          disabled={!canGoForward}
          className={`rounded p-1 ${canGoForward ? "hover:bg-zinc-700 text-zinc-100" : "text-zinc-500"}`}
          type="button"
          onClick={handleForward}
        >
          <IconArrowRight size={18} />
        </button>
        <button className="rounded p-1 hover:bg-zinc-700" onClick={handleRefresh} type="button">
          <IconRefresh size={18} />
        </button>
        <div className="mx-2 flex-1">
          <div className="flex items-center rounded bg-zinc-700 px-2 py-1">
            <IconWorldWww size={16} className="mr-2 text-zinc-400" />
            <input
              className="flex-1 bg-transparent text-sm text-zinc-100 outline-none"
              value={activeTab.input}
              onChange={(e) =>
                updateActiveTab((tab) => ({
                  ...tab,
                  input: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") navigateActive(activeTab.input, true);
              }}
              spellCheck={false}
            />
          </div>
        </div>
        <button
          className="rounded bg-blue-600 px-3 py-1 text-sm font-semibold hover:bg-blue-700"
          onClick={() => navigateActive(activeTab.input, true)}
          type="button"
        >
          Go
        </button>
      </div>

      <div className="relative flex-1 bg-black">
        {!activeTab.loadError ? (
          <>
            <iframe
              key={`${activeTab.id}-${activeTab.url}-${activeTab.reloadKey}`}
              src={activeTab.url}
              title={`Browser - ${activeTab.title}`}
              className="h-full w-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              onLoad={() =>
                updateActiveTab((tab) => {
                  let nextTitle = tab.url;
                  try {
                    nextTitle = new URL(tab.url).hostname.replace(/^www\./, "");
                  } catch {
                    // noop
                  }
                  return { ...tab, loading: false, loadError: false, title: nextTitle };
                })
              }
              onError={() =>
                updateActiveTab((tab) => ({
                  ...tab,
                  loading: false,
                  loadError: true,
                }))
              }
            />
            {activeTab.loading && (
              <div className="absolute right-3 top-3 flex items-center gap-2 rounded bg-zinc-900/85 px-2 py-1 text-xs text-zinc-200">
                <Loader2 size={13} className="animate-spin" />
                Loading...
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-900/95 px-6 text-center">
            <TriangleAlert size={34} className="mb-2 text-yellow-400" />
            <div className="mb-1 text-lg font-semibold text-zinc-100">Page failed to load</div>
            <div className="mb-4 max-w-md text-sm text-zinc-400">
              This page may block iframe embedding or may be temporarily unavailable.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                className="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold hover:bg-blue-700"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => navigateActive(DEFAULT_HOMEPAGE, true)}
                className="rounded bg-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-600"
              >
                Go to home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
