import { Clock, Flame, Moon, Shield, Sparkles, Sunrise, Target, Trophy, Waves, Zap } from "lucide-react";
import type { BadgeDef } from "@/lib/gamification";

const ICONS = { Sparkles, Target, Flame, Zap, Waves, Clock, Trophy, Shield, Sunrise, Moon };

export function BadgeIcon({ icon, className }: { icon: BadgeDef["icon"]; className?: string }) {
  const Icon = ICONS[icon];
  return <Icon className={className} strokeWidth={2} />;
}
