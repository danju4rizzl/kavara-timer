import { CheckCircle2 } from "lucide-react";

interface ToastProps {
  message: string | null;
}

/** Floating glass confirmation above the tab bar. */
export function Toast({ message }: ToastProps) {
  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4">
      <div
        key={message}
        role="status"
        aria-live="polite"
        className="glass-popover flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white animate-pop-in"
      >
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        {message}
      </div>
    </div>
  );
}
