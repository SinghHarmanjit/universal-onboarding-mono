import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';

export interface KnowledgePlannerState {
  question: string;
  route?: ('product_agent' | 'business_agent')[];
  product_result?: {
    answer: string;
    docs: any[];
  };
  business_result?: {
    answer: string;
    entities: any[];
    chunks: any[];
  };
  final_answer: string;
  messages: BaseMessage[];
}

export const KnowledgePlannerStateAnnotation = Annotation.Root({
  question: Annotation<string>(),
  route: Annotation<('product_agent' | 'business_agent')[]>(),
  product_result: Annotation<{ answer: string; docs: any[] }>(),
  business_result: Annotation<{ answer: string; entities: any[]; chunks: any[] }>(),
  final_answer: Annotation<string>(),
  messages: Annotation<BaseMessage[]>(),
});
