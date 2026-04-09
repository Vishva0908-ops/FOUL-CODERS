"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/Button";
import { Textarea } from "@/components/Input";
import { Drawer } from "@/components/Drawer";
import { LoadingSpinner, QuestionSkeleton } from "@/components/Loading";
import { generateAnonId, type Question, type Reply } from "@/lib/types";
import { generateStudentToken } from "@/lib/utils";

const STUDENT_TOKEN_KEY = "askbox_student_token";

export default function StudentRoomPage() {
  const params = useParams();
  const roomCode = params.room_code as string;
  const router = useRouter();

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
      // Fetch room
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

      // Fetch answered questions (public feed)
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
            // Only show if it's this student's question and it's been answered
            if (newQuestion.student_token === studentToken && newQuestion.is_answered) {
              setQuestions((prev) => [newQuestion, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedQuestion = payload.new as Question;
            // If this student's question was just answered, add to feed
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

    // Reset submitted message after 5 seconds
    setTimeout(() => setSubmitted(false), 5000);
  };

  const openThread = async (question: Question) => {
    setSelectedQuestion(question);

    // Load replies for this question where student_token matches
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

  if (roomNotFound) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <header className="border-b border-dark-border bg-dark-surface">
          <div className="mx-auto max-w-5xl px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-blue">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">AskBox</span>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-900/20">
            <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="mt-6 text-xl font-semibold text-white">Room not found</h1>
          <p className="mt-2 text-sm text-dark-muted">
            The room code &quot;{roomCode}&quot; doesn&apos;t exist. Check the code and try again.
          </p>
          <Button onClick={() => router.push("/")} className="mt-6">
            Go Back Home
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="border-b border-dark-border bg-dark-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-blue">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">AskBox</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-dark-border px-3 py-1 text-xs font-medium text-dark-muted">
              {studentToken ? generateAnonId(studentToken) : "Loading..."}
            </span>
          </div>
        </div>
      </header>

      {/* Room Info */}
      <div className="border-b border-dark-border bg-dark-surface">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <h1 className="font-semibold text-white">{room?.name}</h1>
          <p className="text-sm text-dark-muted">Room code: {roomCode}</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Submit Question */}
        <div className="mb-8 rounded-xl border border-dark-border bg-dark-surface p-4">
          <h2 className="font-semibold text-white">Ask a Question</h2>
          <p className="mt-1 text-sm text-dark-muted">
            Your question will be anonymous. It&apos;ll appear here once your teacher answers it.
          </p>

          {submitted ? (
            <div className="mt-4 rounded-lg bg-green-900/20 p-4 text-center">
              <svg className="mx-auto h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="mt-2 font-medium text-green-400">
                Your question was submitted!
              </p>
              <p className="text-sm text-green-400/80">
                It&apos;ll appear here once your teacher answers it.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitQuestion();
              }}
              className="mt-4"
            >
              <Textarea
                value={questionText}
                onChange={setQuestionText}
                placeholder="Type your question here..."
                rows={3}
                maxLength={500}
                className="w-full"
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-dark-muted">
                  {questionText.length}/500
                </span>
                <Button type="submit" disabled={!questionText.trim() || submitting}>
                  {submitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Submitting...
                    </>
                  ) : (
                    "Submit Question"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Questions Feed */}
        <div>
          <h2 className="mb-4 font-semibold text-white">Answered Questions</h2>

          {questions.length === 0 ? (
            <div className="rounded-xl border border-dark-border bg-dark-surface p-8 text-center">
              <p className="text-sm text-dark-muted">No answered questions yet</p>
              <p className="mt-1 text-xs text-dark-muted/70">
                Questions will appear here once your teacher marks them as answered.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="cursor-pointer rounded-xl border border-dark-border bg-dark-surface p-4 transition-shadow hover:shadow-md"
                  onClick={() => openThread(question)}
                >
                  <p className="text-white">{question.question_text}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-dark-muted">
                      {generateAnonId(question.student_token)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-400">
                        Answered
                      </span>
                      <svg className="h-4 w-4 text-dark-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
        title={`DM with ${selectedQuestion ? generateAnonId(selectedQuestion.student_token) : ""}`}
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
                  className={`flex ${msg.sender === "student" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                      msg.sender === "student"
                        ? "bg-accent-blue text-white"
                        : "bg-dark-border text-white"
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p
                      className={`mt-1 text-xs ${
                        msg.sender === "student" ? "text-blue-200" : "text-dark-muted"
                      }`}
                    >
                      {msg.sender === "student" ? "You" : "Teacher"}
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
              {sendingReply ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
