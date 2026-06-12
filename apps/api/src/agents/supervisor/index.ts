import { StateGraph, START, END } from '@langchain/langgraph';
import { SupervisorStateAnnotation } from './types';
import { createRagRetrievalNode } from './nodes';
import { createMedpicEvaluatorNode } from './medpic';
import { createSalesHandoffNode } from './handoff';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { DocsRetrievalService } from '../../knowledge/services/docs_retrieval.service';
import { BusinessRetrievalService } from '../../knowledge/services/business_retrieval.service';
import { Repository } from 'typeorm';
import { RetrievalEvent } from '../../models/retrieval_event';

export const createSupervisorWorkflow = (
  llm: BaseChatModel,
  docsRetrievalService: DocsRetrievalService,
  businessRetrievalService: BusinessRetrievalService,
  retrievalEventRepo: Repository<RetrievalEvent>,
) => {
  const ragRetrievalNode = createRagRetrievalNode(
    llm,
    docsRetrievalService,
    businessRetrievalService,
    retrievalEventRepo,
  );
  const medpicNode = createMedpicEvaluatorNode(llm);
  const handoffNode = createSalesHandoffNode(llm);

  const workflow = new StateGraph(SupervisorStateAnnotation)
    .addNode('rag_retrieval', ragRetrievalNode)
    .addNode('medpic_gathering', medpicNode)
    .addNode('sales_handoff', handoffNode)
    .addEdge(START, 'rag_retrieval')
    .addEdge('rag_retrieval', 'medpic_gathering')
    .addEdge('medpic_gathering', 'sales_handoff')
    .addEdge('sales_handoff', END);

  return workflow.compile();
};
