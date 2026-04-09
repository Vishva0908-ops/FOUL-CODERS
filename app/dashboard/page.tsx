"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { generateRoomCode } from "@/lib/utils";
import type { Room } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { useTheme } from "@/app/providers";

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      // Fetch rooms for this teacher
      const { data: roomsData } = await supabase
        .from("rooms")
        .select("*")
        .eq("teacher_id", user?.id || '');

      setRooms(roomsData || []);
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleCreateRoom = async () => {
    if (!user) {
      router.push("/");
      return;
    }

    setCreating(true);
    const roomCode = generateRoomCode();
    const roomName = `Room ${rooms.length + 1}`;

    const { data, error } = await supabase
      .from("rooms")
      .insert({
        teacher_id: user.id,
        name: roomName,
        room_code: roomCode,
      })
      .select()
      .single();

    if (data) {
      setRooms([...rooms, data]);
    } else if (error) {
      console.error("Error creating room:", error);
    }

    setCreating(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const getShareableLink = (roomCode: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/ask/${roomCode}`;
    }
    return `/ask/${roomCode}`;
  };

  const handleCopyLink = (roomCode: string) => {
    const link = getShareableLink(roomCode);
    navigator.clipboard.writeText(link);
  };

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
      <header className="sticky top-0 z-10" style={{ background: "var(--navy)", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)" }}
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
              <div className="text-sm font-semibold text-white">My Classrooms</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-mono)" }}>4 active rooms</div>
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
            <span className="badge-pill badge-navy">{rooms.length} rooms</span>
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
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Active Rooms</span>
          <button
            onClick={handleCreateRoom}
            disabled={creating}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50"
            style={{ background: "var(--accent)", boxShadow: "0 4px 14px rgba(67,97,238,0.4)" }}
          >
            {creating ? "Creating..." : "+ New Room"}
          </button>
        </div>

        {rooms.length === 0 ? (
          <div className="rounded-xl border p-12 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "var(--surface2)" }}>
              <svg className="h-8 w-8" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h10" />
              </svg>
            </div>
            <h3 className="font-semibold" style={{ color: "var(--text)" }}>No rooms yet</h3>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Create your first room to start accepting questions
            </p>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            {rooms.map((room, i) => (
              <div
                key={room.id}
                className="rounded-xl p-4 transition-all hover:-translate-y-0.5 cursor-pointer"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)",
                  animationDelay: `${i * 0.05}s`,
                  animation: "cardIn 0.3s ease both"
                }}
                onClick={() => router.push(`/dashboard/${room.id}`)}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="font-semibold" style={{ color: "var(--text)" }}>{room.name}</div>
                    <div className="mt-1 text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Room: {room.room_code}</div>
                  </div>
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: "var(--accent)" }}
                  >
                    {i + 1}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--amber)" }}></span>
                  0 unanswered
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Recent Activity</span>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3 p-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <span>🦊</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>anon · fox</span>
                <span className="badge-pill badge-accent" style={{ fontSize: "10px" }}>MATH101</span>
              </div>
              <span className="ml-auto text-xs" style={{ color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>2m ago</span>
            </div>
            <div className="flex items-center gap-3 p-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <span>🐺</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>anon · wolf</span>
                <span className="badge-pill badge-teal" style={{ fontSize: "10px" }}>MATH101</span>
              </div>
              <span className="ml-auto text-xs" style={{ color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>5m ago</span>
            </div>
            <div className="flex items-center gap-3 p-4">
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <span>🐻</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>anon · bear</span>
                <span className="badge-pill badge-green" style={{ fontSize: "10px" }}>✓ Answered</span>
              </div>
              <span className="ml-auto text-xs" style={{ color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>12m ago</span>
            </div>
          </div>
        </div>
      </main>

      {/* FAB */}
      <button
        onClick={handleCreateRoom}
        className="fixed bottom-7 right-5 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white transition-all hover:scale-110"
        style={{ background: "var(--accent)", boxShadow: "0 6px 20px rgba(67,97,238,0.4)", zIndex: 50 }}
      >
        +
      </button>
    </div>
  );
}
