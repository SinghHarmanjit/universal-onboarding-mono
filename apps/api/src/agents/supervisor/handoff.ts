import { SupervisorStateAnnotation } from './types';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

export const createSalesHandoffNode = (llm: BaseChatModel) => {
  return async (state: typeof SupervisorStateAnnotation.State) => {
    // Formats any unanswerable questions or complex situations into a handoff package

    // We can transition the status of some questions if they've been pending too long
    const updatedQuestions = (state.openQuestions || []).map((q) => {
      if (q.status === 'pending_clarification') {
        return { ...q, status: 'ready_for_consultant' as const };
      }
      return q;
    });

    return {
      openQuestions: updatedQuestions,
      currentPhase: 'complete' as const,
    };
  };
};
