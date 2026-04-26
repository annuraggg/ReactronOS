import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import type { ReactNode } from "react";
import { useNotificationStore, type NotificationItem } from "../../store/notificationStore";

const iconByType: Record<NotificationItem["type"], ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  error: <TriangleAlert className="h-4 w-4 text-red-400" />,
  info: <Info className="h-4 w-4 text-blue-400" />,
};

export default function NotificationCenter() {
  const items = useNotificationStore((state) => state.items);
  const dismiss = useNotificationStore((state) => state.dismiss);

  return (
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
  );
}
