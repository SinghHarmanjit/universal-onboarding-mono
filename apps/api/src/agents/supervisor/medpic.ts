import { SupervisorStateAnnotation } from './types';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

export const createMedpicEvaluatorNode = (llm: BaseChatModel) => {
  return async (state: typeof SupervisorStateAnnotation.State) => {
    // In a real implementation, this node analyzes the conversation history against the MEDPIC framework
    // and formulates clarifying questions if critical info is missing.

    const newMedpicState = { ...state.medpicState };
    let clarifyingQuestionAsked: string | undefined;

    // Dummy logic for missing Metrics
    if (!newMedpicState.metrics) {
      clarifyingQuestionAsked =
        "Can you share what metrics you'll use to measure success?";
      // Ideally we would push this question to the user, but we'll just track it
    }

    const openQuestion = {
      heading: 'MEDPIC Metrics Missing',
      paragraph: "We need to understand the customer's success metrics.",
      clarifyingQuestionAsked,
      requiresClarification: true,
      status: 'pending_clarification' as const,
    };

    return {
      medpicState: newMedpicState,
      openQuestions: [openQuestion],
      currentPhase: 'sales_handoff' as const,
    };
  };
};
