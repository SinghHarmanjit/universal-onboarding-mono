import { SupervisorState } from '../supervisor_state';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StringOutputParser } from '@langchain/core/output_parsers';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

export const createResponseComposerNode = (llm: BaseChatModel) => {
  return async (
    state: SupervisorState,
  ): Promise<Partial<SupervisorState>> => {
    const question = state.question;
    const hasHistory = state.messages && state.messages.length > 0;

    const productAnswer = state.product_result?.answer || 'No product information retrieved.';
    const businessAnswer = state.business_result?.answer || 'No business intelligence retrieved.';
    const meddicProfile = state.meddic ? JSON.stringify(state.meddic, null, 2) : 'No MEDDIC profile available.';
    const suggestedQuestion = state.suggested_question || 'No suggested question.';

    const context = `
=== PRODUCT KNOWLEDGE ANSWER ===
${productAnswer}

=== BUSINESS INTELLIGENCE ANSWER ===
${businessAnswer}

=== MEDDIC PROFILE ===
${meddicProfile}
`.trim();

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are the Sales Orchestrator for Reap Card Issuing.
You have consulted specialized sub-agents (Product Knowledge and Business Intelligence) and analyzed the MEDDIC profile of the prospect.

Your task is to synthesize this information into a single, cohesive, and compelling response to the user's question.

Guidelines:
1. Blend technical product capabilities seamlessly with business value (e.g., pricing, case studies, timelines).
2. Ensure the tone is consultative and authoritative.
3. Tailor the response based on the MEDDIC profile provided.
4. Transition smoothly into the following suggested discovery question to advance the conversation: "{suggested_question}"

Sub-Agent Responses & Profile:
{context}
`,
      ],
      ...(hasHistory ? [new MessagesPlaceholder('messages')] : []),
      ['human', '{question}'],
    ]);

    const chain = prompt.pipe(llm).pipe(new StringOutputParser());

    try {
      const response = await chain.invoke({
        question: question,
        context: context,
        suggested_question: suggestedQuestion,
        ...(hasHistory && { messages: state.messages }),
      });

      console.log('[ResponseComposer] Synthesized final answer successfully.');
      return {
        final_answer: response,
        messages: [new HumanMessage(question), new AIMessage(response)],
      };
    } catch (e) {
      console.error('[ResponseComposer] Failed to synthesize final answer', e);
      return {
        final_answer:
          "I apologize, but I encountered an error while synthesizing the response.",
      };
    }
  };
};
