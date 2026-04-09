import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./providers";

export const metadata: Metadata = {
  title: "SafeQ — Anonymity fosters curiosity",
  description: "A safe space for students to ask any question — without fear of judgement.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased" style={{ fontFamily: "var(--font-sans)" }}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
