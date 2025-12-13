import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

// Production backend URL
const PRODUCTION_WS_URL = "https://centralized.henrytech.cloud/ws";
const LOCAL_WS_URL = "http://localhost:8086/ws";

// Determine WebSocket URL at runtime (not build time!)
const getWsUrl = (): string => {
  // CRITICAL: Check if we're in a browser and on HTTPS
  // This MUST be checked at runtime, not build time
  if (typeof window !== 'undefined') {
    const isHttps = window.location.protocol === 'https:';
    
    // If on HTTPS (production/Vercel), ALWAYS use production backend
    // This prevents mixed-content security errors
    if (isHttps) {
      return PRODUCTION_WS_URL;
    }
  }
  
  // Check VITE_API_URL environment variable
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && typeof apiUrl === 'string' && apiUrl.trim() !== '') {
    const trimmedUrl = apiUrl.trim();
    
    // If API URL points to production, use production WS
    if (trimmedUrl.includes('centralized.henrytech.cloud')) {
      return PRODUCTION_WS_URL;
    }
    
    return `${trimmedUrl}/ws`;
  }
  
  // Fallback: production mode uses production URL, dev uses localhost
  if (import.meta.env.PROD) {
    return PRODUCTION_WS_URL;
  }
  
  return LOCAL_WS_URL;
};

type MessageCallback = (data: unknown) => void;
type TypingCallback = (data: { senderID: number; chatRoomID: number }) => void;
type ConnectionCallback = () => void;

interface RoomSubscription {
  messageSub: StompSubscription;
  typingSub: StompSubscription;
  messageCallbacks: Set<MessageCallback>;
  typingCallbacks: Set<TypingCallback>;
}

class WebSocketManager {
  private client: Client | null = null;
  private subscriptions: Map<number, RoomSubscription> = new Map();
  private pendingSubscriptions: Map<
    number,
    { onMessage: MessageCallback; onTyping?: TypingCallback }
  > = new Map();
  // Store active room callbacks for re-subscription after reconnect
  private activeRoomCallbacks: Map<
    number,
    { messageCallbacks: Set<MessageCallback>; typingCallbacks: Set<TypingCallback> }
  > = new Map();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private disconnectionCallbacks: Set<ConnectionCallback> = new Set();
  private _isConnected = false;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  private getToken(): string | null {
    return (
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token")
    );
  }

  connect(): void {
    const token = this.getToken();
    if (!token) return;
    if (this.isConnecting) return;
    if (this.client?.connected) return;

    this.isConnecting = true;

    const wsUrl = getWsUrl();
    // Append token to URL for SockJS handshake (SockJS doesn't support custom headers)
    const wsUrlWithToken = `${wsUrl}?access_token=${encodeURIComponent(token)}`;

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrlWithToken),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        // Log only errors and important messages in production
        if (str.includes("ERROR") || str.includes("DISCONNECT")) {
          console.warn("[WebSocket Debug]", str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this._isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // Re-subscribe to all active rooms after reconnect
        this.activeRoomCallbacks.forEach((callbacks, roomId) => {
          if (callbacks.messageCallbacks.size > 0) {

            const firstMessageCb = Array.from(callbacks.messageCallbacks)[0];
            const firstTypingCb = callbacks.typingCallbacks.size > 0 
              ? Array.from(callbacks.typingCallbacks)[0] 
              : undefined;
            if (firstMessageCb) {
              this.doSubscribe(roomId, firstMessageCb, firstTypingCb);
              // Add remaining callbacks
              callbacks.messageCallbacks.forEach((cb) => {
                const sub = this.subscriptions.get(roomId);
                if (sub && cb !== firstMessageCb) sub.messageCallbacks.add(cb);
              });
              callbacks.typingCallbacks.forEach((cb) => {
                const sub = this.subscriptions.get(roomId);
                if (sub && cb !== firstTypingCb) sub.typingCallbacks.add(cb);
              });
            }
          }
        });

        // Process pending subscriptions
        this.pendingSubscriptions.forEach((pending, roomId) => {
          this.doSubscribe(roomId, pending.onMessage, pending.onTyping);
        });
        this.pendingSubscriptions.clear();

        this.connectionCallbacks.forEach((cb) => cb());
      },
      onDisconnect: () => {
        this._isConnected = false;
        this.isConnecting = false;
        // Clear STOMP subscriptions but keep activeRoomCallbacks for re-subscription
        this.subscriptions.clear();
        this.disconnectionCallbacks.forEach((cb) => cb());
      },
      onStompError: (frame) => {
        const errorMessage = frame.headers?.message || frame.body || "Unknown error";
        console.error("[WebSocket] STOMP Error:", errorMessage);
        this.isConnecting = false;
        
        // Don't retry on authentication errors
        if (errorMessage.includes("401") || errorMessage.includes("Unauthorized") || errorMessage.includes("UNAUTHENTICATED")) {
          this.reconnectAttempts = this.maxReconnectAttempts; // Stop retrying
          return;
        }
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
        }
      },
      onWebSocketError: () => {
        // Silent - errors are handled by STOMP
      },
      onWebSocketClose: () => {
        // Silent - handled by onDisconnect
      },
    });

    this.client.activate();
  }

  disconnect(): void {
    this.subscriptions.forEach((sub) => {
      sub.messageSub.unsubscribe();
      sub.typingSub.unsubscribe();
    });
    this.subscriptions.clear();

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this._isConnected = false;
    this.isConnecting = false;
  }

  subscribe(
    roomId: number,
    onMessage: MessageCallback,
    onTyping?: TypingCallback
  ): () => void {
    const existing = this.subscriptions.get(roomId);
    if (existing) {
      existing.messageCallbacks.add(onMessage);
      if (onTyping) existing.typingCallbacks.add(onTyping);

      return () => {
        existing.messageCallbacks.delete(onMessage);
        if (onTyping) existing.typingCallbacks.delete(onTyping);
        if (existing.messageCallbacks.size === 0) {
          existing.messageSub.unsubscribe();
          existing.typingSub.unsubscribe();
          this.subscriptions.delete(roomId);
        }
      };
    }

    if (!this.client?.connected) {
      // Queue subscription for when connected
      this.pendingSubscriptions.set(roomId, { onMessage, onTyping });
      return () => {
        this.pendingSubscriptions.delete(roomId);
      };
    }

    return this.doSubscribe(roomId, onMessage, onTyping);
  }

  private doSubscribe(
    roomId: number,
    onMessage: MessageCallback,
    onTyping?: TypingCallback
  ): () => void {
    if (!this.client?.connected) {
      return () => {};
    }

    const messageCallbacks = new Set<MessageCallback>([onMessage]);
    const typingCallbacks = new Set<TypingCallback>();
    if (onTyping) typingCallbacks.add(onTyping);

    // Store in activeRoomCallbacks for re-subscription after reconnect
    const existingActive = this.activeRoomCallbacks.get(roomId);
    if (existingActive) {
      existingActive.messageCallbacks.add(onMessage);
      if (onTyping) existingActive.typingCallbacks.add(onTyping);
    } else {
      this.activeRoomCallbacks.set(roomId, {
        messageCallbacks: new Set([onMessage]),
        typingCallbacks: onTyping ? new Set([onTyping]) : new Set(),
      });
    }

    const subscriptionRef = { messageCallbacks, typingCallbacks };

    const messageSub = this.client.subscribe(
      `/topic/chat/${roomId}`,
      (message: IMessage) => {
        try {
          const data = JSON.parse(message.body);
          const currentSub = this.subscriptions.get(roomId);
          const callbacks =
            currentSub?.messageCallbacks || subscriptionRef.messageCallbacks;

          if (callbacks.size === 0) return;

          callbacks.forEach((cb) => {
            try {
              cb(data);
            } catch {
              // Silent
            }
          });
        } catch {
          // Silent
        }
      }
    );

    const typingSub = this.client.subscribe(
      `/topic/chat/${roomId}/typing`,
      (message: IMessage) => {
        try {
          const data = JSON.parse(message.body);
          if (data.type === "TYPING") {
            // Use callbacks from subscription map to ensure all callbacks are called
            const currentSub = this.subscriptions.get(roomId);
            const callbacks = currentSub?.typingCallbacks || typingCallbacks;
            callbacks.forEach((cb) => {
              try {
                cb(data);
              } catch {
                // Silent
              }
            });
          }
        } catch {
          // Silent
        }
      }
    );

    this.subscriptions.set(roomId, {
      messageSub,
      typingSub,
      messageCallbacks,
      typingCallbacks,
    });

    return () => {
      messageCallbacks.delete(onMessage);
      if (onTyping) typingCallbacks.delete(onTyping);
      
      // Also remove from activeRoomCallbacks
      const active = this.activeRoomCallbacks.get(roomId);
      if (active) {
        active.messageCallbacks.delete(onMessage);
        if (onTyping) active.typingCallbacks.delete(onTyping);
        if (active.messageCallbacks.size === 0) {
          this.activeRoomCallbacks.delete(roomId);
        }
      }
      
      if (messageCallbacks.size === 0) {
        messageSub.unsubscribe();
        typingSub.unsubscribe();
        this.subscriptions.delete(roomId);
      }
    };
  }

  onConnect(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    if (this._isConnected) {
      callback();
    }
    return () => this.connectionCallbacks.delete(callback);
  }

  onDisconnect(callback: ConnectionCallback): () => void {
    this.disconnectionCallbacks.add(callback);
    return () => this.disconnectionCallbacks.delete(callback);
  }

  getIsConnected(): boolean {
    return this._isConnected;
  }
}

export const wsManager = new WebSocketManager();
