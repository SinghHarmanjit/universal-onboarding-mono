import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';
import { DocumentationChunk } from '../../../models/chunk';

export interface ProductState {
  question: string;
  query_variations: string[];
  docs_results: DocumentationChunk[];
  final_answer: string;
  messages: BaseMessage[];
}

export const ProductStateAnnotation = Annotation.Root({
  question: Annotation<string>(),
  query_variations: Annotation<string[]>(),
  docs_results: Annotation<DocumentationChunk[]>(),
  final_answer: Annotation<string>(),
  messages: Annotation<BaseMessage[]>(),
});
