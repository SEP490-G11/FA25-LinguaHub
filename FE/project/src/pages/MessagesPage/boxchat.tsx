import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ConversationsList from "./components/sections/conversations-list";
import ChatWindow from "./components/sections/chat-window";

const Messages = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const initialRoomId = conversationId ? Number(conversationId) : null;

  const [selectedConversation, setSelectedConversation] = useState<number | null>(
      initialRoomId
  );
  useEffect(() => {
    if (conversationId) {
      setSelectedConversation(Number(conversationId));
    }
  }, [conversationId]);

  const handleSelectConversation = (roomId: number) => {
    setSelectedConversation(roomId);
    navigate(`/messages/${roomId}`);
  };

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div
              className="bg-white rounded-lg shadow-lg"
              style={{ height: "calc(100vh - 8rem)" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 h-full min-h-0">

              {/* LEFT LIST */}
              <ConversationsList
                  selectedConversation={selectedConversation}
                  onSelectConversation={handleSelectConversation}
              />

              {/* RIGHT CHAT WINDOW FIX TRÀN */}
              <div className="md:col-span-2 min-h-0 flex flex-col">
                {selectedConversation ? (
                    <ChatWindow conversationId={selectedConversation} />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <div className="text-6xl mb-4">💬</div>
                        <p className="text-xl">Select a conversation to start messaging</p>
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
