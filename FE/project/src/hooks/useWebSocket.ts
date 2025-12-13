import { useEffect, useRef, useCallback, useState } from "react";
import { wsManager } from "./webSocketManager";

interface UseWebSocketOptions {
  onMessage?: (message: unknown) => void;
  onTyping?: (data: { senderID: number; chatRoomID: number }) => void;
  onError?: (error: string) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  subscribe: (chatRoomId: number) => void;
  unsubscribe: (chatRoomId: number) => void;
  disconnect: () => void;
}

export const useWebSocket = (
  options: UseWebSocketOptions = {}
): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(wsManager.getIsConnected());
  const optionsRef = useRef(options);
  const unsubscribeFnsRef = useRef<Map<number, () => void>>(new Map());

  // Keep options ref updated
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Connect and listen for connection status - only if user has token
  useEffect(() => {
    // Check if user is logged in before attempting to connect
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (!token) {
      // User not logged in, don't connect WebSocket
      return;
    }

    wsManager.connect();

    const unsubConnect = wsManager.onConnect(() => {
      setIsConnected(true);
      optionsRef.current.onConnected?.();
    });

    const unsubDisconnect = wsManager.onDisconnect(() => {
      setIsConnected(false);
      optionsRef.current.onDisconnected?.();
    });

    return () => {
      unsubConnect();
      unsubDisconnect();
    };
  }, []);

  const subscribe = useCallback((chatRoomId: number) => {
    // Already subscribed from this hook instance
    if (unsubscribeFnsRef.current.has(chatRoomId)) {
      return;
    }

    const unsubscribe = wsManager.subscribe(
      chatRoomId,
      (data) => optionsRef.current.onMessage?.(data),
      (data) => optionsRef.current.onTyping?.(data)
    );

    unsubscribeFnsRef.current.set(chatRoomId, unsubscribe);
  }, []);

  const unsubscribe = useCallback((chatRoomId: number) => {
    const unsub = unsubscribeFnsRef.current.get(chatRoomId);
    if (unsub) {
      unsub();
      unsubscribeFnsRef.current.delete(chatRoomId);
    }
  }, []);

  const disconnect = useCallback(() => {
    // Unsubscribe all from this hook instance
    unsubscribeFnsRef.current.forEach((unsub) => unsub());
    unsubscribeFnsRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeFnsRef.current.forEach((unsub) => unsub());
      unsubscribeFnsRef.current.clear();
    };
  }, []);

  return {
    isConnected,
    subscribe,
    unsubscribe,
    disconnect,
  };
};
