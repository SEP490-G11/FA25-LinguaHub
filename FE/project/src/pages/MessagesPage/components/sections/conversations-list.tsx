import { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import api from "@/config/axiosConfig";

interface ConversationsListProps {
  selectedConversation: number | null;
  onSelectConversation: (id: number) => void;
  onRefreshRef?: React.MutableRefObject<(() => void) | null>;
}

interface MyInfo {
  userID: number;
  fullName: string;
  avatarURL: string | null;
  email: string;
  role: string;
}

interface ChatRoomMessage {
  messageID: number;
  content: string;
  messageType: string;
  createdAt: string;
}

interface ChatRoom {
  chatRoomID: number;
  tutorID: number;
  tutorName: string;
  tutorAvatarURL: string | null;
  userID: number;
  userName: string;
  userAvatarURL: string | null;
  chatRoomType: "Advice" | "Training";
  messages: ChatRoomMessage[];
}

const ConversationsList = ({
  selectedConversation,
  onSelectConversation,
  onRefreshRef,
}: ConversationsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [myInfo, setMyInfo] = useState<MyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Load my info
  useEffect(() => {
    api
      .get("/users/myInfo")
      .then((res) => {
        setMyInfo(res.data.result);
      })
      .catch(() => {});
  }, []);

  // Fetch rooms function
  const fetchRooms = useCallback(async () => {
    try {
      const res = await api.get("/chat/rooms");
      const roomsData = res.data?.result || [];

      const normalized = roomsData.map((room: ChatRoom) => ({
        ...room,
        messages: [...room.messages].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
      }));

      // Sort rooms by latest message time (newest first)
      const sortedRooms = normalized.sort((a: ChatRoom, b: ChatRoom) => {
        const aLastMsg = a.messages[a.messages.length - 1];
        const bLastMsg = b.messages[b.messages.length - 1];

        if (!aLastMsg && !bLastMsg) return 0;
        if (!aLastMsg) return 1;
        if (!bLastMsg) return -1;

        return (
          new Date(bLastMsg.createdAt).getTime() -
          new Date(aLastMsg.createdAt).getTime()
        );
      });

      setRooms(sortedRooms);
    } catch (err) {
      console.error("Error loading chat rooms:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load only - no polling
  // Refresh is triggered by parent (chat-window) via onRefreshRef when new message arrives
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Expose refresh function to parent via ref
  useEffect(() => {
    if (onRefreshRef) {
      onRefreshRef.current = fetchRooms;
    }
    return () => {
      if (onRefreshRef) {
        onRefreshRef.current = null;
      }
    };
  }, [onRefreshRef, fetchRooms]);

  if (!myInfo) {
    return (
      <div className="p-4 text-center text-gray-500 border-r h-full">
        Đang tải...
      </div>
    );
  }

  const getRoomDisplay = (room: ChatRoom) => {
    if (myInfo.userID === room.userID) {
      return {
        name: room.tutorName,
        avatar: room.tutorAvatarURL,
      };
    }

    if (myInfo.userID === room.tutorID) {
      return {
        name: room.userName,
        avatar: room.userAvatarURL,
      };
    }

    return {
      name: room.userName,
      avatar: room.userAvatarURL,
    };
  };

  const filteredRooms = rooms.filter((room) => {
    const { name } = getRoomDisplay(room);
    return name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const renderMessageContent = (msg: ChatRoomMessage) => {
    let content = msg.content;
    let type = msg.messageType;

    // Nếu content là chuỗi JSON, cố gắng parse
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

    // Check message type first
    if (type === "Image" || msg.messageType === "Image") {
      return " Hình ảnh";
    }

    if (type === "File" || msg.messageType === "File") {
      return " File";
    }

    // Check if content is base64 image
    if (content.startsWith("data:image/")) {
      return " Hình ảnh";
    }

    // Check if content is base64 file/document
    if (
      content.startsWith("data:application/") ||
      content.startsWith("data:")
    ) {
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
    if (content.length > 50) {
      return content.substring(0, 50) + "...";
    }

    return content;
  };

  return (
    <div className="border-r border-gray-200 flex flex-col h-full max-h-full bg-[#F0F9FF] overflow-hidden">
      {/* HEADER */}
      <div className="p-4 border-b border-blue-100 bg-white/80 backdrop-blur-sm flex-shrink-0">
        <h2 className="text-xl font-bold mb-4 text-blue-900">Tin nhắn</h2>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 w-4 h-4" />
          <Input
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-blue-200 focus:ring-blue-300"
          />
        </div>
      </div>

      {/* LIST - Will scroll when content exceeds available height */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50">
        {loading && (
          <div className="p-4 text-center text-blue-500">
            Đang tải cuộc trò chuyện...
          </div>
        )}

        {!loading && filteredRooms.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            Không tìm thấy cuộc trò chuyện.
          </div>
        )}

        {!loading &&
          filteredRooms.map((room) => {
            const { name: displayName, avatar: displayAvatar } =
              getRoomDisplay(room);

            const lastMessage = room.messages[room.messages.length - 1];
            const lastMsgText = lastMessage
              ? renderMessageContent(lastMessage)
              : "Chưa có tin nhắn";
            const lastMsgTime = lastMessage
              ? new Date(lastMessage.createdAt).toLocaleString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })
              : "—";

            const isSelected = selectedConversation === room.chatRoomID;
            const hasBooking = room.chatRoomType === "Training";

            return (
              <div
                key={room.chatRoomID}
                onClick={() => onSelectConversation(room.chatRoomID)}
                className={`p-4 border-b border-blue-100 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-blue-100 shadow-inner"
                    : "hover:bg-blue-50 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="flex-shrink-0"
                    style={{ minWidth: "48px", width: "48px", height: "48px" }}
                  >
                    <Avatar
                      className="border border-blue-300 shadow-sm"
                      style={{ width: "48px", height: "48px" }}
                    >
                      <AvatarImage
                        src={displayAvatar || ""}
                        alt={displayName}
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm">
                        {displayName
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm text-blue-900 truncate">
                        {displayName}
                      </h3>
                      <span className="text-xs text-blue-500">
                        {lastMsgTime}
                      </span>
                    </div>

                    <p className="text-sm truncate text-gray-600">
                      {lastMsgText}
                    </p>

                    {hasBooking && (
                      <span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded-full mt-1 inline-block">
                        Đã đặt lịch
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default ConversationsList;
