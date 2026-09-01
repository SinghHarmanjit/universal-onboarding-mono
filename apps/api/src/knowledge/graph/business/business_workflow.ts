import { StateGraph, START, END } from '@langchain/langgraph';
import { BusinessStateAnnotation } from './business_state';
import { createSignalExtractorNode } from './nodes/signal_extractor';
import { createEntityRetrieverNode } from './nodes/entity_retriever';
import { createChunkRetrieverNode } from './nodes/chunk_retriever';
import { createAnswerGeneratorNode } from './nodes/answer_generator';
import { BusinessRetrievalService } from '../../services/business_retrieval.service';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

export const createBusinessWorkflow = (
  businessRetrievalService: BusinessRetrievalService,
  llm: BaseChatModel,
) => {
  const signalExtractorNode = createSignalExtractorNode(llm);
  const entityRetrieverNode = createEntityRetrieverNode(
    businessRetrievalService,
  );
  const chunkRetrieverNode = createChunkRetrieverNode(
    businessRetrievalService,
  );
  const answerGeneratorNode = createAnswerGeneratorNode(llm);

  const workflow = new StateGraph(BusinessStateAnnotation)
    .addNode('signal_extractor', signalExtractorNode)
    .addNode('entity_retriever', entityRetrieverNode)
    .addNode('chunk_retriever', chunkRetrieverNode)
    .addNode('answer_generator', answerGeneratorNode)
    .addEdge(START, 'signal_extractor')
    .addEdge('signal_extractor', 'entity_retriever')
    .addEdge('entity_retriever', 'chunk_retriever')
    .addEdge('chunk_retriever', 'answer_generator')
    .addEdge('answer_generator', END);

  return workflow.compile();
};
