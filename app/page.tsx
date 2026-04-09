"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
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

      if (user) {
        router.replace("/dashboard");
        return;
      }

      setUser(user);
      setLoading(false);
    };
    getUser();
  }, [router]);

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
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(145deg, #1B2B5E 0%, #2D3F7A 50%, #3D52A0 100%)" }}>
      {/* Nav */}
      <nav className="flex items-stretch" style={{ background: "var(--navy)", minHeight: "48px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", position: "sticky", top: 0, zIndex: 100 }}>
        <div className="flex items-center gap-2 px-4" style={{ borderRight: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--accent)" }}>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "13px", fontWeight: 700, color: "#fff" }}>sQ</span>
          </div>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: "16px", color: "#fff" }}>SafeQ</span>
        </div>
        <div className="flex flex-1 items-center gap-1 px-4" style={{ overflowX: "auto" }}>
          <Link href="/" className="flex h-full items-center gap-2 px-3 py-0 text-xs font-medium uppercase tracking-wider no-underline" style={{ color: "#fff", borderBottom: "2px solid var(--accent)", fontFamily: "var(--font-mono)" }}>Landing</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-5 py-10">
        {/* Landing card */}
        <div className="relative z-10 w-full max-w-md animate-[fadeUp_0.5s_ease_both]" style={{ animation: "fadeUp 0.5s ease both" }}>
          <div className="rounded-2xl p-10 text-center" style={{
            background: "rgba(255,255,255,0.07)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)"
          }}>
            {/* Logo */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "var(--accent)", boxShadow: "0 8px 24px rgba(67,97,238,0.4)" }}>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "26px", color: "#fff" }}>sQ</span>
            </div>
            <p className="mb-6 text-center text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-mono)" }}>&nbsp;</p>

            <h1 className="mb-2 text-center" style={{ fontFamily: "var(--font-serif)", fontSize: "28px", color: "#fff", lineHeight: 1.25 }}>
              <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.7)" }}>Anonymity</em> fosters curiosity.
            </h1>
            <p className="mb-8 text-center" style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
              A safe space for students to ask any question — without fear of judgement.
            </p>

            {/* Teacher Login - GitHub */}
            <button
              onClick={handleSignIn}
              className="flex w-full items-center justify-center gap-3 rounded-lg px-5 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: "#fff", color: "#1F2937", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#24292f">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub as Teacher
            </button>

            <div className="my-6 h-px" style={{ background: "rgba(255,255,255,0.1)" }}></div>

            {/* Student Join */}
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-sm" style={{ color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>I&apos;m a Student</span>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                maxLength={6}
                className="flex-1 rounded-lg px-4 py-3 text-sm uppercase tracking-widest text-white placeholder-white/30 outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
              />
              <button
                onClick={handleJoinRoom}
                className="rounded-lg px-4 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{ background: "var(--accent)", color: "#fff", whiteSpace: "nowrap" }}
              >
                Join →
              </button>
            </div>
          </div>
        </div>

        {/* Classroom Illustration */}
        <div className="mt-8 text-center" style={{ opacity: 0.6, filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.2))" }}>
          <svg width="220" height="140" viewBox="0 0 220 140" fill="none">
            <ellipse cx="110" cy="120" rx="90" ry="14" fill="rgba(255,255,255,0.06)"/>
            <rect x="55" y="18" width="110" height="58" rx="4" fill="#1a2d4a" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
            <rect x="60" y="23" width="100" height="48" rx="2" fill="#0f1f36"/>
            <rect x="68" y="31" width="50" height="3" rx="1.5" fill="rgba(255,255,255,0.35)"/>
            <rect x="68" y="39" width="70" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/>
            <rect x="68" y="47" width="40" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/>
            <rect x="68" y="55" width="60" height="3" rx="1.5" fill="rgba(255,255,255,0.15)"/>
            <circle cx="110" cy="90" r="8" fill="rgba(255,255,255,0.2)"/>
            <rect x="104" y="98" width="12" height="16" rx="3" fill="rgba(255,255,255,0.15)"/>
            <rect x="30" y="108" width="30" height="16" rx="3" fill="rgba(255,255,255,0.12)"/>
            <rect x="95" y="108" width="30" height="16" rx="3" fill="rgba(255,255,255,0.12)"/>
            <rect x="160" y="108" width="30" height="16" rx="3" fill="rgba(255,255,255,0.12)"/>
            <circle cx="45" cy="103" r="5" fill="rgba(255,255,255,0.18)"/>
            <circle cx="110" cy="103" r="5" fill="rgba(67,97,238,0.5)"/>
            <circle cx="175" cy="103" r="5" fill="rgba(255,255,255,0.18)"/>
            <rect x="152" y="82" width="50" height="18" rx="9" fill="rgba(67,97,238,0.5)" stroke="rgba(67,97,238,0.8)" strokeWidth="1"/>
            <polygon points="162,99 168,99 165,106" fill="rgba(67,97,238,0.5)"/>
            <rect x="158" y="88" width="28" height="2.5" rx="1.2" fill="rgba(255,255,255,0.7)"/>
            <rect x="158" y="93" width="18" height="2.5" rx="1.2" fill="rgba(255,255,255,0.4)"/>
          </svg>
        </div>
      </main>

      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
