"use client";

import { type ReactNode, useState, useEffect } from "react";
import { Drawer } from "./Drawer";
import { Button } from "./Button";
import { Textarea } from "./Input";

interface ThreadMessage {
  id: string;
  sender: "student" | "teacher";
  message: string;
  created_at: string;
}

interface ThreadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: string;
  studentToken: string;
  isTeacher: boolean;
  messages: ThreadMessage[];
  onSendMessage: (message: string) => void;
  onLoadMessages: () => void;
}

export function ThreadDrawer({
  isOpen,
  onClose,
  questionId,
  studentToken,
  isTeacher,
  messages,
  onSendMessage,
  onLoadMessages,
}: ThreadDrawerProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      onLoadMessages();
    }
  }, [isOpen, questionId, onLoadMessages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    await onSendMessage(message.trim());
    setMessage("");
    setSending(false);
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="DM Thread">
      <div className="flex flex-col" style={{ height: "calc(85vh - 120px)" }}>
        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-dark-muted">No messages yet</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "teacher" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                    msg.sender === "teacher"
                      ? "bg-accent-blue text-white"
                      : "bg-dark-border text-white"
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p
                    className={`mt-1 text-xs ${
                      msg.sender === "teacher" ? "text-blue-200" : "text-dark-muted"
                    }`}
                  >
                    {msg.sender === "teacher" ? "Teacher" : "You"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="border-t border-dark-border pt-4">
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={setMessage}
              placeholder="Type a message..."
              rows={2}
              className="flex-1"
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="mt-2 w-full"
          >
            {sending ? "Sending..." : "Send"}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
