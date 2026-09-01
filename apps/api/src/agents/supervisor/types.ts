import { Annotation } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';

export interface SupervisorAgentState {
  messages: BaseMessage[];
  currentPhase:
    | 'rag_retrieval'
    | 'medpic_gathering'
    | 'sales_handoff'
    | 'complete';
  medpicState: {
    metrics?: string;
    economicBuyer?: string;
    decisionCriteria?: string;
    decisionProcess?: string;
    identifyPain?: string;
    champion?: string;
  };
  ragOutput?: {
    shortAnswer?: string;
    rewrittenQuery?: string;
  };
  openQuestions?: {
    heading: string;
    paragraph: string;
    clarifyingQuestionAsked?: string;
    requiresClarification: boolean;
    status: 'pending_clarification' | 'ready_for_consultant';
  }[];
  // output fields for the final emitted event
  rewrittenQuery?: string;
  shortAnswer?: string;
  citations?: any[];
}

export const SupervisorStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  currentPhase: Annotation<
    'rag_retrieval' | 'medpic_gathering' | 'sales_handoff' | 'complete'
  >({
    reducer: (left, right) => right ?? left,
    default: () => 'rag_retrieval',
  }),
  medpicState: Annotation<SupervisorAgentState['medpicState']>({
    reducer: (left, right) => ({ ...left, ...right }),
    default: () => ({}),
  }),
  ragOutput: Annotation<SupervisorAgentState['ragOutput']>({
    reducer: (left, right) => right ?? left,
    default: () => ({}),
  }),
  openQuestions: Annotation<SupervisorAgentState['openQuestions']>({
    reducer: (left, right) => right ?? left,
    default: () => [],
  }),
  rewrittenQuery: Annotation<string>({
    reducer: (left, right) => right ?? left,
    default: () => '',
  }),
  shortAnswer: Annotation<string>({
    reducer: (left, right) => right ?? left,
    default: () => '',
  }),
  citations: Annotation<any[]>({
    reducer: (left, right) => right ?? left,
    default: () => [],
  }),
});
