"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { generateAnonId, type Question, type Reply } from "@/lib/types";
import { useTheme } from "@/app/providers";

export default function RoomDashboardPage() {
  const params = useParams();
  const roomId = params.room as string;
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [room, setRoom] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"queue" | "answered">("queue");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const [threadMessages, setThreadMessages] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const toast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2400);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Fetch room details
      const { data: roomData } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (!roomData) {
        setLoading(false);
        return;
      }

      setRoom(roomData);

      // Fetch questions
      const { data: questionsData } = await supabase
        .from("questions")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false });

      setQuestions(questionsData || []);
      setLoading(false);
    };

    checkAuth();
  }, [roomId]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-${roomId}-questions`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "questions",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newQuestion = payload.new as Question;
            setQuestions((prev) => [newQuestion, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updatedQuestion = payload.new as Question;
            setQuestions((prev) =>
              prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const handleMarkAnswered = async (questionId: string) => {
    await supabase
      .from("questions")
      .update({ is_answered: true })
      .eq("id", questionId);

    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, is_answered: true } : q))
    );
    toast("Question published ✓");
  };

  const openThread = async (question: Question) => {
    setSelectedQuestion(question);

    const { data: repliesData } = await supabase
      .from("replies")
      .select("*")
      .eq("question_id", question.id)
      .order("created_at", { ascending: true });

    setThreadMessages(repliesData || []);
    setIsThreadOpen(true);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedQuestion) return;

    setSendingReply(true);

    const { data } = await supabase
      .from("replies")
      .insert({
        question_id: selectedQuestion.id,
        student_token: selectedQuestion.student_token,
        sender: "teacher",
        message: replyText.trim(),
      })
      .select()
      .single();

    if (data) {
      setThreadMessages([...threadMessages, data]);
    }

    setReplyText("");
    setSendingReply(false);
  };

  // Subscribe to realtime replies when thread is open
  useEffect(() => {
    if (!isThreadOpen || !selectedQuestion) return;

    const channel = supabase
      .channel(`question-${selectedQuestion.id}-replies`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "replies",
          filter: `question_id=eq.${selectedQuestion.id}`,
        },
        (payload) => {
          setThreadMessages((prev) => [...prev, payload.new as Reply]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isThreadOpen, selectedQuestion]);

  const unansweredQuestions = questions.filter((q) => !q.is_answered);
  const answeredQuestions = questions.filter((q) => q.is_answered);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header className="sticky top-0 z-10" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back
            </button>
            <div className="h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--accent)", display: "flex" }}>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "12px", color: "#fff" }}>sQ</span>
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{room?.name}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Room: {room?.room_code}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all hover:scale-110"
              style={{ background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)" }}
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === "light" ? (
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              ) : (
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              )}
            </button>
            <div className="live-indicator">
              <span className="live-dot"></span>
              Live
            </div>
            <span className="badge-pill badge-navy">{unansweredQuestions.length} pending</span>
            <button
              onClick={handleSignOut}
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
              style={{ background: "var(--navy-light)", color: "#fff", border: "2px solid var(--border)" }}
            >
              T
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl p-1" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <button
            onClick={() => setActiveTab("queue")}
            className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            style={activeTab === "queue" ? { background: "var(--navy)", color: "#fff" } : { color: "var(--text-muted)" }}
          >
            Queue ({unansweredQuestions.length})
          </button>
          <button
            onClick={() => setActiveTab("answered")}
            className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            style={activeTab === "answered" ? { background: "var(--navy)", color: "#fff" } : { color: "var(--text-muted)" }}
          >
            Answered ({answeredQuestions.length})
          </button>
        </div>

        {/* Questions List */}
        <div className="flex flex-col gap-3">
          {activeTab === "queue" &&
            (unansweredQuestions.length === 0 ? (
              <div className="rounded-xl border p-8 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No questions in queue</p>
              </div>
            ) : (
              unansweredQuestions.map((question, i) => (
                <div
                  key={question.id}
                  className="rounded-xl p-4 transition-all"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                    animationDelay: `${i * 0.05}s`,
                    animation: "cardIn 0.3s ease both"
                  }}
                >
                  <p className="text-sm" style={{ color: "var(--text)", lineHeight: 1.6 }}>{question.question_text}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      {generateAnonId(question.student_token)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openThread(question)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{ border: "1px solid var(--border)", color: "var(--text-muted)", background: "var(--surface)" }}
                      >
                        💬 Thread
                      </button>
                      <button
                        onClick={() => handleMarkAnswered(question.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ background: "var(--accent)" }}
                      >
                        Mark Answered
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ))}

          {activeTab === "answered" &&
            (answeredQuestions.length === 0 ? (
              <div className="rounded-xl border p-8 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No answered questions yet</p>
              </div>
            ) : (
              answeredQuestions.map((question, i) => (
                <div
                  key={question.id}
                  className="rounded-xl p-4 transition-all"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                    animationDelay: `${i * 0.05}s`,
                    animation: "cardIn 0.3s ease both"
                  }}
                >
                  <p className="text-sm" style={{ color: "var(--text)", lineHeight: 1.6 }}>{question.question_text}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      {generateAnonId(question.student_token)}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="badge-pill badge-teal" style={{ fontSize: "10px" }}>✓ Answered</span>
                      <button
                        onClick={() => openThread(question)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{ border: "1px solid var(--border)", color: "var(--text-muted)", background: "var(--surface)" }}
                      >
                        💬 Thread
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ))}
        </div>
      </main>

      {/* Thread Drawer */}
      {isThreadOpen && selectedQuestion && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: "var(--bg)" }}
        >
          {/* Drawer Header */}
          <div className="flex items-center gap-3 px-4 py-3" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <button
              onClick={() => { setIsThreadOpen(false); setSelectedQuestion(null); setThreadMessages([]); }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back
            </button>
            <div>
              <div className="font-semibold" style={{ color: "var(--text)" }}>Thread</div>
              <div className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {generateAnonId(selectedQuestion.student_token)}
              </div>
            </div>
          </div>

          {/* Question context */}
          <div className="px-4 py-3" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text)", lineHeight: 1.5 }}>{selectedQuestion.question_text}</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {threadMessages.length === 0 ? (
              <div className="text-center text-sm" style={{ color: "var(--text-muted)", marginTop: "40%" }}>
                No messages yet
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {threadMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "teacher" ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[80%] rounded-xl px-4 py-3 text-sm"
                      style={
                        msg.sender === "teacher"
                          ? { background: "var(--accent)", color: "#fff" }
                          : { background: "var(--surface2)", color: "var(--text)" }
                      }
                    >
                      <p>{msg.message}</p>
                      <p className="mt-1 text-xs" style={{ color: msg.sender === "teacher" ? "rgba(255,255,255,0.6)" : "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
                        {msg.sender === "teacher" ? "Teacher" : "Student"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                placeholder="Type a message..."
                className="flex-1 rounded-lg border-2 px-4 py-2.5 text-sm outline-none transition-all"
                style={{ borderColor: "var(--border)", background: "var(--surface2)", color: "var(--text)" }}
              />
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim() || sendingReply}
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "var(--accent)" }}
              >
                {sendingReply ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full px-6 py-3 text-sm font-medium text-white transition-all ${showToast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
        style={{ background: "var(--navy)", boxShadow: "var(--shadow-lg)", zIndex: 999 }}>
        {toastMsg}
      </div>
    </div>
  );
}
