export default function Home() {
  return (
    <main className="container">
      <header className="header">
        <h1>AI Sales Assistant</h1>
        <p className="subtitle">Universal Onboarding</p>
      </header>

      <div className="split-pane">
        {/* Dashboard Pane (Left) */}
        <aside className="dashboard-pane">
          <section className="card">
            <h2>Session Summary</h2>
            <p className="placeholder">Start a conversation to see topics discussed.</p>
          </section>

          <section className="card">
            <h2>📚 Resources</h2>
            <p className="placeholder">Relevant resources will appear here as you chat.</p>
          </section>

          <section className="card">
            <h2>💾 Saved Q&amp;A</h2>
            <p className="placeholder">Bookmark answers to save them here.</p>
          </section>

          <section className="card cta-card">
            <h2>📅 Book a Meeting</h2>
            <button className="cta-button" disabled>
              Schedule Now
            </button>
            <p className="placeholder">Available once we understand your needs.</p>
          </section>
        </aside>

        {/* Chat Pane (Right) */}
        <section className="chat-pane">
          <div className="chat-messages">
            <div className="message ai-message">
              <p>
                Welcome! I&apos;m here to help you explore how we can support your
                business. What&apos;s driving your interest in our services today?
              </p>
            </div>
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              className="chat-input"
              placeholder="Type your message..."
              disabled
            />
            <button className="send-button" disabled>
              ➤
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
