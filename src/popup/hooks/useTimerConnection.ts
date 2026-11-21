import { useState, useEffect, useCallback, useRef } from "react";
import type { TimerState } from "@/types/timer";
import type { PopupMessage, BackgroundMessage, OffscreenReport } from "@/types/messages";
import { createInitialTimerState } from "@/types/timer";
import { POPUP_PORT_NAME } from "@/types/messages";

interface TimerConnection {
  timerState: TimerState;
  sendMessage: (message: PopupMessage) => void;
  registerMessageHandler: (handler: (message: BackgroundMessage) => void) => () => void;
  isConnected: boolean;
}

export function useTimerConnection(): TimerConnection {
  const [timerState, setTimerState] = useState<TimerState>(createInitialTimerState());
  const [isConnected, setIsConnected] = useState(false);
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const handlersRef = useRef<Set<(message: BackgroundMessage) => void>>(new Set());

  const registerMessageHandler = useCallback((handler: (message: BackgroundMessage) => void) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  const connectPort = useCallback(() => {
    try {
      const port = chrome.runtime.connect({ name: POPUP_PORT_NAME });
      portRef.current = port;
      setIsConnected(true);

      port.onMessage.addListener((message: BackgroundMessage) => {
        if (message.type === "STATE_UPDATE") {
          setTimerState(message.state);
        }

        for (const handler of handlersRef.current) {
          handler(message);
        }
      });

      port.onDisconnect.addListener(() => {
        portRef.current = null;
        setIsConnected(false);
      });

      port.postMessage({ type: "GET_STATE" });
      return port;
    } catch (error) {
      console.error("Failed to connect to background port:", error);
      portRef.current = null;
      setIsConnected(false);
      return null;
    }
  }, []);

  // Sound status comes straight from the offscreen player (runtime.sendMessage
  // reaches every extension page). Relaying it through the service worker lost
  // updates whenever Chrome had shut the idle worker down, leaving preview
  // buttons stuck on "Stop".
  useEffect(() => {
    const onRuntimeMessage = (message: unknown) => {
      const report = message as OffscreenReport | undefined;
      if (report?.target !== "background" || report.type !== "SOUND_STATUS") return;
      for (const handler of handlersRef.current) {
        handler({ type: "SOUND_STATUS", status: report.status });
      }
    };
    chrome.runtime.onMessage.addListener(onRuntimeMessage);
    return () => chrome.runtime.onMessage.removeListener(onRuntimeMessage);
  }, []);

  useEffect(() => {
    const port = connectPort();

    return () => {
      port?.disconnect();
      portRef.current = null;
    };
  }, [connectPort]);

  const sendMessage = useCallback(
    (message: PopupMessage) => {
      try {
        let activePort = portRef.current;
        if (!activePort) {
          activePort = connectPort();
        }
        activePort?.postMessage(message);
      } catch (error) {
        console.warn("Error posting message to port, attempting to reconnect:", error);
        try {
          const freshPort = connectPort();
          freshPort?.postMessage(message);
        } catch (retryError) {
          console.error("Failed to send message after reconnect:", retryError);
        }
      }
    },
    [connectPort]
  );

  return { timerState, sendMessage, registerMessageHandler, isConnected };
}
