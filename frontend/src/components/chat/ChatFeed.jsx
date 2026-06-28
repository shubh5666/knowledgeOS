import React, { useRef, useEffect } from "react";
import { MessageSquare, Send } from "lucide-react";

export default function ChatFeed({
  chats = [],
  loadingHistory = false,
  sendingMsg = false,
  question,
  setQuestion,
  handleSendMessage,
}) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats, sendingMsg]);

  return (
    <div className="chat-feed">
      <div className="chat-history">
        {chats.length === 0 && !loadingHistory ? (
          <div
            className="empty-state"
            style={{ background: "none", border: "none", height: "100%" }}
          >
            <MessageSquare size={40} className="empty-state-icon" />
            <h4 className="empty-state-title">AI Assistant Ready</h4>
            <p className="empty-state-desc">
              Ask any question related to this document. The model will locate relevant chunks and answer based on the context.
            </p>
          </div>
        ) : (
          chats.map((chat, idx) => (
            <React.Fragment key={chat.id || idx}>
              {/* User Message */}
              <div className="chat-message-row user">
                <div className="chat-bubble">
                  <div className="chat-bubble-author">You</div>
                  <div>{chat.question}</div>
                </div>
              </div>

              {/* AI Response */}
              {chat.answer && (
                <div className="chat-message-row ai">
                  <div className="chat-bubble">
                    <div className="chat-bubble-author">AI Assistant</div>
                    <div style={{ whiteSpace: "pre-line" }}>{chat.answer}</div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))
        )}

        {sendingMsg && (
          <div className="chat-message-row ai animate-pulse">
            <div className="chat-bubble">
              <div className="chat-bubble-author">AI Assistant</div>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <span>Searching document and generating answer</span>
                <span className="spinner" style={{ width: "12px", height: "12px", borderWidth: "2px", margin: 0 }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-bar">
        <form onSubmit={handleSendMessage} className="chat-input-form">
          <input
            type="text"
            className="chat-textarea"
            placeholder="Ask a question about this document..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={sendingMsg}
            required
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={sendingMsg || !question.trim()}
            style={{ height: "48px", width: "48px", padding: 0 }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
