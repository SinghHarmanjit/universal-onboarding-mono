import { RAGState } from '../state';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';

export const createAnswerGeneratorNode = (llm: BaseChatModel) => {
  return async (state: RAGState): Promise<Partial<RAGState>> => {
    const docs = state.merged_context?.docs || state.docs_results || [];
    const business =
      state.merged_context?.business || state.business_results || [];

    // Strict Refusal
    if (docs.length === 0 && business.length === 0) {
      return {
        final_answer:
          "I'm sorry, but I couldn't find any relevant documentation or business knowledge to answer your question. How else may I assist you today?",
      };
    }

    // Context Merger with Conflict Resolution (Prioritize Docs over Business Knowledge)
    const contextStr = `
PRODUCT DOCUMENTATION (High Priority):
${docs.map((doc) => doc.content).join('\n\n')}

BUSINESS KNOWLEDGE (Standard Priority):
${business.map((b) => b.content).join('\n\n')}
`;

    const prompt =
      PromptTemplate.fromTemplate(`You are a highly respectful, empathetic, and professional support assistant for the Reap Card Issuing Service.
Your goal is to help the user with their questions using the provided context, which includes Reap's technical and business documentation.

Guidelines:
1. Empathy & Tone: Always respond in a polite, warm, and understanding manner. Acknowledge the user's needs.
2. Conflict Resolution: If the Product Documentation and Business Knowledge provide conflicting information, always prioritize the Product Documentation.
3. No External Navigation: You may see markdown links in the context. Do not attempt to explore, crawl, or instruct the user to wait while you navigate to any links. Rely exclusively on the provided text.
4. Accuracy: Base your answers strictly on the provided Context. If the context does not contain the answer, politely inform the user that you don't have that information. Do not use your pre-trained knowledge to fill in gaps.
5. No Guessing or External Suggestions: Do not suggest external options, guess, or provide examples (like ACH, wire transfers, or other methods) unless they are explicitly written in the Context.

Context:
{context}

Question:
{question}

Answer:`);

    const chain = prompt.pipe(llm).pipe(new StringOutputParser());

    const answer = await chain.invoke({
      context: contextStr,
      question: state.question,
    });

    return {
      final_answer: answer,
    };
  };
};
