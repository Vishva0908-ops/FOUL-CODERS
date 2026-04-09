"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { generateAnonId, type Question, type Reply } from "@/lib/types";
import { generateStudentToken } from "@/lib/utils";
import { useTheme } from "@/app/providers";

const STUDENT_TOKEN_KEY = "askbox_student_token";

export default function StudentRoomPage() {
  const params = useParams();
  const roomCode = params.room_code as string;
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [studentToken, setStudentToken] = useState<string | null>(null);
  const [room, setRoom] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomNotFound, setRoomNotFound] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const [threadMessages, setThreadMessages] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const toast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2400);
  };

  // Initialize student token
  useEffect(() => {
    let token = localStorage.getItem(STUDENT_TOKEN_KEY);
    if (!token) {
      token = generateStudentToken();
      localStorage.setItem(STUDENT_TOKEN_KEY, token);
    }
    setStudentToken(token);
  }, []);

  // Fetch room and questions
  useEffect(() => {
    if (!studentToken) return;

    const fetchData = async () => {
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("room_code", roomCode)
        .single();

      if (roomError || !roomData) {
        setRoomNotFound(true);
        setLoading(false);
        return;
      }

      setRoom(roomData);

      const { data: questionsData } = await supabase
        .from("questions")
        .select("*")
        .eq("room_id", roomData.id)
        .eq("is_answered", true)
        .order("created_at", { ascending: false });

      setQuestions(questionsData || []);
      setLoading(false);
    };

    fetchData();
  }, [roomCode, studentToken]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!room || !studentToken) return;

    const channel = supabase
      .channel(`student-room-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "questions",
          filter: `room_id=eq.${room.id}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newQuestion = payload.new as Question;
            if (newQuestion.student_token === studentToken && newQuestion.is_answered) {
              setQuestions((prev) => [newQuestion, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedQuestion = payload.new as Question;
            if (
              updatedQuestion.student_token === studentToken &&
              updatedQuestion.is_answered &&
              !questions.find((q) => q.id === updatedQuestion.id)
            ) {
              setQuestions((prev) => [updatedQuestion, ...prev]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room, studentToken]);

  const handleSubmitQuestion = async () => {
    if (!questionText.trim() || !room || !studentToken) return;

    setSubmitting(true);

    await supabase.from("questions").insert({
      room_id: room.id,
      student_token: studentToken,
      question_text: questionText.trim(),
      is_answered: false,
    });

    setQuestionText("");
    setSubmitted(true);
    setSubmitting(false);
    toast("Submitted anonymously ✓");

    setTimeout(() => setSubmitted(false), 5000);
  };

  const openThread = async (question: Question) => {
    setSelectedQuestion(question);

    const { data: repliesData } = await supabase
      .from("replies")
      .select("*")
      .eq("question_id", question.id)
      .eq("student_token", studentToken!)
      .order("created_at", { ascending: true });

    setThreadMessages(repliesData || []);
    setIsThreadOpen(true);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedQuestion || !studentToken) return;

    setSendingReply(true);

    const { data } = await supabase
      .from("replies")
      .insert({
        question_id: selectedQuestion.id,
        student_token: studentToken,
        sender: "student",
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
    if (!isThreadOpen || !selectedQuestion || !studentToken) return;

    const channel = supabase
      .channel(`student-thread-${selectedQuestion.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "replies",
          filter: `question_id=eq.${selectedQuestion.id}`,
        },
        (payload) => {
          const newReply = payload.new as Reply;
          if (newReply.student_token === studentToken) {
            setThreadMessages((prev) => [...prev, newReply]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isThreadOpen, selectedQuestion, studentToken]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        <header className="sticky top-0 z-10" style={{ background: "var(--navy)", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-8 w-8 animate-pulse rounded-lg" style={{ background: "rgba(255,255,255,0.2)" }}></div>
            <div className="h-4 w-24 animate-pulse rounded" style={{ background: "rgba(255,255,255,0.2)" }}></div>
          </div>
        </header>
        <main className="flex flex-col gap-4 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="h-4 w-3/4 rounded" style={{ background: "var(--border)" }}></div>
              <div className="mt-3 h-3 w-1/2 rounded" style={{ background: "var(--border)" }}></div>
            </div>
          ))}
        </main>
      </div>
    );
  }

  if (roomNotFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "var(--bg)" }}>
        <div className="rounded-2xl p-8 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "#fef2f2" }}>
            <svg className="h-8 w-8" style={{ color: "#dc2626" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text)" }}>Room not found</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            The room code &quot;{roomCode}&quot; doesn&apos;t exist.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header className="sticky top-0 z-10" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--accent)" }}>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "12px", color: "#fff" }}>sQ</span>
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>SafeQ</div>
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
            <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: "var(--surface2)", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              {studentToken ? generateAnonId(studentToken) : "Loading..."}
            </span>
          </div>
        </div>
      </header>

      {/* Room Info */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div className="px-4 py-3">
          <h1 className="font-semibold" style={{ color: "var(--text)" }}>{room?.name}</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Room: {roomCode}</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4">
        {/* Submit Question */}
        <div className="mb-6 rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <div className="mb-1 text-sm font-semibold" style={{ color: "var(--text)" }}>Ask a question</div>
          <div className="mb-3 flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Your identity is fully anonymous. The teacher will never know who asked.
          </div>

          {submitted ? (
            <div className="mt-4 rounded-lg p-4 text-center" style={{ background: "var(--green-soft)" }}>
              <div className="text-4xl mb-3">🚀</div>
              <p className="font-semibold" style={{ color: "var(--green)" }}>Your question flew away!</p>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>The teacher will answer it soon.</p>
              <button
                onClick={() => { setSubmitted(false); }}
                className="mt-4 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--accent)" }}
              >
                Ask Another
              </button>
            </div>
          ) : (
            <div>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="What's on your mind? Ask anything..."
                maxLength={500}
                rows={3}
                className="w-full resize-none rounded-lg border p-3 text-sm outline-none transition-all"
                style={{
                  background: "var(--surface2)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                  fontFamily: "var(--font-sans)",
                  lineHeight: 1.6
                }}
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
                  {questionText.length}/500
                </span>
                <button
                  onClick={handleSubmitQuestion}
                  disabled={!questionText.trim() || submitting}
                  className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50"
                  style={{ background: "var(--accent)", boxShadow: "0 4px 12px rgba(67,97,238,0.35)" }}
                >
                  {submitting ? "Submitting..." : "Submit Anonymously"}
                  {!submitting && (
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Questions Feed */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Public feed — answered</span>
            <span className="badge-pill badge-teal" style={{ fontSize: "10px" }}>{questions.length} answers</span>
          </div>

          {questions.length === 0 ? (
            <div className="rounded-xl p-8 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No answered questions yet</p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>
                Questions will appear here once your teacher marks them as answered.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="cursor-pointer rounded-xl p-4 transition-all hover:-translate-y-0.5"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
                  onClick={() => openThread(question)}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                        {generateAnonId(question.student_token)}
                      </span>
                    </div>
                    <span className="badge-pill badge-teal" style={{ fontSize: "10px" }}>✓ Answered</span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--text)", lineHeight: 1.55 }}>{question.question_text}</p>
                </div>
              ))}
            </div>
          )}
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
                  <div key={msg.id} className={`flex ${msg.sender === "student" ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[80%] rounded-xl px-4 py-3 text-sm"
                      style={
                        msg.sender === "student"
                          ? { background: "var(--accent)", color: "#fff" }
                          : { background: "var(--surface2)", color: "var(--text)" }
                      }
                    >
                      <p>{msg.message}</p>
                      <p className="mt-1 text-xs" style={{ color: msg.sender === "student" ? "rgba(255,255,255,0.6)" : "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
                        {msg.sender === "student" ? "You" : "Teacher"}
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
                {sendingReply ? "..." : (
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                )}
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
