"use client";

import { generateAnonId } from "@/lib/utils";
import type { QuestionWithToken } from "@/lib/types";
import { useState } from "react";
import { Drawer } from "./Drawer";

interface QuestionCardProps {
  question: QuestionWithToken;
  showActions?: boolean;
  onMarkAnswered?: (id: string) => void;
  onOpenThread?: (question: QuestionWithToken) => void;
  isTeacher?: boolean;
  currentStudentToken?: string;
}

export function QuestionCard({
  question,
  showActions = false,
  onMarkAnswered,
  onOpenThread,
  isTeacher = false,
  currentStudentToken,
}: QuestionCardProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const anonId = generateAnonId(question.student_token);

  const handleCardClick = () => {
    if (onOpenThread) {
      onOpenThread(question);
    } else if (question.is_answered && currentStudentToken === question.student_token) {
      setIsDrawerOpen(true);
    }
  };

  return (
    <>
      <div
        className={`rounded-xl border border-dark-border bg-dark-surface p-4 transition-shadow hover:shadow-md cursor-pointer`}
        onClick={handleCardClick}
      >
        <p className="text-dark-text">{question.question_text}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-medium text-dark-muted">{anonId}</span>
          {question.is_answered && (
            <span className="rounded-full bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-400">
              Answered
            </span>
          )}
        </div>

        {showActions && !question.is_answered && onMarkAnswered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAnswered(question.id);
            }}
            className="mt-3 w-full rounded-lg bg-accent-blue py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 active:bg-blue-700"
          >
            Mark Answered
          </button>
        )}
      </div>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={`DM with ${anonId}`}
      >
        <div className="text-center text-dark-muted">
          <p className="text-sm">Thread for {question.id}</p>
        </div>
      </Drawer>
    </>
  );
}
