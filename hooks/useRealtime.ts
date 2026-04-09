"use client";

import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Question } from "@/lib/types";

export function useRealtime(roomId: string, onQuestionChange?: (payload: any) => void) {
  const subscribeToQuestions = useCallback(() => {
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
        (payload) => {
          onQuestionChange?.(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, onQuestionChange]);

  return { subscribeToQuestions };
}

export function useRealtimeReplies(
  questionId: string,
  onReplyChange?: (payload: any) => void
) {
  const subscribeToReplies = useCallback(() => {
    const channel = supabase
      .channel(`question-${questionId}-replies`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "replies",
          filter: `question_id=eq.${questionId}`,
        },
        (payload) => {
          onReplyChange?.(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [questionId, onReplyChange]);

  return { subscribeToReplies };
}
