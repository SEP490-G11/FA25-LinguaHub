import { useEffect, useState, useRef, useCallback } from "react";
import {
  Send,
  Video,
  Image as ImageIcon,
  X,
  FileText,
  Download,
  Wifi,
  WifiOff,
  Paperclip
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import api from "@/config/axiosConfig";
import { useUserInfo } from "@/hooks/useUserInfo";
import { uploadFileToBackend, type FileUploadResponse } from "@/utils/fileUpload";
import { useChatSignal } from "@/hooks/useChatSignal";

interface ChatWindowProps {
  conversationId: number;
  onNewMessage?: () => void;
}

export type MessageType = "Text" | "Link" | "Image" | "File";

interface RawMessage {
  messageID?: number;
  chatRoomID?: number;
  senderID?: number;
  senderName?: string;
  senderAvatarURL?: string | null;
  content?: string | { content: string; messageType: MessageType };
  messageType?: MessageType;
  createdAt?: string;
}

export interface ChatMessage {
  messageID: number;
  chatRoomID: number;
  senderID: number;
  senderName: string;
  senderAvatarURL: string | null;
  content: string;
  messageType: MessageType;
  createdAt: string;
}

export interface ChatRoom {
  chatRoomID: number;
  title: string;
  description: string;
  userID: number;
  userName: string;
  userAvatarURL: string | null;
  tutorID: number;
  tutorName: string;
  tutorAvatarURL: string | null;
  chatRoomType: "Advice" | "Training";
  createdAt: string | null;
  canSendMessage: boolean;
  allowedMessageTypes: MessageType[];
  messages: ChatMessage[];
}

/** Normalize the message data */
function normalizeMessage(
    m: RawMessage,
    fallbackChatRoomID: number,
    currentUserName = "Unknown"
): ChatMessage {
  let parsedContent = m.content;
  let messageType = m.messageType ?? "Text";

  // If content is a JSON string, attempt to parse it
  if (typeof parsedContent === "string") {
    try {
      const parsed = JSON.parse(parsedContent);
      if (typeof parsed === "object" && parsed !== null) {
        if (typeof (parsed as { content: string }).content === "string") {
          parsedContent = (parsed as { content: string }).content;
        }
        if (typeof (parsed as { messageType: string }).messageType === "string") {
          messageType = (parsed as { messageType: string }).messageType as MessageType;
        }
      }
    } catch {
      // Do nothing if parsing fails
    }
  }

  return {
    messageID: m.messageID ?? Date.now(),
    chatRoomID: m.chatRoomID ?? fallbackChatRoomID,
    senderID: m.senderID ?? 0,
    senderName: m.senderName ?? currentUserName,
    senderAvatarURL: m.senderAvatarURL ?? null,
    content: typeof parsedContent === "string" ? parsedContent : "",
    messageType,
    createdAt: m.createdAt ?? new Date().toISOString(),
  };
}

/** Check if the content is a Google Meet link */
function isGoogleMeetLink(content: string): boolean {
  return content.includes("https://meet.google.com");
}

const ChatWindow = ({ conversationId, onNewMessage }: ChatWindowProps) => {
  const { toast } = useToast();
  const [message, setMessage] = useState<string>("");
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showMeetLinkInput, setShowMeetLinkInput] = useState<boolean>(false);
  const [meetLink, setMeetLink] = useState<string>("");
  const [meetError, setMeetError] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [typingUser, setTypingUser] = useState<number | null>(null);
  const [sending, setSending] = useState<boolean>(false);

  const { user: currentUser, loading: userLoading } = useUserInfo(); // User information
  const messageListRef = useRef<HTMLDivElement | null>(null); // Message list ref
  const fileInputRef = useRef<HTMLInputElement | null>(null); // File input ref
  const imageInputRef = useRef<HTMLInputElement | null>(null); // Image input ref
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserRef = useRef(currentUser);
  
  // Keep currentUserRef updated
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);
  
  // Check if any action is in progress (for disabling other buttons)
  const isActionInProgress = uploading || sending || !!selectedFile || showMeetLinkInput;

  // Fetch room data function
  const fetchRoom = useCallback(async () => {
    try {
      const res = await api.get(`/chat/room/${conversationId}`);
      const rawRoom = res.data.result;

      const normalizedMessages: ChatMessage[] = rawRoom.messages.map(
        (m: RawMessage) =>
          normalizeMessage(m, rawRoom.chatRoomID, m.senderName ?? "Unknown")
      );

      setRoom({
        ...rawRoom,
        messages: normalizedMessages,
      });
    } catch (err) {
      console.error("[ChatWindow] ❌ Failed to load chat room:", err);
    }
  }, [conversationId]);

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
  }, [currentUser?.userID]);

  // Use WebSocket signal to refetch on new message
  const { isConnected } = useChatSignal(conversationId, () => {
    fetchRoom();
  }, {
    onTyping: handleTyping,
    onNewMessage: () => {
      onNewMessage?.();
    },
  });

  /** Auto scroll */
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [room?.messages]);

  /** Load chat room - on mount or conversationId change */
  useEffect(() => {
    setLoading(true);
    fetchRoom().finally(() => setLoading(false));
  }, [conversationId, fetchRoom]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Debounced typing indicator
  const lastTypingSentRef = useRef<number>(0);
  const sendTypingIndicator = useCallback(async () => {
    const now = Date.now();
    // Only send typing indicator every 2 seconds
    if (now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;
    
    try {
      await api.post(`/chat/room/${conversationId}/typing`);
    } catch (err) {
      // Silently ignore typing indicator errors
      console.debug("Typing indicator failed:", err);
    }
  }, [conversationId]);

  /** Send text / link message */
  const handleSendMessage = async () => {
    if (!message.trim() || !room?.canSendMessage) return;

    let messageType: MessageType = "Text";
    const urlPattern = /https?:\/\/[^\s]+/;
    if (urlPattern.test(message.trim())) {
      messageType = "Link";
    }

    const messageContent = message.trim();
    setMessage(""); // Clear message input immediately for better UX
    setSending(true);

    try {
      const res = await api.post("/chat/message", {
        chatRoomID: Number(conversationId),
        content: messageContent,
        messageType,
      });

      // Optimistic update: Add message to local state immediately for sender
      const newMsg = normalizeMessage(
        res.data.result,
        conversationId,
        currentUser?.fullName ?? "Unknown"
      );
      
      setRoom((prev) =>
        prev ? { ...prev, messages: [...prev.messages, newMsg] } : null
      );
      
      onNewMessage?.();
    } catch (err) {
      // Silent error
      // Restore message on error
      setMessage(messageContent);
      toast({
        variant: "destructive",
        title: "Không thể gửi tin nhắn",
        description: "Vui lòng thử lại sau.",
      });
    } finally {
      setSending(false);
    }
  };

  /** Send Google Meet link (Tutor only) */
  const handleSendMeetLink = async () => {
    if (!room?.canSendMessage) return;
    if (currentUser?.role !== "Tutor") return;

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

    setSending(true);
    try {
      const res = await api.post(`/chat/room/${conversationId}/meeting-link`, trimmedLink, {
        headers: { "Content-Type": "text/plain" }
      });

      const newMsg = normalizeMessage(
          res.data.result,
          conversationId,
          currentUser?.fullName ?? "Unknown"
      );

      setRoom((prev) =>
          prev ? { ...prev, messages: [...prev.messages, newMsg] } : null
      );
      setMeetLink("");
      setShowMeetLinkInput(false);
      setMeetError("");
      onNewMessage?.();
    } catch {
      setMeetError("Không thể gửi link. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  };

  /** Handle file selection */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "Image" | "File") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image type
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

    // Check file size (max 10MB for images, 100MB for documents)
    const maxSize = type === "Image" ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "File quá lớn",
        description: type === "Image" 
          ? "Hình ảnh phải nhỏ hơn 10MB" 
          : "File tài liệu phải nhỏ hơn 100MB",
      });
      if (type === "Image" && imageInputRef.current) imageInputRef.current.value = "";
      if (type === "File" && fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (type === "Image" && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  /** Clear selected file */
  const handleClearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  /** Send file/image */
  const handleSendFile = async () => {
    if (!selectedFile || !room?.canSendMessage) return;

    setUploading(true);
    
    const messageType: MessageType = selectedFile.type.startsWith("image/") ? "Image" : "File";
    
    try {
      toast({
        title: "Đang tải lên...",
        description: "Vui lòng đợi trong giây lát",
      });

      // Upload file to backend API (Cloudinary)
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
        chatRoomID: Number(conversationId),
        content: fileData,
        messageType: messageType,
      });

      const newMsg = normalizeMessage(
        res.data.result,
        conversationId,
        currentUser?.fullName ?? "Unknown"
      );

      // Update local state for immediate feedback (optimistic update)
      setRoom((prev) =>
        prev ? { ...prev, messages: [...prev.messages, newMsg] } : null
      );
      
      toast({
        title: messageType === "Image" ? "Hình ảnh đã gửi" : "File đã gửi",
        description: `"${selectedFile.name}" đã được chia sẻ`,
      });
      
      handleClearFile();
      onNewMessage?.(); // Notify parent to refresh conversations list
      
    } catch (err: any) {
      // Silent error
      toast({
        variant: "destructive",
        title: "Không thể gửi file",
        description: err.message || "Vui lòng thử lại sau.",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading || userLoading) {
    return (
        <div className="flex items-center justify-center h-full text-gray-400">
          Loading...
        </div>
    );
  }

  if (!room || !currentUser) {
    return (
        <div className="flex items-center justify-center h-full text-gray-400">
          Chat room not found
        </div>
    );
  }

  let otherName = "";
  let otherAvatar = "";
  if (currentUser.userID === room.userID) {
    otherName = room.tutorName;
    otherAvatar = room.tutorAvatarURL || "";
  } else if (currentUser.userID === room.tutorID) {
    otherName = room.userName;
    otherAvatar = room.userAvatarURL || "";
  } else {
    otherName = room.userName;
    otherAvatar = room.userAvatarURL || "";
  }

  const isBooked = room.chatRoomType === "Training";
  const canSendMessage = room.canSendMessage;

  return (
      <div className="flex flex-col h-full max-h-full overflow-hidden bg-gradient-to-b from-slate-50 via-sky-50 to-blue-50">
        {/* HEADER */}
        <div className="p-4 border-b bg-white/90 backdrop-blur flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0" style={{ minWidth: '48px', width: '48px', height: '48px' }}>
              <Avatar style={{ width: '48px', height: '48px' }}>
                <AvatarImage src={otherAvatar} alt={otherName} className="object-cover" referrerPolicy="no-referrer" />
                <AvatarFallback className="text-sm bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                  {otherName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <div className="font-semibold text-lg">{otherName}</div>
            </div>
            {isBooked && (
                <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
              Đã đặt lịch
            </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* WebSocket connection status */}
            <div className="flex items-center gap-1" title={isConnected ? "Đã kết nối real-time" : "Đang kết nối..."}>
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-gray-400 animate-pulse" />
              )}
            </div>
            {isBooked && currentUser?.role === "Tutor" && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMeetLinkInput(!showMeetLinkInput)}
                    disabled={isActionInProgress && !showMeetLinkInput}
                    className="rounded-full hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Gửi link Google Meet"
                >
                  <Video className="w-5 h-5 text-blue-600" />
                </Button>
            )}
          </div>
        </div>

        {/* MESSAGE LIST */}
        <div
            ref={messageListRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
        >
          {room.messages.map((msg) => {
            const isUser = msg.senderID === currentUser.userID;
            const meetLink =
                msg.messageType === "Link" && isGoogleMeetLink(msg.content);

            return (
                <div
                    key={msg.messageID}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                      className={
                        meetLink
                            ? `max-w-[75%] rounded-2xl px-3 py-2 shadow-md
                    bg-emerald-500 text-white
                    ${isUser ? "rounded-br-sm" : "rounded-bl-sm"}`
                            : `max-w-[75%] rounded-2xl px-3 py-2 shadow-md
                    ${isUser
                                ? "bg-blue-600 text-white rounded-br-sm"
                                : "bg-white text-gray-900 rounded-bl-sm"}`
                      }
                  >
                    {meetLink ? (
                        <div className="flex items-start space-x-2">
                          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                            <Video className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wide opacity-80">
                        Google Meet Room
                      </span>
                            <a
                                href={msg.content}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium underline break-all"
                            >
                              {msg.content}
                            </a>
                            <span className="text-[10px] mt-1 opacity-80">
                        Click to join the room
                      </span>
                          </div>
                        </div>
                    ) : msg.messageType === "Image" ? (
                        (() => {
                          let imageData = { viewUrl: "", downloadUrl: "", filename: "image" };
                          try {
                            const parsed = JSON.parse(msg.content);
                            if (parsed.viewUrl) {
                              imageData = parsed;
                            } else {
                              // Old format: base64 or direct URL
                              imageData.viewUrl = msg.content;
                              imageData.downloadUrl = msg.content;
                            }
                          } catch {
                            // Not JSON, treat as direct URL or base64
                            imageData.viewUrl = msg.content;
                            imageData.downloadUrl = msg.content;
                          }
                          
                          return (
                            <div className="flex flex-col gap-2">
                              <img 
                                  src={imageData.viewUrl} 
                                  alt={imageData.filename || "Shared image"} 
                                  className="max-w-full rounded-lg max-h-64 object-contain cursor-pointer"
                                  onClick={() => window.open(imageData.viewUrl, '_blank')}
                              />
                              {imageData.downloadUrl && (
                                <a
                                  href={imageData.downloadUrl}
                                  download
                                  className={`inline-flex items-center gap-1 text-xs ${
                                    isUser ? "text-blue-100 hover:text-white" : "text-blue-600 hover:text-blue-800"
                                  }`}
                                >
                                  <Download className="w-3 h-3" />
                                  Tải xuống
                                </a>
                              )}
                            </div>
                          );
                        })()
                    ) : msg.messageType === "File" ? (
                        (() => {
                          let fileData = { 
                            filename: "Document", 
                            viewUrl: "", 
                            downloadUrl: "", 
                            size: 0,
                            type: ""
                          };
                          
                          try {
                            const parsed = JSON.parse(msg.content);
                            
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
                          } catch (e) {
                            // Old format: [PDF] filename
                            if (msg.content.startsWith("[PDF]")) {
                              fileData.filename = msg.content.substring(6);
                            }
                          }
                          
                          // Determine file icon based on type or extension
                          const getFileIcon = () => {
                            const ext = fileData.filename.split('.').pop()?.toLowerCase();
                            if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-600" />;
                            if (['doc', 'docx'].includes(ext || '')) return <FileText className="w-5 h-5 text-blue-600" />;
                            if (['xls', 'xlsx'].includes(ext || '')) return <FileText className="w-5 h-5 text-green-600" />;
                            if (['ppt', 'pptx'].includes(ext || '')) return <FileText className="w-5 h-5 text-orange-600" />;
                            return <FileText className="w-5 h-5" />;
                          };
                          
                          const formatFileSize = (bytes: number) => {
                            if (bytes === 0) return '';
                            if (bytes < 1024) return `${bytes} B`;
                            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
                            return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
                          };
                          
                          return (
                            <div className="flex flex-col gap-2 min-w-[200px]">
                              <div className="flex items-center gap-2 bg-white/10 p-2 rounded">
                                {getFileIcon()}
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="text-sm font-medium truncate">
                                    {fileData.filename}
                                  </span>
                                  {fileData.size > 0 && (
                                    <span className="text-xs opacity-70">
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
                                      className={`inline-flex items-center gap-1 text-sm font-medium ${
                                        isUser ? "text-blue-100 hover:text-white" : "text-blue-600 hover:text-blue-800"
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
                                        className={`inline-flex items-center gap-1 text-sm ${
                                          isUser ? "text-blue-100 hover:text-white" : "text-blue-600 hover:text-blue-800"
                                        }`}
                                      >
                                        <ImageIcon className="w-3 h-3" />
                                        Xem online
                                      </a>
                                    )}
                                  </>
                                ) : (
                                  <div className={`text-xs ${isUser ? "text-blue-100" : "text-gray-500"}`}>
                                    📎 {fileData.filename}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()
                    ) : msg.messageType === "Link" ? (
                        <a
                            href={msg.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`underline break-all ${
                                isUser ? "text-blue-100" : "text-blue-600"
                            }`}
                        >
                          {msg.content}
                        </a>
                    ) : (
                        <p className="whitespace-pre-wrap break-words text-sm">
                          {msg.content}
                        </p>
                    )}

                    <p
                        className={`text-[10px] mt-1 text-right ${
                            isUser
                                ? "text-blue-100/80"
                                : meetLink
                                    ? "text-emerald-50/80"
                                    : "text-gray-400"
                        }`}
                    >
                      {new Date(msg.createdAt).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </p>
                  </div>
                </div>
            );
          })}
        </div>

        {/* INPUT BOX */}
        <div className="p-4 bg-white/90 border-t backdrop-blur">
          {!isBooked && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                {currentUser?.role === "Tutor" ? (
                    <span>
                      Học viên này chưa đặt buổi học. Đây là cuộc trò chuyện tư vấn.
                    </span>
                ) : (
                    <span>
                      Đặt buổi học với gia sư để mở khóa tính năng chia sẻ hình ảnh và Google Meet.
                    </span>
                )}
              </div>
          )}

          {showMeetLinkInput && isBooked && (
              <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                      <Video className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-blue-700">
                        Gửi link Google Meet
                      </span>
                      <span className="text-xs text-blue-500">
                        Dán link Google Meet của bạn vào đây
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowMeetLinkInput(false); setMeetLink(""); setMeetError(""); }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <Textarea
                    placeholder="Ví dụ: https://meet.google.com/xxx-xxxx-xxx"
                    value={meetLink}
                    onChange={(e) => { setMeetLink(e.target.value); setMeetError(""); }}
                    className="resize-none border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                {meetError && (
                  <p className="text-sm text-red-500 mt-1">{meetError}</p>
                )}
                <div className="mt-2 flex justify-end">
                  <Button
                      onClick={handleSendMeetLink}
                      disabled={!meetLink.trim()}
                      className="bg-blue-600 hover:bg-blue-700 rounded-lg text-white px-4"
                  >
                    Gửi link
                  </Button>
                </div>
              </div>
          )}

          {/* File Preview */}
          {selectedFile && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-blue-900">
                    {selectedFile.type.startsWith("image/") ? "Hình ảnh đã chọn:" : "File đã chọn:"}
                  </span>
                  <button onClick={handleClearFile} className="text-red-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {filePreview ? (
                    <img src={filePreview} alt="Preview" className="max-h-32 rounded-lg" />
                ) : (
                    <div className="flex items-center gap-2 text-gray-700 bg-white p-2 rounded">
                      {(() => {
                        const ext = selectedFile.name.split('.').pop()?.toLowerCase();
                        if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-600" />;
                        if (['doc', 'docx'].includes(ext || '')) return <FileText className="w-5 h-5 text-blue-600" />;
                        if (['xls', 'xlsx'].includes(ext || '')) return <FileText className="w-5 h-5 text-green-600" />;
                        if (['ppt', 'pptx'].includes(ext || '')) return <FileText className="w-5 h-5 text-orange-600" />;
                        return <Paperclip className="w-5 h-5" />;
                      })()}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{selectedFile.name}</span>
                        <span className="text-xs text-gray-500">
                          {selectedFile.size < 1024 * 1024 
                            ? `${(selectedFile.size / 1024).toFixed(2)} KB`
                            : `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                          }
                        </span>
                      </div>
                    </div>
                )}
                <Button
                    onClick={handleSendFile}
                    disabled={uploading}
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {uploading ? "Đang tải lên..." : selectedFile.type.startsWith("image/") ? "Gửi hình ảnh" : "Gửi file"}
                </Button>
              </div>
          )}

          {/* Typing indicator - above input */}
          {typingUser && (
            <div className="mb-2 flex items-center gap-2 text-sm text-blue-600">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-gray-500">{otherName} đang nhập...</span>
            </div>
          )}

          <div className="flex items-end space-x-2">
            {/* File/Image Upload Buttons (only for Training room) */}
            {isBooked && (
                <>
                  <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, "Image")}
                  />
                  <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, "File")}
                  />
                  <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={!canSendMessage || isActionInProgress}
                      className="rounded-full hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Gửi hình ảnh"
                  >
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                  </Button>
                  <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!canSendMessage || isActionInProgress}
                      className="rounded-full hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Gửi file (PDF, Word, Excel)"
                  >
                    <Paperclip className="w-5 h-5 text-gray-600" />
                  </Button>
                </>
            )}

            <Textarea
                placeholder="Type your message..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  // Send typing indicator when user types
                  if (e.target.value.trim()) {
                    sendTypingIndicator();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 min-h-[44px] max-h-32 resize-none rounded-xl shadow-sm border border-slate-200 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={1}
                disabled={!canSendMessage || !!selectedFile}
            />

            <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || !canSendMessage || !!selectedFile}
                className="bg-blue-600 hover:bg-blue-700 rounded-full text-white px-4 h-[44px] flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
  );
};

export default ChatWindow;
