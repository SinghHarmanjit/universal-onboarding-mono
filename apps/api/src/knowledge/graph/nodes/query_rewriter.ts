import { RAGState } from '../state';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StringOutputParser } from '@langchain/core/output_parsers';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';

export const createQueryRewriterNode = (llm: BaseChatModel) => {
  return async (state: RAGState): Promise<Partial<RAGState>> => {
    const originalQuestion = state.question;
    const hasHistory = state.messages && state.messages.length > 0;

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are an expert search query generator for a retrieval-augmented generation (RAG) system for the Reap Card Issuing Service.
Your task is to take a user's question and generate 3 distinct search query variations optimized for vector similarity search.
Consider the conversation history if present, as the user's latest question might refer back to it.

Guidelines:
1. Generate concise, keyword-focused queries (2-5 words) rather than full sentences. Vector search works best with keywords.
2. Map user terms to domain-specific terminology where appropriate (e.g., "apple pay" -> "digital wallet", "how to fund" -> "funding model").
3. DO NOT include conversational filler like "Tell me about", "What is", etc.
4. Return ONLY a valid JSON array of strings containing the queries. Do not include markdown formatting or backticks.

Domain Context Keywords (use only if highly relevant to the user's intent): Real-Time Authorization, Standard Authorization, Cardholder Managed Funding, Program Owner Managed Funding, Physical/Virtual Cards, Digital Wallet Provisioning, Tokenization, KYC/KYB, 3DS Forwarding, MCC Padding, Disputes, Fraud Alerts, Webhooks, Reconciliation, Crypto Top-up.`,
      ],
      ...(hasHistory ? [new MessagesPlaceholder('messages')] : []),
      ['human', '{question}'],
    ]);

    const chain = prompt.pipe(llm).pipe(new StringOutputParser());

    try {
      const response = await chain.invoke({
        question: originalQuestion,
        ...(hasHistory && { messages: state.messages }),
      });
      console.log('[QueryRewriter] Raw LLM response:', response);

      // Clean up response: remove <think> tags and their contents
      const cleanedResponse = response
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .trim();
      console.log('[QueryRewriter] Cleaned response:', cleanedResponse);

      let variations: string[] = [];
      try {
        // Attempt to parse JSON array
        variations = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.log(
          '[QueryRewriter] JSON parse failed, using fallback:',
          parseError,
        );
        // Fallback to newline parsing if model didn't output JSON array
        variations = cleanedResponse
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .replace(/[\[\]"]/g, '')
          .split('\n')
          .map((q) => q.trim().replace(/,$/, '')) // Remove trailing commas
          .filter((q) => q.length > 0);
      }

      console.log(
        '[QueryRewriter] Parsed variations before check:',
        variations,
      );

      // Ensure we have variations
      if (!Array.isArray(variations) || variations.length === 0) {
        throw new Error(
          'Failed to extract valid variations. Variations array is empty or invalid.',
        );
      }

      // Filter out overly conversational queries and exact duplicates
      const finalVariations = Array.from(
        new Set([
          // include original question just as a fallback
          originalQuestion,
          ...variations.filter(
            (q) => q.toLowerCase() !== originalQuestion.toLowerCase(),
          ),
        ]),
      );

      console.log('[QueryRewriter] Final variations output:', finalVariations);

      return {
        query_variations: finalVariations,
      };
    } catch (e) {
      console.error(
        '[QueryRewriter] Failed to generate query variations, falling back to original question',
        e,
      );
      return {
        query_variations: [originalQuestion],
      };
    }
  };
};
