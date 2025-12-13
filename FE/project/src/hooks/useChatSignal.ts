import { useEffect, useCallback, useRef } from "react";
import { useWebSocket } from "./useWebSocket";

interface UseChatSignalOptions {
  onNewMessage?: () => void;
  onTyping?: (senderID: number) => void;
}

/**
 * Hook to listen for WebSocket chat signals and trigger refetch
 */
export const useChatSignal = (
  chatRoomId: number | null,
  refetch: () => void,
  options: UseChatSignalOptions = {}
) => {
  const refetchRef = useRef(refetch);
  const optionsRef = useRef(options);
  const subscribedRoomRef = useRef<number | null>(null);

  useEffect(() => {
    refetchRef.current = refetch;
    optionsRef.current = options;
  }, [refetch, options]);

  const handleMessage = useCallback(
    (data: unknown) => {
      const msgData = data as { chatRoomID?: number; messageID?: number; senderID?: number };
      const messageChatRoomId = Number(msgData.chatRoomID);
      const currentChatRoomId = Number(chatRoomId);
      
      if (!isNaN(messageChatRoomId) && !isNaN(currentChatRoomId) && messageChatRoomId === currentChatRoomId) {
        setTimeout(() => {
          try {
            refetchRef.current();
          } catch {
            // Silent
          }
          try {
            optionsRef.current.onNewMessage?.();
          } catch {
            // Silent
          }
        }, 100);
      }
    },
    [chatRoomId]
  );

  const handleTyping = useCallback(
    (data: { senderID: number; chatRoomID: number }) => {
      if (Number(data.chatRoomID) === Number(chatRoomId)) {
        optionsRef.current.onTyping?.(data.senderID);
      }
    },
    [chatRoomId]
  );

  const chatRoomIdRef = useRef(chatRoomId);
  const subscribeRef = useRef<((roomId: number) => void) | null>(null);
  
  useEffect(() => {
    chatRoomIdRef.current = chatRoomId;
  }, [chatRoomId]);

  const handleConnected = useCallback(() => {
    // Re-subscribe when WebSocket reconnects
    if (chatRoomIdRef.current && subscribedRoomRef.current !== chatRoomIdRef.current) {
      subscribeRef.current?.(chatRoomIdRef.current);
      subscribedRoomRef.current = chatRoomIdRef.current;
    }
  }, []);

  const { isConnected, subscribe, unsubscribe } = useWebSocket({
    onMessage: handleMessage,
    onTyping: handleTyping,
    onConnected: handleConnected,
  });
  
  // Keep subscribe ref updated
  useEffect(() => {
    subscribeRef.current = subscribe;
  }, [subscribe]);

  useEffect(() => {
    if (isConnected && chatRoomId) {
      if (subscribedRoomRef.current && subscribedRoomRef.current !== chatRoomId) {
        unsubscribe(subscribedRoomRef.current);
        subscribedRoomRef.current = null;
      }
      
      if (subscribedRoomRef.current !== chatRoomId) {
        subscribe(chatRoomId);
        subscribedRoomRef.current = chatRoomId;
      }
    }
    
    return () => {
      if (subscribedRoomRef.current && !chatRoomId) {
        unsubscribe(subscribedRoomRef.current);
        subscribedRoomRef.current = null;
      }
    };
  }, [isConnected, chatRoomId, subscribe, unsubscribe]);

  return { isConnected };
};
