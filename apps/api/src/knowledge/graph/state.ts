import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';
import { DocumentationChunk } from '../../models/chunk';
import { Citation } from '../../models/citation';
import { BusinessKnowledgeEntry } from '../../models/business_knowledge';

export interface RAGState {
  question: string;
  query_variations: string[];
  docs_results: DocumentationChunk[];
  // business_results: BusinessKnowledgeEntry[];
  // merged_context: {
  //   docs: DocumentationChunk[];
  //   business: BusinessKnowledgeEntry[];
  // };
  // citations: Citation[];
  final_answer: string;
  messages: BaseMessage[];
}

export const RAGStateAnnotation = Annotation.Root({
  question: Annotation<string>(),
  query_variations: Annotation<string[]>(),
  docs_results: Annotation<DocumentationChunk[]>(),
  // business_results: Annotation<BusinessKnowledgeEntry[]>(),
  // merged_context: Annotation<{
  //   docs: DocumentationChunk[];
  //   business: BusinessKnowledgeEntry[];
  // }>(),
  // citations: Annotation<Citation[]>(),
  final_answer: Annotation<string>(),
  messages: Annotation<BaseMessage[]>(),
});
