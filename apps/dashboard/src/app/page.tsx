"use client";

import { useState, useEffect, useRef } from "react";
import { SessionSummary } from "../components/session_summary/SessionSummary";
import { SessionSummaryEntry } from "../types/sessionSummary";
import { marked } from "marked";
import { MeddicProfile } from "../components/MeddicProfile";
import { ExtractedFacts } from "../components/ExtractedFacts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
// Global prefix is "v1/api", controller is "supervisor"
const QUERY_URL = `${API_BASE}/v1/api/supervisor`;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [sessionSummaries, setSessionSummaries] = useState<SessionSummaryEntry[]>([]);
  const [facts, setFacts] = useState<any[]>([]);
  const [meddic, setMeddic] = useState<any | null>(null);
  const [apiStatus, setApiStatus] = useState<"idle" | "ok" | "error">("idle");
  const [prospectId, setProspectId] = useState<string | undefined>();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome! I'm here to help you explore how we can support your business. What's driving your interest in our services today?",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ping the backend health endpoint once on mount
  useEffect(() => {
    fetch(`${API_BASE}/v1/api/health`)
      .then((r) => setApiStatus(r.ok ? "ok" : "error"))
      .catch(() => setApiStatus("error"));
  }, []);

  // Scroll to bottom on new messages or when loading status changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userQuery = inputText.trim();
    setInputText("");

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: userQuery,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const chatHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(QUERY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId: prospectId,
          question: userQuery,
          messages: chatHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.prospectId && !prospectId) {
        setProspectId(data.prospectId);
      }

      const aiMessage: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: data.answer || "No response received.",
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (data.facts) {
        setFacts(data.facts);
      }

      if (data.meddic) {
        setMeddic(data.meddic);
      }

      // Generate dynamic Session Summary
      if (data.answer) {
        const sentences = data.answer.split(/[.!?]/);
        const shortAnswer = (sentences[0] || data.answer).trim();
        const truncatedShortAnswer =
          shortAnswer.length > 120 ? shortAnswer.slice(0, 120) + "..." : shortAnswer;

        setSessionSummaries((prev) => [
          ...prev,
          {
            originalQuery: userQuery,
            rewrittenQuery: userQuery,
            shortAnswer: truncatedShortAnswer,
          },
        ]);
      }
    } catch (err: unknown) {
      const errorMessage: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: "Failed to reach the knowledge base. Please try again later.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container">
      <header className="header">
        <h1>AI Sales Assistant</h1>
        <p className="subtitle">Universal Onboarding</p>
        <div
          className={`status-dot ${apiStatus === "ok"
              ? "status-ok"
              : apiStatus === "error"
                ? "status-error"
                : "status-idle"
            }`}
          title={
            apiStatus === "ok"
              ? "Backend connected"
              : apiStatus === "error"
                ? "Backend unreachable"
                : "Checking backend…"
          }
        />
      </header>

      <div className="split-pane">
        {/* Dashboard Pane (Left) */}
        <aside className="dashboard-pane">
          <section className="card">
            <h2>Session Summary</h2>
            <SessionSummary summaries={sessionSummaries} />
          </section>

          <section className="card">
            <h2>MEDDIC Profile</h2>
            <MeddicProfile data={meddic} />
          </section>

          <section className="card">
            <h2>Extracted Facts</h2>
            <ExtractedFacts facts={facts} />
          </section>

          <section className="card cta-card">
            <h2>📅 Book a Meeting</h2>
            <button
              className="cta-button"
              disabled={messages.length < 3}
              onClick={() =>
                window.open("https://calendly.com", "_blank", "noopener")
              }
            >
              Schedule Now
            </button>
            <p className="placeholder">
              {messages.length < 3
                ? "Available once we understand your needs."
                : "Ready to connect with our team!"}
            </p>
          </section>
        </aside>

        {/* Chat Pane (Right) */}
        <section className="chat-pane">
          <div className="chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${
                  msg.role === "user" ? "user-message" : "ai-message"
                }`}
              >
                {msg.role === "user" ? (
                  <p>{msg.content}</p>
                ) : (
                  <div
                    className="markdown-content"
                    dangerouslySetInnerHTML={{
                      __html: marked.parse(msg.content) as string,
                    }}
                  />
                )}
              </div>
            ))}
            {isLoading && (
              <div className="message ai-message">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-area">
            <input
              type="text"
              className="chat-input"
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="send-button"
              disabled={isLoading || !inputText.trim()}
            >
              ➤
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
