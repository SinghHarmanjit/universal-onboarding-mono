import { StateGraph, START, END } from '@langchain/langgraph';
import { RAGStateAnnotation } from './state';
import { createQueryRewriterNode } from './nodes/query_rewriter';
import { createDocsRetrieverNode } from './nodes/docs_retriever';
import { createBusinessRetrieverNode } from './nodes/business_retriever';
import { contextMergerNode } from './nodes/context_merger';
import { createAnswerGeneratorNode } from './nodes/answer_generator';
import { createAnalyticsLoggerNode } from './nodes/analytics_logger';
import { DocsRetrievalService } from '../services/docs_retrieval.service';
import { BusinessRetrievalService } from '../services/business_retrieval.service';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Repository } from 'typeorm';
import { RetrievalEvent } from '../../models/retrieval_event';

export const createWorkflow = (
  docsRetrievalService: DocsRetrievalService,
  businessRetrievalService: BusinessRetrievalService,
  retrievalEventRepo: Repository<RetrievalEvent>,
  llm: BaseChatModel,
) => {
  const queryRewriterNode = createQueryRewriterNode(llm);
  const docsRetrieverNode = createDocsRetrieverNode(docsRetrievalService);
  const businessRetrieverNode = createBusinessRetrieverNode(
    businessRetrievalService,
  );
  const answerGeneratorNode = createAnswerGeneratorNode(llm);
  const analyticsLoggerNode = createAnalyticsLoggerNode(retrievalEventRepo);

  const workflow = new StateGraph(RAGStateAnnotation)
    .addNode('query_rewriter', queryRewriterNode)
    .addNode('docs_retriever', docsRetrieverNode)
    .addNode('business_retriever', businessRetrieverNode)
    .addNode('context_merger', contextMergerNode)
    .addNode('answer_generator', answerGeneratorNode)
    .addNode('analytics_logger', analyticsLoggerNode)
    .addEdge(START, 'query_rewriter')
    // Parallel retrieval
    .addEdge('query_rewriter', 'docs_retriever')
    .addEdge('query_rewriter', 'business_retriever')
    // Merge after both retrievers
    .addEdge('docs_retriever', 'context_merger')
    .addEdge('business_retriever', 'context_merger')
    // Generate answer
    .addEdge('context_merger', 'answer_generator')
    // Log analytics after answer is generated
    .addEdge('answer_generator', 'analytics_logger')
    .addEdge('analytics_logger', END);

  return workflow.compile();
};
