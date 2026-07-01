import { useState } from "react";
import { useTimerConnection } from "./hooks/useTimerConnection";
import { useSettings } from "./hooks/useSettings";
import { useBlocklist } from "./hooks/useBlocklist";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { TimerView } from "@/components/timer/TimerView";
import { BlocklistView } from "@/components/blocklist/BlocklistView";
import { SettingsView } from "@/components/settings/SettingsView";

type ActiveView = "timer" | "blocklist" | "settings";

export function App() {
  const [activeView, setActiveView] = useState<ActiveView>("timer");
  const { timerState, sendMessage, registerMessageHandler } = useTimerConnection();

  const { draftSettings, isDirty, updateDraft, save, discard } = useSettings(
    sendMessage,
    registerMessageHandler
  );

  const { blockedSites, focusMetrics, addSites, removeSite, clearMetrics } = useBlocklist(
    sendMessage,
    registerMessageHandler
  );

  return (
    <div className="w-full h-screen flex flex-col bg-transparent overflow-hidden">
      <Header
        onSettingsClick={() => setActiveView("settings")}
        showBack={activeView === "settings"}
        onBackClick={() => setActiveView("timer")}
      />

      <main className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 scroll-smooth">
        {activeView === "timer" && (
          <TimerView timerState={timerState} sendMessage={sendMessage} />
        )}
        {activeView === "blocklist" && (
          <BlocklistView
            blockedSites={blockedSites}
            focusMetrics={focusMetrics}
            onAddSites={addSites}
            onRemoveSite={removeSite}
            autoDetectCategories={draftSettings.autoDetectCategories}
          />
        )}
        {activeView === "settings" && (
          <SettingsView
            settings={draftSettings}
            isDirty={isDirty}
            onUpdate={updateDraft}
            onSave={save}
            onDiscard={discard}
            onClearMetrics={clearMetrics}
            sendMessage={sendMessage}
          />
        )}
      </main>

      <BottomNav activeView={activeView} onViewChange={setActiveView} />
    </div>
  );
}
