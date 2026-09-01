import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';
import { BusinessKnowledgeEntry } from '../../../models/business_knowledge';
import { BusinessEntity } from '../../../models/business_entity';

export interface BusinessSignal {
  entity_type: string;
  keywords?: string[];
  filters?: Record<string, any>;
}

export interface BusinessState {
  question: string;
  signals: BusinessSignal[];
  business_entities_results: BusinessEntity[];
  business_chunks_results: BusinessKnowledgeEntry[];
  final_answer: string;
  messages: BaseMessage[];
}

export const BusinessStateAnnotation = Annotation.Root({
  question: Annotation<string>(),
  signals: Annotation<BusinessSignal[]>(),
  business_entities_results: Annotation<BusinessEntity[]>(),
  business_chunks_results: Annotation<BusinessKnowledgeEntry[]>(),
  final_answer: Annotation<string>(),
  messages: Annotation<BaseMessage[]>(),
});
