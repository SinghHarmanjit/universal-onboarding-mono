export interface OpenQuestion {
  heading: string;
  paragraph: string;
  clarifyingQuestionAsked?: string;
  requiresClarification: boolean;
  status: 'pending_clarification' | 'ready_for_consultant';
}
