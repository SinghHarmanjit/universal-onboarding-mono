import { Annotation } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import { ProspectFact } from '../../../models/prospect_fact';
import { ProspectMeddic } from '../../../models/prospect_meddic';

export const SupervisorStateAnnotation = Annotation.Root({
  question: Annotation<string>(),
  messages: Annotation<BaseMessage[]>({
    reducer: (curr, update) => curr.concat(update),
    default: () => [],
  }),
  prospectId: Annotation<string>(),
  facts: Annotation<ProspectFact[]>(),
  meddic: Annotation<ProspectMeddic>(),
  suggested_question: Annotation<string>(),
  product_result: Annotation<{ answer: string; docs: any[] }>(),
  business_result: Annotation<{ answer: string; entities: any[]; chunks: any[] }>(),
  final_answer: Annotation<string>(),
});

export type SupervisorState = typeof SupervisorStateAnnotation.State;
