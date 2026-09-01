import { StateGraph, START, END } from '@langchain/langgraph';
import { ProductStateAnnotation } from './product_state';
import { createQueryRewriterNode } from './nodes/query_rewriter';
import { createDocsRetrieverNode } from './nodes/docs_retriever';
import { createBusinessRetrieverNode } from './nodes/business_retriever';
import { createAnswerGeneratorNode } from './nodes/answer_generator';
import { createAnalyticsLoggerNode } from './nodes/analytics_logger';
import { DocsRetrievalService } from '../../services/docs_retrieval.service';
import { BusinessRetrievalService } from '../../services/business_retrieval.service';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Repository } from 'typeorm';
import { RetrievalEvent } from '../../../models/retrieval_event';

export const createProductWorkflow = (
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

  const workflow = new StateGraph(ProductStateAnnotation)
    .addNode('query_rewriter', queryRewriterNode)
    .addNode('docs_retriever', docsRetrieverNode)
    .addNode('answer_generator', answerGeneratorNode)
    .addNode('analytics_logger', analyticsLoggerNode)
    .addEdge(START, 'query_rewriter')
    .addEdge('query_rewriter', 'docs_retriever')
    .addEdge('docs_retriever', 'answer_generator')
    .addEdge('answer_generator', 'analytics_logger')
    .addEdge('analytics_logger', END);

  return workflow.compile();
};
