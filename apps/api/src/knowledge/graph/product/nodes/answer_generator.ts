import { ProductState } from '../product_state';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StringOutputParser } from '@langchain/core/output_parsers';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

export const createAnswerGeneratorNode = (llm: BaseChatModel) => {
  return async (state: ProductState): Promise<Partial<ProductState>> => {
    const docs = state.docs_results || [];
    const hasHistory = state.messages && state.messages.length > 0;

    // Strict Refusal
    if (docs.length === 0) {
      const refusalAnswer =
        "I'm sorry, but I couldn't find any relevant documentation or business knowledge to answer your question. How else may I assist you today?";
      return {
        final_answer: refusalAnswer,
        messages: [
          ...(state.messages || []),
          new HumanMessage(state.question),
          new AIMessage(refusalAnswer),
        ],
      };
    }

    const contextStr = `
PRODUCT DOCUMENTATION:
${docs.map((doc) => doc.content).join('\n\n')}
`;

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a highly respectful, empathetic, and professional support assistant for the Reap Card Issuing Service.
Your goal is to help the user with their questions using the provided context, which includes Reap's technical and business documentation.

Guidelines:
1. Empathy & Tone: Always respond in a polite, warm, and understanding manner. Acknowledge the user's needs.
2. No External Navigation: You may see markdown links in the context. Do not attempt to explore, crawl, or instruct the user to wait while you navigate to any links. Rely exclusively on the provided text.
3. Accuracy: Base your answers strictly on the provided Context. If the context does not contain the answer, politely inform the user that you don't have that information. Do not use your pre-trained knowledge to fill in gaps.
4. No Guessing or External Suggestions: Do not suggest external options, guess, or provide examples (like ACH, wire transfers, or other methods) unless they are explicitly written in the Context.

Context:
{context}`,
      ],
      ...(hasHistory ? [new MessagesPlaceholder('messages')] : []),
      ['human', '{question}'],
    ]);

    const chain = prompt.pipe(llm).pipe(new StringOutputParser());

    const answer = await chain.invoke({
      context: contextStr,
      question: state.question,
      ...(hasHistory && { messages: state.messages }),
    });

    return {
      final_answer: answer,
      messages: [
        ...(state.messages || []),
        new HumanMessage(state.question),
        new AIMessage(answer),
      ],
    };
  };
};
