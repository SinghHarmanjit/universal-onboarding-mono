import React from 'react';
import { OpenQuestion } from '../../types/openQuestions';

interface OpenQuestionsProps {
  questions: OpenQuestion[];
}

export const OpenQuestions: React.FC<OpenQuestionsProps> = ({ questions }) => {
  if (questions.length === 0) {
    return null;
  }

  return (
    <div className="open-questions-list">
      <h3>Questions for Reap Consultant</h3>
      {questions.map((q, idx) => (
        <div key={idx} className="open-question-entry" style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem' }}>
            {q.heading}
          </h4>
          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem' }}>
            {q.paragraph}
          </p>
          {q.clarifyingQuestionAsked && (
            <p style={{ margin: 0, fontSize: '0.8rem', fontStyle: 'italic', color: '#666' }}>
              Agent asked: {q.clarifyingQuestionAsked}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};
