"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/Button";
import { LoadingSpinner, QuestionSkeleton } from "@/components/Loading";
import { Drawer } from "@/components/Drawer";
import { Textarea } from "@/components/Input";
import { generateAnonId, type Question, type Reply } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

export default function RoomDashboardPage() {
  const params = useParams();
  const roomId = params.room as string;
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [room, setRoom] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"queue" | "answered">("queue");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const [threadMessages, setThreadMessages] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      setUser(user);

      // Fetch room details
      const { data: roomData } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (!roomData) {
        router.push("/dashboard");
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
  }, [roomId, router]);

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
  };

  const openThread = async (question: Question) => {
    setSelectedQuestion(question);

    // Load replies for this question
    const { data: repliesData } = await supabase
      .from("replies")
      .select("*")
      .eq("question_id", question.id)
      .order("created_at", { ascending: true });

    setThreadMessages(repliesData || []);
    setIsThreadOpen(true);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedQuestion || !user) return;

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
      <div className="min-h-screen bg-dark-bg">
        <header className="border-b border-dark-border bg-dark-surface">
          <div className="mx-auto max-w-5xl px-4 py-4">
            <div className="h-8 w-32 animate-pulse rounded bg-dark-border"></div>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="space-y-4">
            <QuestionSkeleton />
            <QuestionSkeleton />
            <QuestionSkeleton />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="border-b border-dark-border bg-dark-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 text-sm text-dark-muted hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </button>
            <span className="text-dark-border">|</span>
            <span className="font-semibold text-white">{room?.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent-blue/20 px-3 py-1 text-xs font-medium text-accent-blue">
              {room?.room_code}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl bg-dark-surface p-1">
          <button
            onClick={() => setActiveTab("queue")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "queue"
                ? "bg-dark-border text-white shadow-sm"
                : "text-dark-muted hover:text-white"
            }`}
          >
            Queue ({unansweredQuestions.length})
          </button>
          <button
            onClick={() => setActiveTab("answered")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "answered"
                ? "bg-dark-border text-white shadow-sm"
                : "text-dark-muted hover:text-white"
            }`}
          >
            Answered ({answeredQuestions.length})
          </button>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {activeTab === "queue" &&
            (unansweredQuestions.length === 0 ? (
              <div className="rounded-xl border border-dark-border bg-dark-surface p-8 text-center">
                <p className="text-sm text-dark-muted">No questions in queue</p>
              </div>
            ) : (
              unansweredQuestions.map((question) => (
                <div
                  key={question.id}
                  className="rounded-xl border border-dark-border bg-dark-surface p-4"
                >
                  <p className="text-white">{question.question_text}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-dark-muted">
                      {generateAnonId(question.student_token)}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openThread(question)}
                      >
                        View Thread
                      </Button>
                      <Button size="sm" onClick={() => handleMarkAnswered(question.id)}>
                        Mark Answered
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ))}

          {activeTab === "answered" &&
            (answeredQuestions.length === 0 ? (
              <div className="rounded-xl border border-dark-border bg-dark-surface p-8 text-center">
                <p className="text-sm text-dark-muted">No answered questions yet</p>
              </div>
            ) : (
              answeredQuestions.map((question) => (
                <div
                  key={question.id}
                  className="rounded-xl border border-dark-border bg-dark-surface p-4"
                >
                  <p className="text-white">{question.question_text}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-dark-muted">
                      {generateAnonId(question.student_token)}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-400">
                        Answered
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openThread(question)}
                      >
                        View Thread
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ))}
        </div>
      </main>

      {/* Thread Drawer */}
      <Drawer
        isOpen={isThreadOpen}
        onClose={() => {
          setIsThreadOpen(false);
          setSelectedQuestion(null);
          setThreadMessages([]);
        }}
        title={`Thread with ${selectedQuestion ? generateAnonId(selectedQuestion.student_token) : ""}`}
      >
        <div className="flex flex-col" style={{ height: "calc(70vh - 120px)" }}>
          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto">
            {threadMessages.length === 0 ? (
              <p className="text-center text-sm text-dark-muted">No messages yet</p>
            ) : (
              threadMessages.map((msg) => (
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
                      {msg.sender === "teacher" ? "Teacher" : "Student"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="border-t border-dark-border pt-4">
            <Textarea
              value={replyText}
              onChange={setReplyText}
              placeholder="Type a message..."
              rows={2}
              className="flex-1"
            />
            <Button
              onClick={handleSendReply}
              disabled={!replyText.trim() || sendingReply}
              className="mt-2 w-full"
            >
              {sendingReply ? "Sending..." : "Send Reply"}
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
