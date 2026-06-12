import { SupervisorStateAnnotation } from './types';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage } from '@langchain/core/messages';
import { createWorkflow } from '../../knowledge/graph/workflow';
import { DocsRetrievalService } from '../../knowledge/services/docs_retrieval.service';
import { BusinessRetrievalService } from '../../knowledge/services/business_retrieval.service';
import { Repository } from 'typeorm';
import { RetrievalEvent } from '../../models/retrieval_event';

export const createRagRetrievalNode = (
  llm: BaseChatModel,
  docsRetrievalService: DocsRetrievalService,
  businessRetrievalService: BusinessRetrievalService,
  retrievalEventRepo: Repository<RetrievalEvent>,
) => {
  return async (state: typeof SupervisorStateAnnotation.State) => {
    // Extract the latest user message
    const lastMsg = state.messages[state.messages.length - 1];
    const userQuery = lastMsg ? lastMsg.content : '';

    // Execute the actual RAG workflow
    const ragWorkflow = createWorkflow(
      docsRetrievalService,
      businessRetrievalService,
      retrievalEventRepo,
      llm,
    );

    const ragState = await ragWorkflow.invoke({
      question: userQuery as string,
    });

    const rewrittenQuery = ragState.query_variations?.[0] || userQuery;
    const shortAnswer = ragState.final_answer;
    // const citations = ragState.citations || [];

    // Return the updated state
    return {
      messages: [new AIMessage(shortAnswer)],
      ragOutput: { shortAnswer, rewrittenQuery },
      rewrittenQuery,
      shortAnswer,
      currentPhase: 'complete' as const, // In US3 we'll transition to medpic_gathering instead
    };
  };
};
