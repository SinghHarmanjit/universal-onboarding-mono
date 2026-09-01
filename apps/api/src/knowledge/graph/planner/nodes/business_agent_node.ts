import { KnowledgePlannerState } from '../planner_state';
import { BusinessRetrievalService } from '../../../services/business_retrieval.service';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { createBusinessWorkflow } from '../../business/business_workflow';

export const createBusinessAgentNode = (
  businessRetrievalService: BusinessRetrievalService,
  llm: BaseChatModel,
) => {
  const businessWorkflow = createBusinessWorkflow(
    businessRetrievalService,
    llm,
  );

  return async (
    state: KnowledgePlannerState,
  ): Promise<Partial<KnowledgePlannerState>> => {
    try {
      console.log('[BusinessAgentNode] Invoking business workflow...');
      const result = await businessWorkflow.invoke({
        question: state.question,
        messages: state.messages || [],
      });

      return {
        business_result: {
          answer: result.final_answer || '',
          entities: result.business_entities_results || [],
          chunks: result.business_chunks_results || [],
        },
      };
    } catch (e) {
      console.error('[BusinessAgentNode] Error invoking business workflow:', e);
      return {
        business_result: {
          answer: 'Error retrieving business knowledge.',
          entities: [],
          chunks: [],
        },
      };
    }
  };
};
