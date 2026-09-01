import { StateGraph, START, END } from '@langchain/langgraph';
import { KnowledgePlannerStateAnnotation } from './planner_state';
import { createProductAgentNode } from './nodes/product_agent_node';
import { createBusinessAgentNode } from './nodes/business_agent_node';
import { createRouterNode } from './nodes/router_node';
import { DocsRetrievalService } from '../../services/docs_retrieval.service';
import { BusinessRetrievalService } from '../../services/business_retrieval.service';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Repository } from 'typeorm';
import { RetrievalEvent } from '../../../models/retrieval_event';

export const createPlannerWorkflow = (
  docsRetrievalService: DocsRetrievalService,
  businessRetrievalService: BusinessRetrievalService,
  retrievalEventRepo: Repository<RetrievalEvent>,
  llm: BaseChatModel,
) => {
  const routerNode = createRouterNode(llm);
  const productAgentNode = createProductAgentNode(
    docsRetrievalService,
    businessRetrievalService,
    retrievalEventRepo,
    llm,
  );
  const businessAgentNode = createBusinessAgentNode(
    businessRetrievalService,
    llm,
  );

  const workflow = new StateGraph(KnowledgePlannerStateAnnotation)
    .addNode('router', routerNode)
    .addNode('product_agent', productAgentNode)
    .addNode('business_agent', businessAgentNode)
    .addEdge(START, 'router')
    .addConditionalEdges('router', (state) => {
      if (!state.route || state.route.length === 0) {
        return ['business_agent'];
      }
      return state.route;
    })
    .addEdge('product_agent', END)
    .addEdge('business_agent', END);

  return workflow.compile();
};
