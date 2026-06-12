"use client";

import { useState, useEffect, useRef } from "react";
import { SessionSummary } from "../components/session_summary/SessionSummary";
import { OpenQuestions } from "../components/session_summary/OpenQuestions";
import { ResourcesList } from "../components/resources/ResourcesList";
import { SessionSummaryEntry } from "../types/sessionSummary";
import { OpenQuestion } from "../types/openQuestions";
import { DiscoveredResource } from "../types/resources";
import { marked } from "marked";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
// Global prefix is "v1/api", controller is "api/v1/query"
const QUERY_URL = `${API_BASE}/v1/api/query`;

interface Citation extends DiscoveredResource { }

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [sessionSummaries, setSessionSummaries] = useState<SessionSummaryEntry[]>([]);
  const [openQuestions, setOpenQuestions] = useState<OpenQuestion[]>([]);
  const [resources, setResources] = useState<Citation[]>([]);
  const [apiStatus, setApiStatus] = useState<"idle" | "ok" | "error">("idle");

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
          question: userQuery,
          messages: chatHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const aiMessage: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: data.answer || "No response received.",
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Merge citations
      if (data.citations && data.citations.length > 0) {
        setResources((prev) => {
          const existing = new Set(prev.map((r) => r.url ?? r.source));
          const newOnes = data.citations
            .map((c: any) => ({
              title: c.text_snippet || c.source_id,
              url: c.url,
              source: c.source_type,
            }))
            .filter((c: Citation) => !existing.has(c.url ?? c.source));
          return [...newOnes, ...prev].slice(0, 10);
        });
      }

      // Merge open questions
      if (data.open_questions && data.open_questions.length > 0) {
        setOpenQuestions((prev) => {
          const existingHeadings = new Set(prev.map((q) => q.heading));
          const newQuestions = data.open_questions
            .map((q: string) => ({
              heading: q,
              content: "Unanswered during session.",
            }))
            .filter((q: OpenQuestion) => !existingHeadings.has(q.heading));
          return [...prev, ...newQuestions];
        });
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
            <OpenQuestions questions={openQuestions} />
          </section>

          <section className="card">
            <h2>📚 Resources</h2>
            <ResourcesList resources={resources} />
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
