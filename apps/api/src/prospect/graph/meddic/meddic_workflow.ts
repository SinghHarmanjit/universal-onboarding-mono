import { StateGraph, START, END } from '@langchain/langgraph';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { MeddicStateAnnotation } from './meddic_state';
import { createMeddicExtractorNode } from './nodes/meddic_extractor';

export const createMeddicWorkflow = (llm: BaseChatModel) => {
  const extractorNode = createMeddicExtractorNode(llm);

  const workflow = new StateGraph(MeddicStateAnnotation)
    .addNode('extract_meddic', extractorNode)
    .addEdge(START, 'extract_meddic')
    .addEdge('extract_meddic', END);

  return workflow.compile();
};
