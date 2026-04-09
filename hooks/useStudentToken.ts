"use client";

import { useState, useEffect, useCallback } from "react";
import { generateStudentToken } from "@/lib/utils";

const STUDENT_TOKEN_KEY = "askbox_student_token";

export function useStudentToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let storedToken = localStorage.getItem(STUDENT_TOKEN_KEY);

    if (!storedToken) {
      storedToken = generateStudentToken();
      localStorage.setItem(STUDENT_TOKEN_KEY, storedToken);
    }

    setToken(storedToken);
    setLoading(false);
  }, []);

  const regenerateToken = useCallback(() => {
    const newToken = generateStudentToken();
    localStorage.setItem(STUDENT_TOKEN_KEY, newToken);
    setToken(newToken);
    return newToken;
  }, []);

  return { token, loading, regenerateToken };
}
