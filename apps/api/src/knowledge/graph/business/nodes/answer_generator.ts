import { BusinessState } from '../business_state';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StringOutputParser } from '@langchain/core/output_parsers';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';

export const createAnswerGeneratorNode = (llm: BaseChatModel) => {
  return async (state: BusinessState): Promise<Partial<BusinessState>> => {
    const question = state.question;
    const entities = state.business_entities_results || [];
    const chunks = state.business_chunks_results || [];
    const hasHistory = state.messages && state.messages.length > 0;

    // Format the context from retrieved entities and chunks
    const entitiesContext = entities
      .map((e) => `[ENTITY - ${e.entity_type}]: ${e.entity_name}\n${JSON.stringify(e.attributes, null, 2)}`)
      .join('\n\n');

    const chunksContext = chunks
      .map((c) => `[DOCUMENT]: ${c.title}\n${c.content}`)
      .join('\n\n');

    const context = `
=== STRUCTURED BUSINESS FACTS ===
${entitiesContext || 'No structured facts found.'}

=== GENERAL BUSINESS DOCUMENTS ===
${chunksContext || 'No general documents found.'}
`.trim();

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a highly capable Sales Intelligence Agent for Reap Card Issuing.
Your goal is to answer the user's question accurately using the provided context, but also to advance the conversation toward gathering MEDDIC qualification information.

Guidelines:
1. Answer the user's question directly and concisely based on the context.
2. Prioritize STRUCTURED BUSINESS FACTS over general documents if they contradict.
3. If the context does not contain the answer, say you don't know, but try to use the general documents if helpful.
4. IMPORTANT: Always end your response with ONE follow-up question designed to uncover business needs (like pain points, expected metrics/timeline, or identifying the economic buyer).

Context:
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
        ...(hasHistory && { messages: state.messages }),
      });

      console.log('[AnswerGenerator] Generated answer successfully.');
      return {
        final_answer: response,
      };
    } catch (e) {
      console.error('[AnswerGenerator] Failed to generate answer', e);
      return {
        final_answer:
          "I'm sorry, I couldn't generate an answer based on the current context.",
      };
    }
  };
};
