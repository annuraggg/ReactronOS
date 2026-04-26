import { Bell, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { type ReactNode, useMemo, useRef } from "react";
import { useNotificationStore, type NotificationItem } from "../../store/notificationStore";
import { useClickOutside } from "../../hooks/useClickOutside";

const iconByType: Record<NotificationItem["type"], ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  error: <TriangleAlert className="h-4 w-4 text-red-400" />,
  info: <Info className="h-4 w-4 text-blue-400" />,
};

export default function NotificationCenter() {
  const items = useNotificationStore((state) => state.items);
  const history = useNotificationStore((state) => state.history);
  const isCenterOpen = useNotificationStore((state) => state.isCenterOpen);
  const dismiss = useNotificationStore((state) => state.dismiss);
  const toggleCenter = useNotificationStore((state) => state.toggleCenter);
  const closeCenter = useNotificationStore((state) => state.closeCenter);
  const clearHistory = useNotificationStore((state) => state.clearHistory);
  const panelRef = useRef<HTMLDivElement>(null);

  useClickOutside(panelRef, closeCenter, isCenterOpen);

  const unreadCount = useMemo(() => history.filter((item) => !item.read).length, [history]);

  return (
    <>
      <div className="fixed right-3 top-3 z-[1000002]">
        <button
          type="button"
          onClick={toggleCenter}
          className="relative rounded-lg border border-zinc-700 bg-zinc-900/90 p-2 text-zinc-200 shadow-lg hover:bg-zinc-800"
          aria-label="Toggle notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {isCenterOpen && (
        <div
          ref={panelRef}
          className="fixed right-3 top-14 z-[1000002] w-[360px] max-w-[94vw] rounded-xl border border-zinc-700 bg-zinc-900/95 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-zinc-700 px-3 py-2">
            <span className="text-sm font-semibold text-zinc-100">Notifications</span>
            <button
              type="button"
              onClick={clearHistory}
              className="rounded px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
            >
              Clear all
            </button>
          </div>
          <div className="max-h-[360px] overflow-auto p-2">
            {history.length === 0 && (
              <div className="rounded-md p-3 text-sm text-zinc-400">No notifications yet.</div>
            )}
            {history.map((item) => (
              <div
                key={`${item.id}-history`}
                className="mb-2 flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-sm text-zinc-100"
              >
                <span className="mt-0.5">{iconByType[item.type]}</span>
                <div className="flex-1">
                  <div>{item.message}</div>
                  <div className="mt-1 text-[11px] text-zinc-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed bottom-16 right-3 z-[1000001] flex w-[320px] max-w-[92vw] flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto flex items-start gap-2 rounded-lg border border-zinc-700 bg-zinc-900/95 p-3 text-sm text-zinc-100 shadow-xl"
          >
            <span className="mt-0.5">{iconByType[item.type]}</span>
            <span className="flex-1">{item.message}</span>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="rounded p-0.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
