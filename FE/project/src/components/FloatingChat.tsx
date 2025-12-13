import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, ArrowLeft, Image as ImageIcon, Paperclip, Wifi, WifiOff, Download, Video } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import api from "@/config/axiosConfig";
import { useUserInfo } from "@/hooks/useUserInfo";
import { uploadFileToBackend, type FileUploadResponse } from "@/utils/fileUpload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatSignal } from "@/hooks/useChatSignal";
import { useWebSocket } from "@/hooks/useWebSocket";
import { wsManager } from "@/hooks/webSocketManager";
import { useToast } from "@/components/ui/use-toast";

interface ChatRoomRaw {
  chatRoomID: number;
  tutorID: number;
  tutorName: string;
  tutorAvatarURL: string | null;
  userID: number;
  userName: string;
  userAvatarURL: string | null;
  chatRoomType: "Advice" | "Training";
  messages: any[];
}

interface Conversation {
  chatRoomID: number;
  otherUserName: string;
  otherUserAvatar: string | null;
  chatRoomType: "Advice" | "Training";
  lastMessage: string;
  lastMessageTime: string;
}

type MessageType = "Text" | "Link" | "Image" | "File";

interface ChatMessage {
  messageID: number;
  chatRoomID: number;
  senderID: number;
  senderName: string;
  senderAvatarURL: string | null;
  content: string;
  messageType: MessageType;
  createdAt: string;
}

interface ChatRoom {
  chatRoomID: number;
  title: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  chatRoomType: "Advice" | "Training";
  canSendMessage: boolean;
  messages: ChatMessage[];
}

const FloatingChat = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [typingUser, setTypingUser] = useState<number | null>(null);
  const [showMeetInput, setShowMeetInput] = useState(false);
  const [meetLink, setMeetLink] = useState("");
  const [meetError, setMeetError] = useState("");
  const [hasUnread, setHasUnread] = useState(false);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useUserInfo();
  const currentUserRef = useRef(currentUser);
  
  // Keep currentUserRef updated
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);
  
  // Connect WebSocket early when user is logged in (before opening chat)
  useEffect(() => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (token && currentUser) {
      // Trigger WebSocket connection early so it's ready when user opens chat
      wsManager.connect();
    }
  }, [currentUser]);
  
  // Check if any action is in progress (for disabling other buttons)
  const isActionInProgress = uploading || sending || !!selectedFile || showMeetInput;

  // Hide FloatingChat on messages page (both learner and tutor)
  const isOnMessagesPage = location.pathname.startsWith('/messages') || location.pathname.startsWith('/tutor/messages');

  // Helper function to get room display info
  const getRoomDisplay = useCallback((room: ChatRoomRaw) => {
    if (!currentUser) return { name: "Unknown", avatar: null };
    
    // Direct comparison like conversations-list (no Number conversion)
    // If current user is the learner (userID matches) -> show tutor info
    if (currentUser.userID === room.userID) {
      return {
        name: room.tutorName,
        avatar: room.tutorAvatarURL,
      };
    }
    
    // If current user is the tutor (tutorID matches) -> show learner info
    if (currentUser.userID === room.tutorID) {
      return {
        name: room.userName,
        avatar: room.userAvatarURL,
      };
    }
    
    // Fallback - show learner info
    return {
      name: room.userName,
      avatar: room.userAvatarURL,
    };
  }, [currentUser]);

  // Helper function to render message content preview
  const renderMessageContent = useCallback((msg: any) => {
    let content = msg.content;
    let type = msg.messageType;

    // Try to parse if content is JSON string
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed === "object" && parsed !== null) {
        if (typeof parsed.content === "string") {
          content = parsed.content;
        }
        if (typeof parsed.messageType === "string") {
          type = parsed.messageType;
        }
      }
    } catch {
      // Not JSON, continue
    }

    // Check message type
    if (type === "Image" || msg.messageType === "Image") {
      return " Hình ảnh";
    }

    if (type === "File" || msg.messageType === "File") {
      // Try to get filename for better icon
      try {
        const parsed = JSON.parse(content);
        if (parsed.filename) {
          const ext = parsed.filename.split('.').pop()?.toLowerCase();
          if (ext === 'pdf') return " PDF";
          if (['doc', 'docx'].includes(ext || '')) return " Word";
          if (['xls', 'xlsx'].includes(ext || '')) return " Excel";
        }
      } catch {
        // Ignore
      }
      return " File";
    }

    // Check if content is base64 image
    if (content.startsWith("data:image/")) {
      return " Hình ảnh";
    }

    // Check if content is base64 file/document
    if (content.startsWith("data:application/") || content.startsWith("data:")) {
      return " Tệp";
    }

    if (type === "Link" || msg.messageType === "Link") {
      // Check if it's Google Meet link
      if (content.includes("meet.google.com")) {
        return " Google Meet";
      }
      return " Liên kết";
    }

    // Regular text - truncate if too long
    if (content.length > 30) {
      return content.substring(0, 30) + "...";
    }

    return content || "Chưa có tin nhắn";
  }, []);

  // Fetch conversations list function
  const fetchConversations = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const res = await api.get("/chat/rooms");
      const roomsData: ChatRoomRaw[] = res.data?.result || [];
      
      // Sort messages in each room
      const normalized = roomsData.map((room) => ({
        ...room,
        messages: [...room.messages].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
      }));

      // Sort rooms by latest message time (newest first)
      const sortedRooms = normalized.sort((a: ChatRoomRaw, b: ChatRoomRaw) => {
        const aLastMsg = a.messages[a.messages.length - 1];
        const bLastMsg = b.messages[b.messages.length - 1];
        
        if (!aLastMsg && !bLastMsg) return 0;
        if (!aLastMsg) return 1;
        if (!bLastMsg) return -1;
        
        return new Date(bLastMsg.createdAt).getTime() - new Date(aLastMsg.createdAt).getTime();
      });

      // Transform to Conversation format with correct names/avatars
      const transformed = sortedRooms.map((room) => {
        const { name, avatar } = getRoomDisplay(room);
        const lastMsg = room.messages[room.messages.length - 1];
        
        return {
          chatRoomID: room.chatRoomID,
          otherUserName: name,
          otherUserAvatar: avatar,
          chatRoomType: room.chatRoomType,
          lastMessage: lastMsg ? renderMessageContent(lastMsg) : "Chưa có tin nhắn",
          lastMessageTime: lastMsg?.createdAt || "",
        };
      });
      
      setConversations(transformed);
    } catch  {
      // Silent error
    } finally {
      setLoading(false);
    }
  }, [currentUser, getRoomDisplay, renderMessageContent]);

  // Fetch room messages function
  const fetchRoomMessages = useCallback(async (roomId: number) => {
    if (!currentUser) return;
    
    try {
      const res = await api.get(`/chat/room/${roomId}`);
      const rawRoom = res.data.result;
      
      // Determine correct name and avatar based on current user
      const { name, avatar } = getRoomDisplay(rawRoom);
      
      setSelectedRoom({
        chatRoomID: rawRoom.chatRoomID,
        title: rawRoom.title,
        otherUserName: name,
        otherUserAvatar: avatar,
        chatRoomType: rawRoom.chatRoomType,
        canSendMessage: rawRoom.canSendMessage,
        messages: rawRoom.messages || [],
      });
    } catch  {
      // Silent error
    }
  }, [currentUser, getRoomDisplay]);

  // WebSocket typing handler
  const handleTyping = useCallback((senderID: number) => {
    // Use ref to always get latest currentUser value
    const myUserID = currentUserRef.current?.userID;
    if (!myUserID || senderID === myUserID) return; // Don't show own typing
    
    setTypingUser(senderID);
    // Clear typing indicator after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setTypingUser(null);
    }, 3000);
  }, []);

  // WebSocket for selected room - refetch messages on new message
  const { isConnected: selectedRoomConnected } = useChatSignal(
    selectedRoom?.chatRoomID || null,
    () => {
      if (selectedRoom) {
        fetchRoomMessages(selectedRoom.chatRoomID);
      }
      fetchConversations();
    },
    {
      onTyping: handleTyping,
      onNewMessage: () => {
        fetchConversations();
      },
    }
  );

  // WebSocket for all conversations - subscribe to all rooms to get real-time updates
  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const { isConnected, subscribe, unsubscribe } = useWebSocket({
    onMessage: (msg) => {
      fetchConversations();
      // Show red dot if chat is closed and message is from someone else
      const message = msg as { senderID?: number };
      const myUserId = currentUserRef.current?.userID;
      // Only show red dot if message is from someone else and chat is closed
      if (!isOpenRef.current && myUserId && message.senderID && message.senderID !== myUserId) {
        setHasUnread(true);
      }
    },
  });

  // Subscribe to all rooms in conversations list for real-time updates
  // Track subscribed rooms to avoid re-subscribing
  const subscribedRoomsRef = useRef<Set<number>>(new Set());
  const conversationsRef = useRef(conversations);
  
  // Keep conversationsRef updated
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);
  
  // Subscribe when connected - this handles the case where conversations load before WebSocket connects
  useEffect(() => {
    if (!isConnected) return;
    
    // Subscribe to all current conversations when WebSocket connects
    const currentConversations = conversationsRef.current;
    if (currentConversations.length > 0) {
      currentConversations.forEach((conv) => {
        if (!subscribedRoomsRef.current.has(conv.chatRoomID)) {
          subscribe(conv.chatRoomID);
          subscribedRoomsRef.current.add(conv.chatRoomID);
        }
      });
    }
  }, [isConnected, subscribe]);
  
  // Subscribe to new rooms when conversations change
  useEffect(() => {
    // Subscribe even when chat is closed to receive notifications
    if (!isConnected || conversations.length === 0) return;

    const currentRoomIds = new Set(conversations.map(c => c.chatRoomID));
    const previousRoomIds = subscribedRoomsRef.current;
    
    // Subscribe to new rooms only
    currentRoomIds.forEach((roomId) => {
      if (!previousRoomIds.has(roomId)) {
        subscribe(roomId);
        previousRoomIds.add(roomId);
      }
    });
    
    // Unsubscribe from rooms no longer in list
    previousRoomIds.forEach((roomId) => {
      if (!currentRoomIds.has(roomId)) {
        unsubscribe(roomId);
        previousRoomIds.delete(roomId);
      }
    });
  }, [isConnected, conversations, subscribe, unsubscribe]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      subscribedRoomsRef.current.forEach((roomId) => {
        unsubscribe(roomId);
      });
      subscribedRoomsRef.current.clear();
    };
  }, [unsubscribe]);

  // Fetch conversations on mount (for notification badge) and when opening chat
  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser, fetchConversations]);

  // Refetch when opening chat
  useEffect(() => {
    if (isOpen && !selectedRoom && currentUser) {
      fetchConversations();
    }
  }, [isOpen, selectedRoom, currentUser, fetchConversations]);

  // Initial fetch room messages when selecting a room
  useEffect(() => {
    if (selectedRoom && isOpen && currentUser) {
      fetchRoomMessages(selectedRoom.chatRoomID);
    }
  }, [selectedRoom?.chatRoomID, isOpen, currentUser, fetchRoomMessages]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Auto scroll to bottom when messages change or room changes
  useEffect(() => {
    if (messageListRef.current) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        if (messageListRef.current) {
          messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [selectedRoom?.messages, selectedRoom?.chatRoomID]);



  const handleToggleChat = () => {
    // Check if user is logged in using currentUser (same as MessagesPage)
    if (!currentUser) {
      const redirectURL = encodeURIComponent(window.location.pathname);
      navigate(`${ROUTES.SIGN_IN}?redirect=${redirectURL}`);
      return;
    }
    
    if (isOpen) {
      setIsOpen(false);
      setSelectedRoom(null);
    } else {
      setIsOpen(true);
      // Clear unread indicator when opening chat
      setHasUnread(false);
    }
  };

  const handleOpenConversation = (roomId: number) => {
    fetchRoomMessages(roomId);
  };

  const handleBackToList = () => {
    setSelectedRoom(null);
    setMessage("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "Image" | "File") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (type === "Image" && !file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Loại file không hợp lệ",
        description: "Vui lòng chọn file hình ảnh (PNG, JPG, GIF, etc.)",
      });
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }
    
    // For documents, accept PDF, Word, Excel only (no PowerPoint)
    if (type === "File") {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Loại file không hợp lệ",
          description: "Vui lòng chọn file PDF, Word hoặc Excel",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    }

    // Check file size
    const maxSize = type === "Image" ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "File quá lớn",
        description: type === "Image" ? "Hình ảnh phải nhỏ hơn 10MB" : "File tài liệu phải nhỏ hơn 100MB",
      });
      if (type === "Image" && imageInputRef.current) imageInputRef.current.value = "";
      if (type === "File" && fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleSendFile = async () => {
    if (!selectedFile || !selectedRoom?.canSendMessage || uploading) return;

    setUploading(true);
    const messageType: MessageType = selectedFile.type.startsWith("image/") ? "Image" : "File";

    try {
      // Upload file to Cloudinary (both images and documents)
      const uploadResult: FileUploadResponse = await uploadFileToBackend(selectedFile);
      
      // Store as JSON with filename, URLs, and file info
      const fileData = JSON.stringify({
        filename: selectedFile.name,
        viewUrl: uploadResult.viewUrl,
        downloadUrl: uploadResult.downloadUrl,
        size: selectedFile.size,
        type: selectedFile.type,
      });
      
      const res = await api.post("/chat/message", {
        chatRoomID: selectedRoom.chatRoomID,
        content: fileData,
        messageType: messageType,
      });

      // Optimistic update: Add message to local state immediately
      const newMsg = res.data.result;
      setSelectedRoom((prev) =>
        prev ? { ...prev, messages: [...prev.messages, newMsg] } : null
      );
      
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (imageInputRef.current) imageInputRef.current.value = "";
      setUploading(false);
      
      // Refresh conversations list to update lastMessage
      fetchConversations();
    } catch  {
      toast({
        variant: "destructive",
        title: messageType === "Image" ? "Gửi hình ảnh thất bại" : "Gửi file thất bại",
        description: "Vui lòng thử lại sau.",
      });
      setUploading(false);
    }
  };

  // Debounced typing indicator
  const lastTypingSentRef = useRef<number>(0);
  const sendTypingIndicator = useCallback(async () => {
    if (!selectedRoom) return;
    
    const now = Date.now();
    // Only send typing indicator every 2 seconds
    if (now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;
    
    try {
      await api.post(`/chat/room/${selectedRoom.chatRoomID}/typing`);
    } catch (err) {
      // Silently ignore typing indicator errors
      console.debug("Typing indicator failed:", err);
    }
  }, [selectedRoom]);

  const handleSendMessage = async () => {
    if (selectedFile) {
      await handleSendFile();
      return;
    }

    if (!message.trim() || !selectedRoom?.canSendMessage || sending) return;

    const messageType: MessageType = message.includes("http") ? "Link" : "Text";

    try {
      setSending(true);
      const res = await api.post("/chat/message", {
        chatRoomID: selectedRoom.chatRoomID,
        content: message,
        messageType,
      });

      const newMsg = res.data.result;
      
      setSelectedRoom((prev) =>
        prev ? { ...prev, messages: [...prev.messages, newMsg] } : null
      );
      
      setMessage("");
      fetchConversations();
    } catch {
      // Silent error
    } finally {
      setSending(false);
    }
  };

  const handleSendMeetLink = async () => {
    if (!selectedRoom?.canSendMessage || sending) return;
    
    setMeetError("");
    
    // Validate meet link
    const trimmedLink = meetLink.trim();
    if (!trimmedLink) {
      setMeetError("Vui lòng nhập link Google Meet");
      return;
    }
    
    if (!trimmedLink.startsWith("https://meet.google.com/")) {
      setMeetError("Link phải bắt đầu bằng https://meet.google.com/");
      return;
    }

    try {
      setSending(true);
      const res = await api.post(`/chat/room/${selectedRoom.chatRoomID}/meeting-link`, trimmedLink, {
        headers: { "Content-Type": "text/plain" }
      });

      const newMsg = res.data.result;
      
      setSelectedRoom((prev) =>
        prev ? { ...prev, messages: [...prev.messages, newMsg] } : null
      );
      
      setMeetLink("");
      setShowMeetInput(false);
      setMeetError("");
      fetchConversations();
    } catch {
      setMeetError("Không thể gửi link. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    setSelectedRoom(null);
    navigate(ROUTES.MESSAGES);
  };

  // Hide FloatingChat when on messages page
  if (isOnMessagesPage) return null;

  // Only show FloatingChat when user is logged in (has token and currentUser loaded)
  const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  if (!token || !currentUser) return null;

  // Hide FloatingChat for Admin role
  if (currentUser.role === "Admin") return null;

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 h-[500px] w-80">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedRoom && (
                <button
                  onClick={handleBackToList}
                  className="hover:bg-white/20 p-1 rounded transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="flex flex-col">
                <h3 className="font-semibold truncate">
                  {selectedRoom ? selectedRoom.otherUserName : "Tin nhắn"}
                </h3>
              </div>
              {selectedRoom && selectedRoom.chatRoomType === "Training" && (
                <span className="ml-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  Đã đặt lịch
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* WebSocket connection status */}
              {selectedRoom && (
                <div className="flex items-center gap-1" title={selectedRoomConnected ? "Đã kết nối real-time" : "Đang kết nối..."}>
                  {selectedRoomConnected ? (
                    <Wifi className="w-3 h-3 text-green-300" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-gray-300 animate-pulse" />
                  )}
                </div>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSelectedRoom(null);
                }}
                className="hover:bg-white/20 p-1 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col h-[calc(100%-56px)]">
              {selectedRoom ? (
                <>
                  {/* Messages */}
                  <div ref={messageListRef} className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {selectedRoom.messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400 text-sm">Chưa có tin nhắn</p>
                      </div>
                    ) : (
                      selectedRoom.messages.map((msg) => {
                        // Check if message is from current user (same logic as chat-window)
                        const isMe = currentUser && msg.senderID === currentUser.userID;
                        
                        // Parse message content
                        let displayContent = msg.content;
                        let messageType = msg.messageType;
                        
                        try {
                          const parsed = JSON.parse(msg.content);
                          if (typeof parsed === "object" && parsed !== null) {
                            if (parsed.content) displayContent = parsed.content;
                            if (parsed.messageType) messageType = parsed.messageType;
                          }
                        } catch {
                          // Not JSON, use as is
                        }
                        
                        // Check if it's a file/image
                        const isImage = messageType === "Image" || displayContent.startsWith("data:image/");
                        const isFile = messageType === "File" || displayContent.startsWith("data:application/");
                        const isLink = messageType === "Link" || displayContent.includes("http");
                        
                        return (
                          <div
                            key={msg.messageID}
                            className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                          >
                            <div className="flex-shrink-0" style={{ minWidth: '32px', width: '32px', height: '32px' }}>
                              <Avatar style={{ width: '32px', height: '32px' }}>
                                <AvatarImage 
                                  src={msg.senderAvatarURL || ""} 
                                  alt={msg.senderName}
                                  className="object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                                  {msg.senderName
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <div className={`flex flex-col ${isMe ? "items-end" : ""}`}>
                              <div
                                className={`px-3 py-2 rounded-lg max-w-[200px] break-words ${
                                  isMe
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-900"
                                }`}
                              >
                                {isImage ? (
                                  (() => {
                                    let imageData = { viewUrl: "", downloadUrl: "", filename: "image" };
                                    try {
                                      const parsed = JSON.parse(displayContent);
                                      if (parsed.viewUrl) {
                                        imageData = parsed;
                                      } else {
                                        // Old format: base64 or direct URL
                                        imageData.viewUrl = displayContent;
                                        imageData.downloadUrl = displayContent;
                                      }
                                    } catch {
                                      // Not JSON, treat as direct URL or base64
                                      imageData.viewUrl = displayContent;
                                      imageData.downloadUrl = displayContent;
                                    }
                                    
                                    return (
                                      <div className="flex flex-col gap-1">
                                        <img 
                                          src={imageData.viewUrl} 
                                          alt={imageData.filename || "Shared image"} 
                                          className="max-w-full rounded max-h-40 object-contain cursor-pointer"
                                          onClick={() => window.open(imageData.viewUrl, '_blank')}
                                        />
                                        {imageData.downloadUrl && (
                                          <a
                                            href={imageData.downloadUrl}
                                            download
                                            className={`inline-flex items-center gap-1 text-xs ${
                                              isMe ? "text-blue-100 hover:text-white" : "text-blue-600 hover:text-blue-800"
                                            }`}
                                          >
                                            <Download className="w-3 h-3" />
                                            Tải xuống
                                          </a>
                                        )}
                                      </div>
                                    );
                                  })()
                                ) : isFile ? (
                                  (() => {
                                    let fileData = { 
                                      filename: "Document", 
                                      viewUrl: "", 
                                      downloadUrl: "", 
                                      size: 0,
                                      type: ""
                                    };
                                    
                                    // Debug: log raw content to see what we're parsing
                                    console.log("[FloatingChat] File message raw content:", msg.content);
                                    console.log("[FloatingChat] displayContent:", displayContent);
                                    
                                    try {
                                      const parsed = JSON.parse(displayContent);
                                      console.log("[FloatingChat] Parsed file data:", parsed);
                                      
                                      // New format: has viewUrl and downloadUrl
                                      if (parsed.viewUrl || parsed.downloadUrl) {
                                        fileData = { ...fileData, ...parsed };
                                      } 
                                      // Old format: has url field
                                      else if (parsed.url) {
                                        fileData.filename = parsed.filename || "Document";
                                        fileData.downloadUrl = parsed.url;
                                        fileData.viewUrl = parsed.url;
                                        fileData.size = parsed.size || 0;
                                      }
                                      // Fallback: has filename but no URLs
                                      else if (parsed.filename) {
                                        fileData = { ...fileData, ...parsed };
                                      }
                                    } catch  {
                                      // Old format: [PDF] filename
                                      if (displayContent.startsWith("[PDF]")) {
                                        fileData.filename = displayContent.substring(6);
                                      }
                                    }
                                    
                                    const formatFileSize = (bytes: number) => {
                                      if (bytes === 0) return '';
                                      if (bytes < 1024) return `${bytes} B`;
                                      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
                                      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
                                    };
                                    
                                    // Get file icon based on extension
                                    const getFileIcon = () => {
                                      const ext = fileData.filename.split('.').pop()?.toLowerCase();
                                      if (ext === 'pdf') return '📕';
                                      if (['doc', 'docx'].includes(ext || '')) return '📘';
                                      if (['xls', 'xlsx'].includes(ext || '')) return '📗';
                                      return '�';
                                    };
                                    
                                    return (
                                      <div className="flex flex-col gap-1 min-w-[150px]">
                                        <div className="flex items-center gap-2 text-sm bg-white/10 p-1.5 rounded">
                                          <span>{getFileIcon()}</span>
                                          <div className="flex flex-col flex-1 min-w-0">
                                            <span className="truncate font-medium">{fileData.filename}</span>
                                            {fileData.size > 0 && (
                                              <span className="text-[10px] opacity-70">
                                                {formatFileSize(fileData.size)}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                          {fileData.downloadUrl ? (
                                            <>
                                              <a
                                                href={fileData.downloadUrl}
                                                download
                                                className={`inline-flex items-center gap-1 text-xs ${
                                                  isMe ? "text-blue-100 hover:text-white" : "text-blue-600 hover:text-blue-800"
                                                }`}
                                              >
                                                <Download className="w-3 h-3" />
                                                Tải xuống
                                              </a>
                                              {fileData.viewUrl && (
                                                <a
                                                  href={fileData.viewUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className={`inline-flex items-center gap-1 text-xs ${
                                                    isMe ? "text-blue-100 hover:text-white" : "text-blue-600 hover:text-blue-800"
                                                  }`}
                                                >
                                                  <ImageIcon className="w-3 h-3" />
                                                  Xem online
                                                </a>
                                              )}
                                            </>
                                          ) : (
                                            <div className={`text-xs ${isMe ? "text-blue-100" : "text-gray-500"}`}>
                                              📎 {fileData.filename}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()
                                ) : isLink && displayContent.includes("meet.google.com") ? (
                                  <a
                                    href={displayContent}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block bg-emerald-500 text-white rounded-lg p-2 min-w-[180px] no-underline"
                                  >
                                    <div className="flex items-start gap-2">
                                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 flex-shrink-0">
                                        <Video className="w-4 h-4" />
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] uppercase tracking-wide opacity-80">Google Meet Room</span>
                                        <span className="text-xs font-medium underline break-all">{displayContent}</span>
                                        <span className="text-[9px] mt-0.5 opacity-80">Click để tham gia</span>
                                      </div>
                                    </div>
                                  </a>
                                ) : isLink ? (
                                  <a
                                    href={displayContent}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`underline text-sm ${isMe ? "text-white" : "text-blue-600"}`}
                                  >
                                    🔗 Liên kết
                                  </a>
                                ) : (
                                  <p className="text-sm whitespace-pre-wrap">{displayContent}</p>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400 mt-1">
                                {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input */}
                  <div className="border-t p-3">
                    {/* Booking notice for Advice rooms */}
                    {selectedRoom.chatRoomType === "Advice" && (
                      <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                        {currentUser?.role === "Tutor" ? (
                          <span>Học viên này chưa đặt buổi học. Đây là cuộc trò chuyện tư vấn.</span>
                        ) : (
                          <span>Đặt buổi học với gia sư để mở khóa tính năng chia sẻ hình ảnh và file.</span>
                        )}
                      </div>
                    )}
                    
                    {selectedRoom.canSendMessage ? (
                      <>
                        {/* Meet link input - Tutor only, Training room only */}
                        {showMeetInput && currentUser?.role === "Tutor" && selectedRoom.chatRoomType === "Training" && (
                          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Video className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-medium text-blue-700">Gửi link Google Meet</span>
                              <button
                                onClick={() => { setShowMeetInput(false); setMeetLink(""); setMeetError(""); }}
                                className="ml-auto text-gray-500 hover:text-gray-700"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={meetLink}
                              onChange={(e) => { setMeetLink(e.target.value); setMeetError(""); }}
                              placeholder="https://meet.google.com/xxx-xxxx-xxx"
                              className="w-full px-2 py-1.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            {meetError && (
                              <p className="text-xs text-red-500 mt-1">{meetError}</p>
                            )}
                            <button
                              onClick={handleSendMeetLink}
                              disabled={!meetLink.trim() || sending}
                              className="w-full mt-2 bg-blue-600 text-white py-1.5 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                            >
                              Gửi link
                            </button>
                          </div>
                        )}

                        {/* File preview with send button */}
                        {selectedFile && (
                          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs truncate flex-1 text-blue-900">
                                {selectedFile.type.startsWith("image/") ? "📷" : "📎"} {selectedFile.name}
                              </span>
                              <button
                                onClick={() => {
                                  setSelectedFile(null);
                                  if (fileInputRef.current) fileInputRef.current.value = "";
                                  if (imageInputRef.current) imageInputRef.current.value = "";
                                }}
                                className="text-red-500 hover:text-red-700 ml-2"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              onClick={handleSendFile}
                              disabled={uploading}
                              className="w-full bg-blue-600 text-white py-1.5 rounded text-xs hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                              {uploading ? (
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Send className="w-3 h-3" />
                                  Gửi {selectedFile.type.startsWith("image/") ? "ảnh" : "file"}
                                </>
                              )}
                            </button>
                          </div>
                        )}
                        
                        {/* Hidden file inputs */}
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileSelect(e, "Image")}
                          className="hidden"
                        />
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                          onChange={(e) => handleFileSelect(e, "File")}
                          className="hidden"
                        />

                        {/* Action buttons row - Training room only */}
                        {selectedRoom.chatRoomType === "Training" && (
                          <div className="flex gap-1 mb-2">
                            {currentUser?.role === "Tutor" && (
                              <button
                                onClick={() => setShowMeetInput(!showMeetInput)}
                                disabled={isActionInProgress && !showMeetInput}
                                className={`p-1.5 rounded transition disabled:opacity-50 disabled:cursor-not-allowed ${showMeetInput ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                                title="Gửi link Google Meet"
                              >
                                <Video className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => imageInputRef.current?.click()}
                              disabled={isActionInProgress}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Gửi hình ảnh"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isActionInProgress}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Gửi file (PDF, Word, Excel)"
                            >
                              <Paperclip className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        
                        {/* Typing indicator - above input */}
                        {typingUser && (
                          <div className="mb-1 flex items-center gap-1.5 text-xs text-blue-600">
                            <div className="flex gap-0.5">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                            <span className="text-gray-500">{selectedRoom?.otherUserName} đang nhập...</span>
                          </div>
                        )}

                        {/* Input row */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={message}
                            onChange={(e) => {
                              setMessage(e.target.value);
                              if (e.target.value.trim()) {
                                sendTypingIndicator();
                              }
                            }}
                            onKeyPress={handleKeyPress}
                            placeholder="Nhập tin nhắn..."
                            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            disabled={isActionInProgress}
                          />
                          <button
                            onClick={handleSendMessage}
                            disabled={(!message.trim() && !selectedFile) || sending || uploading}
                            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                          >
                            {uploading ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500 text-center">
                        Không thể gửi tin nhắn
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Conversations List */}
                  <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 text-sm">Đang tải...</p>
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                        <MessageCircle className="w-12 h-12 text-gray-300 mb-2" />
                        <p className="text-gray-500 text-sm">Chưa có cuộc trò chuyện nào</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {conversations.map((conv) => (
                          <button
                            key={conv.chatRoomID}
                            onClick={() => handleOpenConversation(conv.chatRoomID)}
                            className="w-full p-3 hover:bg-gray-50 transition flex items-start gap-3 text-left"
                          >
                            <div className="flex-shrink-0" style={{ minWidth: '40px', width: '40px', height: '40px' }}>
                              <Avatar style={{ width: '40px', height: '40px' }}>
                                <AvatarImage 
                                  src={conv.otherUserAvatar || ""} 
                                  alt={conv.otherUserName}
                                  className="object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-xs">
                                  {conv.otherUserName
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm text-gray-900 truncate">
                                  {conv.otherUserName}
                                </p>
                                {conv.chatRoomType === "Training" && (
                                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                    Đã đặt lịch
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate">
                                {conv.lastMessage || "Chưa có tin nhắn"}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="border-t p-3">
                    <button
                      onClick={handleViewAll}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Xem tất cả tin nhắn
                    </button>
                  </div>
                </>
              )}
            </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={handleToggleChat}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300 group"
        aria-label="Open chat"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        )}
        
        {/* Notification Badge - Red dot for unread messages */}
        {!isOpen && hasUnread && (
          <span className="absolute -top-1 -right-1 bg-red-600 rounded-full w-5 h-5 border-2 border-white shadow-lg animate-bounce" />
        )}
      </button>
    </>
  );
};

export default FloatingChat;