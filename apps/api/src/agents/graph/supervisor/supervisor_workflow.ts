import { StateGraph, START, END } from '@langchain/langgraph';
import { SupervisorStateAnnotation } from './supervisor_state';
import { FactExtractionAgentService } from '../../../prospect/services/fact_extraction_agent.service';
import { MeddicAgentService } from '../../../prospect/services/meddic_agent.service';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { createResponseComposerNode } from './nodes/response_composer';

export const createSupervisorWorkflow = (
  factExtractor: FactExtractionAgentService,
  meddicManager: MeddicAgentService,
  plannerWorkflow: any,
  llm: BaseChatModel,
) => {
  const factExtractionNode = async (state: typeof SupervisorStateAnnotation.State) => {
    // Only pass plain array of messages, FactExtractionAgentService handles conversion
    // if needed, but it expects { role: 'user' | 'assistant', content: string }
    const formattedMessages = state.messages.map((m) => ({
      role: m._getType() === 'human' ? 'user' : 'assistant',
      content: m.content as string,
      type: m._getType(),
    }));
    await factExtractor.processFactExtraction(
      state.prospectId,
      state.question,
      formattedMessages,
    );
    return {};
  };

  const meddicManagerNode = async (state: typeof SupervisorStateAnnotation.State) => {
    const formattedMessages = state.messages.map((m) => ({
      role: m._getType() === 'human' ? 'user' : 'assistant',
      content: m.content as string,
      type: m._getType(),
    }));
    const result = await meddicManager.processMeddicMessage(
      state.prospectId,
      state.question,
      formattedMessages,
    );
    return {
      meddic: result.profile,
      suggested_question: result.suggested_question,
    };
  };

  const knowledgePlannerNode = async (state: typeof SupervisorStateAnnotation.State) => {
    const plannerResult = await plannerWorkflow.invoke({
      question: state.question,
      messages: state.messages,
    });
    return {
      product_result: plannerResult.product_result,
      business_result: plannerResult.business_result,
    };
  };
  const responseComposerNode = createResponseComposerNode(llm);

  const workflow = new StateGraph(SupervisorStateAnnotation)
    .addNode('fact_extractor', factExtractionNode)
    .addNode('meddic_manager', meddicManagerNode)
    .addNode('knowledge_planner', knowledgePlannerNode)
    .addNode('response_composer', responseComposerNode)
    // Run Fact Extractor, Meddic Manager, and Knowledge Planner in parallel.
    // They don't depend on each other's output, so we run them concurrently to minimize latency.
    .addEdge(START, 'fact_extractor')
    .addEdge(START, 'meddic_manager')
    .addEdge(START, 'knowledge_planner')
    .addEdge('fact_extractor', 'response_composer')
    .addEdge('meddic_manager', 'response_composer')
    .addEdge('knowledge_planner', 'response_composer')
    .addEdge('response_composer', END);

  return workflow.compile();
};
