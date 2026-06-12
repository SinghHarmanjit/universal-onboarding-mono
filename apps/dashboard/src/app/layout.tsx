import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Universal Onboarding — AI Sales Assistant",
  description:
    "An intelligent AI assistant that helps prospective clients explore services, answers questions with deep product knowledge, and qualifies leads using MEDDPICC methodology.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
