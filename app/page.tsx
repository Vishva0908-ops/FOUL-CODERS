"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/Button";
import type { User } from "@supabase/supabase-js";

export default function HomePage() {
  const [roomCode, setRoomCode] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, []);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      router.push(`/ask/${roomCode.trim().toUpperCase()}`);
    }
  };

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        queryParams: {
          prompt: "select_account",
        },
      },
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-dark-border border-t-accent-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
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

          {user ? (
            <Button variant="secondary" size="sm" onClick={() => router.push("/dashboard")}>
              Dashboard
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleSignIn}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with GitHub
            </Button>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Anonymous Q&A for <span className="text-accent-blue">Classrooms</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-dark-muted">
            Students ask questions anonymously. Teachers answer publicly or start private DM threads.
            Perfect for office hours, lectures, and classrooms.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {/* Join Room Form */}
            <form onSubmit={handleJoinRoom} className="flex w-full max-w-md gap-2">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter room code (e.g. X7K2PM)"
                maxLength={6}
                className="flex-1 rounded-lg border border-dark-border bg-dark-surface px-4 py-3 text-sm uppercase tracking-wider text-white placeholder-dark-muted focus:border-accent-blue focus:outline-none"
              />
              <Button type="submit" className="px-6">
                Join
              </Button>
            </form>
          </div>

          <p className="mt-4 text-sm text-dark-muted">
            Are you a teacher?{" "}
            <button onClick={handleSignIn} className="text-accent-blue hover:underline">
              Sign in with GitHub
            </button>{" "}
            to create rooms
          </p>
        </div>

        {/* Features */}
        <div className="mt-20 grid gap-8 md:grid-cols-3">
          <div className="rounded-xl border border-dark-border bg-dark-surface p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent-blue/10">
              <svg className="h-6 w-6 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-white">Anonymous Questions</h3>
            <p className="mt-2 text-sm text-dark-muted">
              Students feel comfortable asking anything. No judgment, just learning.
            </p>
          </div>

          <div className="rounded-xl border border-dark-border bg-dark-surface p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-green-900/20">
              <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-white">Private DM Threads</h3>
            <p className="mt-2 text-sm text-dark-muted">
              Once answered, unlock private threads between student and teacher.
            </p>
          </div>

          <div className="rounded-xl border border-dark-border bg-dark-surface p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-purple-900/20">
              <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-white">Real-time Updates</h3>
            <p className="mt-2 text-sm text-dark-muted">
              See new questions instantly. No refresh needed.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-border bg-dark-surface">
        <div className="mx-auto max-w-5xl px-4 py-6 text-center text-sm text-dark-muted">
          AskBox — Made for better classroom conversations
        </div>
      </footer>
    </div>
  );
}
