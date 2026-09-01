import { KnowledgePlannerState } from '../planner_state';
import { DocsRetrievalService } from '../../../services/docs_retrieval.service';
import { BusinessRetrievalService } from '../../../services/business_retrieval.service';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Repository } from 'typeorm';
import { RetrievalEvent } from '../../../../models/retrieval_event';
import { createProductWorkflow } from '../../product/product_workflow';

export const createProductAgentNode = (
  docsRetrievalService: DocsRetrievalService,
  businessRetrievalService: BusinessRetrievalService,
  retrievalEventRepo: Repository<RetrievalEvent>,
  llm: BaseChatModel,
) => {
  // We compile the product workflow here once, or we could pass the compiled graph in.
  // For simplicity, we initialize it here.
  const productWorkflow = createProductWorkflow(
    docsRetrievalService,
    businessRetrievalService,
    retrievalEventRepo,
    llm,
  );

  return async (
    state: KnowledgePlannerState,
  ): Promise<Partial<KnowledgePlannerState>> => {
    try {
      console.log('[ProductAgentNode] Invoking product workflow...');
      const result = await productWorkflow.invoke({
        question: state.question,
        messages: state.messages || [],
      });

      return {
        product_result: {
          answer: result.final_answer || '',
          docs: result.docs_results || [],
        },
      };
    } catch (e) {
      console.error('[ProductAgentNode] Error invoking product workflow:', e);
      return {
        product_result: {
          answer: 'Error retrieving product knowledge.',
          docs: [],
        },
      };
    }
  };
};
