import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose?: () => void;
  footer?: ReactNode;
  widthClassName?: string;
};

export default function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  widthClassName = "max-w-md",
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/55 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`w-[92vw] ${widthClassName} rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-zinc-800 px-4 py-3 text-sm font-semibold">{title}</div>
        <div className="px-4 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-zinc-800 px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}
