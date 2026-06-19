import { useState, useEffect, useCallback, useRef } from "react";
import type { TimerState } from "@/types/timer";
import type { PopupMessage, BackgroundMessage } from "@/types/messages";
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

  useEffect(() => {
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

    return () => {
      port.disconnect();
      portRef.current = null;
    };
  }, []);

  const sendMessage = useCallback((message: PopupMessage) => {
    portRef.current?.postMessage(message);
  }, []);

  return { timerState, sendMessage, registerMessageHandler, isConnected };
}
