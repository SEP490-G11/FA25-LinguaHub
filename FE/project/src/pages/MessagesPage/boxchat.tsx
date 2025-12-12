import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ConversationsList from "./components/sections/conversations-list";
import ChatWindow from "./components/sections/chat-window";

interface MessagesProps {
  basePath?: string;
  isFullScreen?: boolean;
}

const Messages = ({ basePath = '/messages', isFullScreen = false }: MessagesProps) => {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const initialRoomId = conversationId ? Number(conversationId) : null;

  const [selectedConversation, setSelectedConversation] = useState<number | null>(
    initialRoomId
  );

  // Ref to trigger conversations list refresh
  const refreshConversationsRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (conversationId) {
      setSelectedConversation(Number(conversationId));
    }
  }, [conversationId]);

  const handleSelectConversation = (roomId: number) => {
    setSelectedConversation(roomId);
    navigate(`${basePath}/${roomId}`);
  };

  // Callback when new message is received/sent in ChatWindow
  const handleNewMessage = useCallback(() => {
    // Trigger refresh of conversations list
    refreshConversationsRef.current?.();
  }, []);

  if (isFullScreen) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-gray-50 -m-6">
        <div className="h-full">
          <div className="bg-white shadow-lg overflow-hidden h-full">
            <div className="grid grid-cols-1 md:grid-cols-3 h-full">
              {/* LEFT LIST */}
              <ConversationsList
                selectedConversation={selectedConversation}
                onSelectConversation={handleSelectConversation}
                onRefreshRef={refreshConversationsRef}
              />

              {/* RIGHT CHAT WINDOW FIX TRÀN */}
              <div className="md:col-span-2 min-h-0 flex flex-col">
                {selectedConversation ? (
                  <ChatWindow
                    conversationId={selectedConversation}
                    onNewMessage={handleNewMessage}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="text-6xl mb-4">💬</div>
                      <p className="text-xl">
                        Chọn một cuộc trò chuyện để bắt đầu nhắn tin
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div
          className="bg-white rounded-lg shadow-lg overflow-hidden"
          style={{ height: "calc(100vh - 8rem)" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 h-full">
            {/* LEFT LIST */}
            <ConversationsList
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              onRefreshRef={refreshConversationsRef}
            />

            {/* RIGHT CHAT WINDOW FIX TRÀN */}
            <div className="md:col-span-2 min-h-0 flex flex-col">
              {selectedConversation ? (
                <ChatWindow
                  conversationId={selectedConversation}
                  onNewMessage={handleNewMessage}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <p className="text-xl">
                      Chọn một cuộc trò chuyện để bắt đầu nhắn tin
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
