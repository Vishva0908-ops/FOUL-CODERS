"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/Button";
import { RoomSkeleton } from "@/components/Loading";
import { generateRoomCode } from "@/lib/utils";
import type { Room } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

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

      // Upsert teacher record
      await supabase.from("teachers").upsert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Teacher",
      });

      // Fetch rooms
      const { data: roomsData } = await supabase
        .from("rooms")
        .select("*")
        .eq("teacher_id", user.id);

      setRooms(roomsData || []);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleCreateRoom = async () => {
    if (!user) return;

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
      <div className="min-h-screen bg-dark-bg">
        <header className="border-b border-dark-border bg-dark-surface">
          <div className="mx-auto max-w-5xl px-4 py-4">
            <div className="h-8 w-32 animate-pulse rounded bg-dark-border"></div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">
          <div className="space-y-4">
            <RoomSkeleton />
            <RoomSkeleton />
            <RoomSkeleton />
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
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-blue">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">AskBox</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-dark-muted sm:block">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Your Rooms</h1>
            <p className="mt-1 text-sm text-dark-muted">Create and manage your Q&A rooms</p>
          </div>

          <Button onClick={handleCreateRoom} disabled={creating}>
            {creating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Creating...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Room
              </>
            )}
          </Button>
        </div>

        {rooms.length === 0 ? (
          <div className="rounded-xl border border-dark-border bg-dark-surface p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-dark-border">
              <svg className="h-8 w-8 text-dark-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h10" />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-white">No rooms yet</h3>
            <p className="mt-2 text-sm text-dark-muted">
              Create your first room to start accepting questions
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="rounded-xl border border-dark-border bg-dark-surface p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{room.name}</h3>
                    <p className="mt-1 font-mono text-sm text-dark-muted">{room.room_code}</p>
                  </div>
                  <button
                    onClick={() => router.push(`/dashboard/${room.id}`)}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-accent-blue hover:bg-accent-blue/10 active:bg-accent-blue/20"
                  >
                    Manage
                  </button>
                </div>

                <div className="mt-4">
                  <label className="text-xs font-medium text-dark-muted">Shareable Link</label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/ask/${room.room_code}`}
                      className="flex-1 rounded-lg border border-dark-border bg-dark-bg px-3 py-2 font-mono text-xs text-dark-muted"
                    />
                    <button
                      onClick={() => handleCopyLink(room.room_code)}
                      className="rounded-lg border border-dark-border p-2 text-dark-muted hover:bg-dark-border active:bg-gray-600"
                      title="Copy link"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
