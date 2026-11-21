import { useEffect, useMemo } from "react";
import { Target, Trophy } from "lucide-react";
import type { Celebration } from "@/popup/hooks/useFocusStats";
import { badgeDef } from "@/popup/hooks/useFocusStats";
import { BadgeIcon } from "./BadgeIcon";

interface CelebrationOverlayProps {
  celebration: Celebration | null;
  onDismiss: () => void;
}

const CONFETTI_COLORS = ["var(--accent-1)", "var(--accent-2)", "var(--accent-3)", "#ffffff", "#fde047"];

/** Full-screen glass moment with confetti for goals, level-ups and badges. */
export function CelebrationOverlay({ celebration, onDismiss }: CelebrationOverlayProps) {
  useEffect(() => {
    if (!celebration) return;
    const timer = setTimeout(onDismiss, 5000);
    const onKey = (e: KeyboardEvent) => (e.key === "Escape" || e.key === "Enter") && onDismiss();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [celebration, onDismiss]);

  const pieces = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.8 + Math.random() * 1.6,
        dx: `${(Math.random() - 0.5) * 120}px`,
        rot: `${(Math.random() - 0.5) * 1080}deg`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        w: 5 + Math.random() * 5,
        round: Math.random() > 0.6,
      })),
    // new confetti for each celebration
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [celebration]
  );

  if (!celebration) return null;

  let icon: React.ReactNode;
  let kicker: string;
  let title: string;
  let body: string;
  if (celebration.kind === "badge") {
    const badge = badgeDef(celebration.badge);
    icon = <BadgeIcon icon={badge.icon} className="h-9 w-9" />;
    kicker = "Badge unlocked";
    title = badge.name;
    body = badge.description;
  } else if (celebration.kind === "level") {
    icon = <span className="text-3xl font-extrabold">{celebration.level}</span>;
    kicker = "Level up!";
    title = celebration.name;
    body = `You reached level ${celebration.level}. Keep the flow going.`;
  } else {
    icon = <Target className="h-9 w-9" />;
    kicker = "Daily goal reached";
    title = "Goal smashed!";
    body = "You hit today's focus goal. Bonus XP earned.";
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={`${kicker}: ${title}`}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/45 p-6 backdrop-blur-md animate-fade-in"
      onClick={onDismiss}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {pieces.map((p, i) => (
          <span
            key={i}
            className="absolute top-0"
            style={{
              left: `${p.left}%`,
              width: p.w,
              height: p.round ? p.w : p.w * 1.8,
              borderRadius: p.round ? "50%" : 2,
              background: p.color,
              ["--dx" as string]: p.dx,
              ["--rot" as string]: p.rot,
              animation: `confetti-fall ${p.duration}s cubic-bezier(.2,.6,.4,1) ${p.delay}s both`,
            }}
          />
        ))}
      </div>

      <div className="glass-popover relative w-full max-w-[300px] rounded-[30px] px-6 pb-6 pt-7 text-center animate-pop-in" onClick={(e) => e.stopPropagation()}>
        <div
          className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[26px] gradient-primary"
          style={{ animation: "badge-pop 700ms var(--ease-spring) both" }}
        >
          <span className="absolute inset-x-2 top-1.5 h-1/2 rounded-[20px] bg-gradient-to-b from-white/45 to-transparent" />
          <span className="relative">{icon}</span>
        </div>
        <p className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary">
          <Trophy className="h-3 w-3" /> {kicker}
        </p>
        <h2 className="mt-1 text-xl font-bold text-white">{title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-on-surface-muted">{body}</p>
        <button onClick={onDismiss} className="liquid gradient-primary mt-5 w-full rounded-2xl py-2.5 text-xs font-bold cursor-pointer" autoFocus>
          Awesome!
        </button>
      </div>
    </div>
  );
}
