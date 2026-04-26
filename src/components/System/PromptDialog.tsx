import { useEffect, useState } from "react";
import Modal from "./Modal";

type PromptDialogProps = {
  open: boolean;
  title: string;
  label: string;
  initialValue?: string;
  placeholder?: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
};

export default function PromptDialog({
  open,
  title,
  label,
  initialValue = "",
  placeholder,
  confirmText = "Save",
  onCancel,
  onConfirm,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [initialValue, open]);

  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="rounded bg-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(value.trim())}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold hover:bg-blue-700"
          >
            {confirmText}
          </button>
        </>
      }
    >
      <label className="mb-2 block text-xs text-zinc-400">{label}</label>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-blue-500"
      />
    </Modal>
  );
}
