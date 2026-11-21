import type { TimerState } from "@/types/timer";
import type { PopupMessage } from "@/types/messages";
import { PhaseSelector } from "./PhaseSelector";
import { TimerDial } from "./TimerDial";
import { ControlButtons } from "./ControlButtons";
import { AlertTriangle, Music2 } from "lucide-react";
import { SiteAccessWarning } from "@/components/ui/SiteAccessWarning";

interface TimerViewProps {
  timerState: TimerState;
  sendMessage: (message: PopupMessage) => void;
  /** Label of the focus sound that should be playing right now, or null. */
  focusSoundLabel: string | null;
  focusSoundError: string | null;
  siteAccessMissing: boolean;
  onFixSiteAccess: () => void;
}

export function TimerView({
  timerState,
  sendMessage,
  focusSoundLabel,
  focusSoundError,
  siteAccessMissing,
  onFixSiteAccess,
}: TimerViewProps) {
  return (
    <div className="flex flex-col gap-[var(--spacing-stack)] py-3">
      <div className="flex justify-center">
        <PhaseSelector
          activePhase={timerState.phase}
          onPhaseChange={(phase) => sendMessage({ type: "SET_PHASE", phase })}
        />
      </div>

      <TimerDial timerState={timerState} />

      <ControlButtons
        status={timerState.status}
        onPlay={() => sendMessage({ type: "START_TIMER" })}
        onPause={() => sendMessage({ type: "PAUSE_TIMER" })}
        onReset={() => sendMessage({ type: "RESET_TIMER" })}
        onSkip={() => sendMessage({ type: "SKIP_PHASE" })}
      />

      {siteAccessMissing && (
        <div className="mx-auto w-full max-w-[340px]">
          <SiteAccessWarning compact onFix={onFixSiteAccess} />
        </div>
      )}

      {focusSoundError ? (
        <div className="mx-auto flex max-w-[320px] items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-300" />
          <p className="text-[10.5px] leading-relaxed text-rose-200">Focus sound couldn't play: {focusSoundError}</p>
        </div>
      ) : (
        focusSoundLabel && (
          <div className="mx-auto flex items-center gap-1.5 rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[10.5px] font-medium text-on-surface-muted">
            <Music2 className="h-3 w-3 text-primary motion-safe:animate-pulse" />
            Focus sound: {focusSoundLabel}
          </div>
        )
      )}
    </div>
  );
}
