import { useState, useEffect, useCallback, useRef } from "react";
import type { TimerState } from "@/types/timer";
import type { PopupMessage, BackgroundMessage } from "@/types/messages";
import { createInitialTimerState } from "@/types/timer";
import { POPUP_PORT_NAME } from "@/types/messages";

interface TimerConnection {
  timerState: TimerState;
  sendMessage: (message: PopupMessage) => void;
  isConnected: boolean;
}

export function useTimerConnection(): TimerConnection {
  const [timerState, setTimerState] = useState<TimerState>(createInitialTimerState());
  const [isConnected, setIsConnected] = useState(false);
  const portRef = useRef<chrome.runtime.Port | null>(null);

  useEffect(() => {
    const port = chrome.runtime.connect({ name: POPUP_PORT_NAME });
    portRef.current = port;
    setIsConnected(true);

    port.onMessage.addListener((message: BackgroundMessage) => {
      if (message.type === "STATE_UPDATE") {
        setTimerState(message.state);
      }
    });

    port.onDisconnect.addListener(() => {
      portRef.current = null;
      setIsConnected(false);
    });

    port.postMessage({ type: "GET_STATE" });

    return () => {
      port.disconnect();
      portRef.current = null;
    };
  }, []);

  const sendMessage = useCallback((message: PopupMessage) => {
    portRef.current?.postMessage(message);
  }, []);

  return { timerState, sendMessage, isConnected };
}
