import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import api from "@/config/axiosConfig";

interface ConversationsListProps {
  selectedConversation: number | null;
  onSelectConversation: (id: number) => void;
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
                           }: ConversationsListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [myInfo, setMyInfo] = useState<MyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Load my info
  useEffect(() => {
    api
        .get("/users/myInfo")
        .then((res) => setMyInfo(res.data.result))
        .catch(() => {});
  }, []);

  // Load + auto-refresh list
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get("/chat/rooms");
        const roomsData = res.data?.result || [];

        const normalized = roomsData.map((room: ChatRoom) => ({
          ...room,
          messages: [...room.messages].sort(
              (a, b) =>
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime()
          ),
        }));

        setRooms(normalized);
      } catch (err) {
        console.error("Error loading chat rooms:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 800);

    return () => clearInterval(interval);
  }, []);

  if (!myInfo) {
    return (
        <div className="p-4 text-center text-gray-500 border-r h-full">
          Loading...
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

    // Check if content is base64 image
    if (content.startsWith("data:image/")) {
      return "📷 Image";
    }

    // Check if content is base64 file/document
    if (content.startsWith("data:application/") || content.startsWith("data:")) {
      return "📎 File";
    }

    if (type === "Link") {
      return "🔗 Link";
    }

    // Regular text - truncate if too long
    if (content.length > 50) {
      return content.substring(0, 50) + "...";
    }

    return content;
  };


  return (
      <div className="border-r border-gray-200 flex flex-col h-full bg-[#F0F9FF]">
        {/* HEADER */}
        <div className="p-4 border-b border-blue-100 bg-white/80 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 text-blue-900">Messages</h2>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 w-4 h-4" />
            <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-blue-200 focus:ring-blue-300"
            />
          </div>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
              <div className="p-4 text-center text-blue-500">
                Loading conversations...
              </div>
          )}

          {!loading && filteredRooms.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No conversations found.
              </div>
          )}

          {!loading &&
              filteredRooms.map((room) => {
                const { name: displayName, avatar: displayAvatar } =
                    getRoomDisplay(room);

                const lastMessage = room.messages[room.messages.length - 1];
                const lastMsgText = lastMessage 
                    ? renderMessageContent(lastMessage)
                    : "No messages yet";
                const lastMsgTime = lastMessage
                    ? new Date(lastMessage.createdAt).toLocaleString()
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
                      <div className="flex items-start space-x-3">
                        <Avatar className="border border-blue-300 shadow-sm">
                          <AvatarImage src={displayAvatar || ""} alt={displayName} />
                          <AvatarFallback className="bg-blue-200 text-blue-700 font-bold">
                            {displayName
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-sm text-blue-900 truncate">
                              {displayName}
                            </h3>
                            <span className="text-xs text-blue-500">
                              {lastMsgTime}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 truncate">
                            {lastMsgText}
                          </p>

                          {hasBooking && (
                              <span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded-full mt-1 inline-block">
                                Booked
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
