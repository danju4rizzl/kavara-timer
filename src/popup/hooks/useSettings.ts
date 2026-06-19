import { useState, useEffect, useCallback, useRef } from "react";
import type { TimerSettings } from "@/types/settings";
import type { PopupMessage, BackgroundMessage } from "@/types/messages";
import { DEFAULT_SETTINGS } from "@/types/settings";

interface SettingsHook {
  settings: TimerSettings;
  draftSettings: TimerSettings;
  isDirty: boolean;
  updateDraft: (partial: Partial<TimerSettings>) => void;
  save: () => void;
  discard: () => void;
}

export function useSettings(
  sendMessage: (message: PopupMessage) => void,
  onPortMessage?: (handler: (message: BackgroundMessage) => void) => void
): SettingsHook {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [draftSettings, setDraftSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [isDirty, setIsDirty] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    sendMessage({ type: "GET_SETTINGS" });
  }, [sendMessage]);

  useEffect(() => {
    if (!onPortMessage) return;

    onPortMessage((message: BackgroundMessage) => {
      if (message.type === "SETTINGS_UPDATE") {
        setSettings(message.settings);
        if (!isDirty) {
          setDraftSettings(message.settings);
        }
      }
    });
  }, [onPortMessage, isDirty]);

  const updateDraft = useCallback((partial: Partial<TimerSettings>) => {
    setDraftSettings((prev) => {
      const next = { ...prev, ...partial };
      setIsDirty(true);
      return next;
    });
  }, []);

  const save = useCallback(() => {
    sendMessage({ type: "UPDATE_SETTINGS", settings: draftSettings });
    setSettings(draftSettings);
    setIsDirty(false);
  }, [sendMessage, draftSettings]);

  const discard = useCallback(() => {
    setDraftSettings(settings);
    setIsDirty(false);
  }, [settings]);

  return { settings, draftSettings, isDirty, updateDraft, save, discard };
}
