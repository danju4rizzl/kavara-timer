import type { TimerState } from "@/types/timer";
import type { PopupMessage } from "@/types/messages";
import { PhaseSelector } from "./PhaseSelector";
import { TimerDial } from "./TimerDial";
import { ControlButtons } from "./ControlButtons";

interface TimerViewProps {
  timerState: TimerState;
  sendMessage: (message: PopupMessage) => void;
}

export function TimerView({ timerState, sendMessage }: TimerViewProps) {
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
    </div>
  );
}
