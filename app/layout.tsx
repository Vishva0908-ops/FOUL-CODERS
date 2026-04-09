import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AskBox - Anonymous Q&A for Classrooms",
  description: "Students ask questions anonymously, teachers answer publicly or privately.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-dark-bg text-dark-text antialiased">
        {children}
      </body>
    </html>
  );
}
