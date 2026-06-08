"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
// Global prefix is "v1/api", controller is "api/v1/query"
const QUERY_URL = `${API_BASE}/v1/api/query`;

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  citations?: Citation[];
  streaming?: boolean;
}

interface Citation {
  source?: string;
  title?: string;
  url?: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      content:
        "Welcome! I'm here to help you explore how we can support your business. What's driving your interest in our services today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);
  const [resources, setResources] = useState<Citation[]>([]);
  const [apiStatus, setApiStatus] = useState<"idle" | "ok" | "error">("idle");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Ping the backend health endpoint once on mount
  useEffect(() => {
    fetch(`${API_BASE}/v1/api/health`)
      .then((r) => setApiStatus(r.ok ? "ok" : "error"))
      .catch(() => setApiStatus("error"));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const question = input.trim();
    if (!question || isStreaming) return;

    const userMsgId = crypto.randomUUID();
    const aiMsgId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: question },
      { id: aiMsgId, role: "ai", content: "", streaming: true },
    ]);
    setInput("");
    setIsStreaming(true);

    // Extract a rough topic from the question (first 4 words)
    const topicSnippet = question.split(" ").slice(0, 4).join(" ");
    setTopics((prev) => [topicSnippet, ...prev].slice(0, 5));

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const response = await fetch(QUERY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: abort.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (!raw || raw === "[DONE]") continue;

          try {
            const parsed = JSON.parse(raw) as {
              type: "chunk" | "citations" | "done";
              content?: string;
              citations?: Citation[];
            };

            if (parsed.type === "chunk" && parsed.content) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId
                    ? { ...m, content: m.content + parsed.content }
                    : m
                )
              );
            } else if (parsed.type === "citations" && parsed.citations) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId ? { ...m, citations: parsed.citations } : m
                )
              );
              // Merge new citations into Resources panel (dedupe by url/source)
              setResources((prev) => {
                const existing = new Set(prev.map((r) => r.url ?? r.source));
                const newOnes = (parsed.citations ?? []).filter(
                  (c) => !existing.has(c.url ?? c.source)
                );
                return [...newOnes, ...prev].slice(0, 10);
              });
            }
          } catch {
            // non-JSON line, skip
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                ...m,
                content:
                  m.content ||
                  "⚠️ Could not reach the backend server. Make sure the API is running on port 8000.",
              }
              : m
          )
        );
      }
    } finally {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId ? { ...m, streaming: false } : m
        )
      );
      setIsStreaming(false);
      abortRef.current = null;
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, isStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
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
            {topics.length === 0 ? (
              <p className="placeholder">
                Start a conversation to see topics discussed.
              </p>
            ) : (
              <ul className="topic-list">
                {topics.map((t, i) => (
                  <li key={i} className="topic-chip">
                    {t}…
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h2>📚 Resources</h2>
            {resources.length === 0 ? (
              <p className="placeholder">
                Relevant resources will appear here as you chat.
              </p>
            ) : (
              <ul className="resource-list">
                {resources.map((r, i) => (
                  <li key={i} className="resource-item">
                    {r.url ? (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="resource-link"
                      >
                        {r.title ?? r.source ?? r.url}
                      </a>
                    ) : (
                      <span>{r.title ?? r.source}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
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
          <div className="chat-messages" id="chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.role === "user" ? "user-message" : "ai-message"
                  }`}
              >
                {msg.content ? (
                  <p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>
                ) : msg.streaming ? (
                  <span className="typing-indicator">
                    <span />
                    <span />
                    <span />
                  </span>
                ) : null}

                {msg.citations && msg.citations.length > 0 && (
                  <div className="citations">
                    <p className="citations-label">Sources</p>
                    <ul>
                      {msg.citations.map((c, i) => (
                        <li key={i}>
                          {c.url ? (
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="citation-link"
                            >
                              {c.title ?? c.source ?? c.url}
                            </a>
                          ) : (
                            <span>{c.title ?? c.source}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              ref={inputRef}
              id="chat-input"
              type="text"
              className="chat-input"
              placeholder={
                isStreaming ? "Receiving response…" : "Type your message…"
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              autoFocus
            />
            {isStreaming ? (
              <button
                id="stop-button"
                className="send-button stop-button"
                onClick={stopStreaming}
                aria-label="Stop generation"
              >
                ◼
              </button>
            ) : (
              <button
                id="send-button"
                className="send-button"
                onClick={sendMessage}
                disabled={!input.trim()}
                aria-label="Send message"
              >
                ➤
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
