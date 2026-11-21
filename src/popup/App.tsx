import { useCallback, useEffect, useRef, useState } from "react";
import { useTimerConnection } from "./hooks/useTimerConnection";
import { useSettings } from "./hooks/useSettings";
import { useBlocklist } from "./hooks/useBlocklist";
import { useSiteAccess } from "./hooks/useSiteAccess";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { TimerView } from "@/components/timer/TimerView";
import { BlocklistView } from "@/components/blocklist/BlocklistView";
import { SettingsView } from "@/components/settings/SettingsView";
import { FeedbackView } from "@/components/feedback/FeedbackView";
import { StatsView } from "@/components/stats/StatsView";
import { CelebrationOverlay } from "@/components/stats/CelebrationOverlay";
import { useFocusStats } from "./hooks/useFocusStats";
import { UnsavedChangesDialog } from "@/components/ui/UnsavedChangesDialog";
import { Toast } from "@/components/ui/Toast";
import { hasFocusSource } from "@/types/settings";
import { LiquidBackdrop } from "@/components/layout/LiquidBackdrop";
import { applyTheme, rememberTheme } from "@/lib/themes";

const FOCUS_SOUND_LABELS = { local: "audio file", url: "audio URL", youtube: "YouTube" } as const;

type MainView = "timer" | "stats" | "blocklist" | "settings";
type ActiveView = MainView | "feedback";

const SUB_PAGE_TITLES: Partial<Record<ActiveView, string>> = {
  settings: "Settings",
  feedback: "Send Feedback",
};

export function App() {
  const [activeView, setActiveView] = useState<ActiveView>("timer");
  // Remember where the user came from so "back" from Feedback returns them there.
  const [previousView, setPreviousView] = useState<MainView>("timer");
  // Where the user tried to go while Settings had unsaved changes.
  const [pendingView, setPendingView] = useState<ActiveView | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { timerState, sendMessage, registerMessageHandler } = useTimerConnection();
  const { settings, draftSettings, isDirty, loaded, updateDraft, save, discard } = useSettings(
    sendMessage,
    registerMessageHandler
  );
  const {
    customSites,
    customActive,
    socialMediaSites,
    socialMediaActive,
    focusMetrics,
    addSites,
    toggleSite,
    deleteSite,
    toggleBlocklistActive,
    clearMetrics,
  } = useBlocklist(sendMessage, registerMessageHandler);

  // Errors from the looping focus sound, shown on the Timer screen.
  const [focusSoundError, setFocusSoundError] = useState<string | null>(null);
  useEffect(
    () =>
      registerMessageHandler((message) => {
        if (message.type !== "SOUND_STATUS" || message.status.channel !== "background") return;
        if (message.status.state === "error") setFocusSoundError(message.status.message ?? "Unknown error.");
        if (message.status.state === "playing") setFocusSoundError(null);
      }),
    [registerMessageHandler]
  );
  useEffect(() => {
    if (timerState.status !== "running") setFocusSoundError(null);
  }, [timerState.status]);

  const focusSoundLabel =
    timerState.status === "running" &&
    settings.focusSound !== "none" &&
    hasFocusSource(settings) &&
    (timerState.phase === "pomodoro" || settings.focusSoundDuringBreaks)
      ? FOCUS_SOUND_LABELS[settings.focusSound]
      : null;

  // Theme: preview the draft instantly; remember the saved one for a flash-free next open.
  useEffect(() => {
    if (loaded) applyTheme(draftSettings.colorTheme);
  }, [loaded, draftSettings.colorTheme]);
  useEffect(() => {
    if (loaded) rememberTheme(settings.colorTheme);
  }, [loaded, settings.colorTheme]);

  const siteAccess = useSiteAccess();
  const siteAccessMissing = siteAccess.granted === false;

  const showToast = useCallback((message: string) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const focusStats = useFocusStats(sendMessage, registerMessageHandler, showToast);

  const goTo = (view: ActiveView) => {
    if (activeView !== "feedback" && activeView !== "settings") setPreviousView(activeView);
    setActiveView(view);
  };

  /** All navigation goes through here so unsaved settings are never silently lost. */
  const navigate = (view: ActiveView) => {
    if (view === activeView) return;
    if (activeView === "settings" && isDirty) {
      setPendingView(view);
      return;
    }
    goTo(view);
  };

  const handleSave = () => {
    save();
    showToast("Settings saved");
  };

  const resolvePending = (action: "save" | "discard") => {
    if (action === "save") handleSave();
    else discard();
    if (pendingView) goTo(pendingView);
    setPendingView(null);
  };

  const closeDialog = useCallback(() => setPendingView(null), []);

  return (
    <div className="relative w-full h-screen flex flex-col bg-transparent overflow-hidden">
      <LiquidBackdrop />
      <Header
        subPageTitle={SUB_PAGE_TITLES[activeView]}
        onBackClick={() => navigate(activeView === "feedback" ? previousView : "timer")}
        onSettingsClick={() => navigate("settings")}
        onFeedbackClick={() => navigate("feedback")}
      />

      <main className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 scroll-smooth">
        {/* Keyed wrapper: each view glides in when you switch tabs. */}
        <div key={activeView} className="animate-view-in">
        {activeView === "timer" && (
          <TimerView
            timerState={timerState}
            sendMessage={sendMessage}
            focusSoundLabel={focusSoundLabel}
            focusSoundError={focusSoundError}
            siteAccessMissing={siteAccessMissing}
            onFixSiteAccess={siteAccess.request}
          />
        )}
        {activeView === "stats" && (
          <StatsView
            stats={focusStats.stats}
            dailyGoal={settings.dailyGoal}
            focusMinutes={settings.pomodoroDuration}
          />
        )}
        {activeView === "blocklist" && (
          <BlocklistView
            customSites={customSites}
            customActive={customActive}
            socialMediaSites={socialMediaSites}
            socialMediaActive={socialMediaActive}
            focusMetrics={focusMetrics}
            onAddSites={addSites}
            onToggleSite={toggleSite}
            onDeleteSite={deleteSite}
            onToggleBlocklistActive={toggleBlocklistActive}
            autoDetectCategories={settings.autoDetectCategories}
            siteAccessMissing={siteAccessMissing}
            onFixSiteAccess={siteAccess.request}
          />
        )}
        {activeView === "settings" && (
          <SettingsView
            settings={draftSettings}
            isDirty={isDirty}
            onUpdate={updateDraft}
            onSave={handleSave}
            onDiscard={discard}
            onClearMetrics={() => {
              clearMetrics();
              showToast("Focus stats cleared");
            }}
            sendMessage={sendMessage}
            registerMessageHandler={registerMessageHandler}
            onOpenFeedback={() => navigate("feedback")}
          />
        )}
        {activeView === "feedback" && <FeedbackView />}
        </div>
      </main>

      <BottomNav activeView={activeView} onViewChange={navigate} />

      <UnsavedChangesDialog
        open={pendingView !== null}
        onSave={() => resolvePending("save")}
        onDiscard={() => resolvePending("discard")}
        onCancel={closeDialog}
      />
      <Toast message={toast} />
      <CelebrationOverlay celebration={focusStats.celebration} onDismiss={focusStats.dismissCelebration} />
    </div>
  );
}
