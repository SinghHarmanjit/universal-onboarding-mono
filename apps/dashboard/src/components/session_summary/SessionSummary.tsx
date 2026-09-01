import React from 'react';
import { SessionSummaryEntry } from '../../types/sessionSummary';

interface SessionSummaryProps {
  summaries: SessionSummaryEntry[];
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({ summaries }) => {
  if (summaries.length === 0) {
    return (
      <p className="placeholder">
        Start a conversation to see the session summary.
      </p>
    );
  }

  return (
    <div className="session-summary-list">
      {summaries.map((summary, idx) => (
        <div key={idx} className="session-summary-entry" style={{ marginBottom: '1rem' }}>
          <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem' }}>
            {summary.rewrittenQuery || summary.originalQuery}
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
            {summary.shortAnswer}
          </p>
        </div>
      ))}
    </div>
  );
};
