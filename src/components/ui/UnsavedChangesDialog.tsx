import { useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";

interface UnsavedChangesDialogProps {
  open: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

/** Shown when the user leaves Settings with unsaved changes. */
export function UnsavedChangesDialog({ open, onSave, onDiscard, onCancel }: UnsavedChangesDialogProps) {
  const saveRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    saveRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-5 backdrop-blur-md animate-fade-in"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unsaved-title"
        aria-describedby="unsaved-desc"
        onClick={(e) => e.stopPropagation()}
        className="glass-popover w-full max-w-[320px] rounded-[28px] p-5 animate-pop-in"
      >
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/25 bg-amber-400/10">
          <AlertCircle className="h-5 w-5 text-amber-300" />
        </div>
        <h2 id="unsaved-title" className="text-sm font-bold text-white">
          Save your changes?
        </h2>
        <p id="unsaved-desc" className="mt-1 text-xs leading-relaxed text-on-surface-muted">
          You've changed some settings but haven't saved them. Unsaved changes won't be applied to your timer.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <button
            ref={saveRef}
            onClick={onSave}
            className="liquid gradient-primary w-full rounded-[22px] py-2.5 text-xs font-bold cursor-pointer"
          >
            Save Changes
          </button>
          <div className="flex gap-2">
            <button
              onClick={onDiscard}
              className="liquid flex-1 rounded-[22px] border border-error/25 bg-error/10 py-2 text-xs font-semibold text-error hover:bg-error/20 cursor-pointer"
            >
              Discard
            </button>
            <button
              onClick={onCancel}
              className="liquid flex-1 rounded-[22px] border border-white/12 bg-white/[0.07] py-2 text-xs font-semibold text-white/85 hover:bg-white/[0.12] cursor-pointer"
            >
              Keep Editing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
