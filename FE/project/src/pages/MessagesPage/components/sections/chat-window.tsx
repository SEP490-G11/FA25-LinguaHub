import { useEffect, useState, useRef } from "react";
import {
  Send,
  Video,
  Image as ImageIcon,
  Paperclip,
  X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import api from "@/config/axiosConfig";
import { useUserInfo } from "@/hooks/useUserInfo";

interface ChatWindowProps {
  conversationId: number;
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

const ChatWindow = ({ conversationId }: ChatWindowProps) => {
  const { toast } = useToast();
  const [message, setMessage] = useState<string>(""); // Text input for message
  const [room, setRoom] = useState<ChatRoom | null>(null); // Chat room data
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [showMeetLinkInput, setShowMeetLinkInput] = useState<boolean>(false); // Show Google Meet link input
  const [meetLink, setMeetLink] = useState<string>(""); // Google Meet link input
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Selected file
  const [filePreview, setFilePreview] = useState<string | null>(null); // File preview URL
  const [uploading, setUploading] = useState<boolean>(false); // Uploading state

  const { user: currentUser, loading: userLoading } = useUserInfo(); // User information
  const messageListRef = useRef<HTMLDivElement | null>(null); // Message list ref
  const fileInputRef = useRef<HTMLInputElement | null>(null); // File input ref
  const imageInputRef = useRef<HTMLInputElement | null>(null); // Image input ref

  /** Auto scroll */
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [room?.messages]);

  /** Load chat room */
  useEffect(() => {
    const fetchRoom = async () => {
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
        console.error("Failed to load chat room:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [conversationId]);

  /** Send text / link message */
  const handleSendMessage = async () => {
    if (!message.trim() || !room?.canSendMessage) return;

    let messageType: MessageType = "Text";
    const urlPattern = /https?:\/\/[^\s]+/;
    if (urlPattern.test(message.trim())) {
      messageType = "Link";
    }

    try {
      const res = await api.post("/chat/message", {
        chatRoomID: Number(conversationId),
        content: message,
        messageType,
      });

      const newMsg = normalizeMessage(
          res.data.result,
          conversationId,
          currentUser?.fullName ?? "Unknown"
      );

      setRoom((prev) =>
          prev ? { ...prev, messages: [...prev.messages, newMsg] } : null
      );
      setMessage(""); // Clear message input
    } catch (err) {
      console.error("Send message failed:", err);
    }
  };

  /** Send Google Meet link (Tutor only) */
  const handleSendMeetLink = async () => {
    if (!meetLink.trim() || !room?.canSendMessage) return;
    if (currentUser?.role !== "Tutor") return;

    try {
      const res = await api.post(`/chat/room/${conversationId}/meeting-link`, {
        content: meetLink,
        messageType: "Link",
      });

      const newMsg = normalizeMessage(
          res.data.result,
          conversationId,
          currentUser?.fullName ?? "Unknown"
      );

      setRoom((prev) =>
          prev ? { ...prev, messages: [...prev.messages, newMsg] } : null
      );
      setMeetLink(""); // Clear meet link input
      setShowMeetLinkInput(false);
    } catch (err) {
      console.error("Send Google Meet link failed:", err);
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
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPG, GIF, etc.)",
      });
      // Clear input
      if (imageInputRef.current) imageInputRef.current.value = "";
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
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const messageType: MessageType = selectedFile.type.startsWith("image/") ? "Image" : "File";

        try {
          const res = await api.post("/chat/message", {
            chatRoomID: Number(conversationId),
            content: base64, // Send as base64
            messageType,
          });

          const newMsg = normalizeMessage(
              res.data.result,
              conversationId,
              currentUser?.fullName ?? "Unknown"
          );

          setRoom((prev) =>
              prev ? { ...prev, messages: [...prev.messages, newMsg] } : null
          );
          handleClearFile();
        } catch (err) {
          console.error("Send file failed:", err);
          toast({
            variant: "destructive",
            title: "Failed to send file",
            description: "Please try again later.",
          });
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      console.error("File processing failed:", err);
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
            <Avatar>
              <AvatarImage src={otherAvatar} alt={otherName} />
              <AvatarFallback>
                {otherName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="font-semibold text-lg">{otherName}</div>
            {isBooked && (
                <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
              Booked
            </span>
            )}
          </div>
          {isBooked && currentUser?.role === "Tutor" && (
              <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMeetLinkInput(!showMeetLinkInput)}
                  className="rounded-full hover:bg-blue-50"
              >
                <Video className="w-5 h-5 text-blue-600" />
              </Button>
          )}
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
                        <div>
                          <img 
                              src={msg.content} 
                              alt="Shared image" 
                              className="max-w-full rounded-lg max-h-64 object-contain"
                          />
                        </div>
                    ) : msg.messageType === "File" ? (
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4" />
                          <a
                              href={msg.content}
                              download
                              className={`underline text-sm ${
                                  isUser ? "text-blue-100" : "text-blue-600"
                              }`}
                          >
                            Download File
                          </a>
                        </div>
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
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
            );
          })}
        </div>

        {/* INPUT BOX */}
        <div className="p-4 bg-white/90 border-t backdrop-blur">
          {!isBooked && (
              <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                {currentUser?.role === "Tutor" ? (
                    <span>This learner has not booked any training session yet.</span>
                ) : (
                    <span>
                Book a training session to unlock file sharing, images and Google
                Meet.
              </span>
                )}
              </div>
          )}

          {showMeetLinkInput && isBooked && (
              <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                <div className="flex items-center mb-2 space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                <span className="text-sm font-semibold text-blue-700">
                  Send Google Meet Room
                </span>
                    <span className="text-xs text-blue-500">
                  Paste your Google Meet link below
                </span>
                  </div>
                </div>
                <Textarea
                    placeholder="Example: https://meet.google.com/xxx-xxxx-xxx"
                    value={meetLink}
                    onChange={(e) => setMeetLink(e.target.value)}
                    className="resize-none border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <div className="mt-2 flex justify-end">
                  <Button
                      onClick={handleSendMeetLink}
                      disabled={!meetLink.trim()}
                      className="bg-blue-600 hover:bg-blue-700 rounded-lg text-white px-4"
                  >
                    Send Google Meet Link
                  </Button>
                </div>
              </div>
          )}

          {/* File Preview */}
          {selectedFile && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-blue-900">Selected File:</span>
                  <button onClick={handleClearFile} className="text-red-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {filePreview ? (
                    <img src={filePreview} alt="Preview" className="max-h-32 rounded-lg" />
                ) : (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Paperclip className="w-4 h-4" />
                      <span className="text-sm">{selectedFile.name}</span>
                    </div>
                )}
                <Button
                    onClick={handleSendFile}
                    disabled={uploading}
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {uploading ? "Uploading..." : "Send File"}
                </Button>
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
                  {/* <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, "File")}
                  /> */}
                  <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={!canSendMessage || !!selectedFile}
                      className="rounded-full hover:bg-blue-50"
                  >
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                  </Button>
                  {/* <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!canSendMessage || !!selectedFile}
                      className="rounded-full hover:bg-blue-50"
                  >
                    <Paperclip className="w-5 h-5 text-blue-600" />
                  </Button> */}
                </>
            )}

            <Textarea
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
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
