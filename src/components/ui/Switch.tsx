import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

/** iOS-style toggle: the knob stretches while pressed and springs across. */
export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "group relative h-[26px] w-[46px] shrink-0 rounded-full border cursor-pointer active:!scale-100",
        "transition-[background-color,border-color,box-shadow] duration-300",
        checked
          ? "border-transparent bg-[linear-gradient(135deg,var(--accent-1),var(--accent-2))] shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_0_12px_-2px_color-mix(in_oklab,var(--accent-1)_60%,transparent)]"
          : "glass-inset"
      )}
    >
      <span
        className={cn(
          "absolute top-[2px] h-5 w-5 rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.35),inset_0_-1px_1px_rgb(0_0_0/0.08)]",
          "transition-all duration-500 [transition-timing-function:var(--ease-spring)] group-active:w-6",
          checked ? "left-[calc(100%-22px)] group-active:left-[calc(100%-26px)]" : "left-[2px]"
        )}
      />
    </button>
  );
}
