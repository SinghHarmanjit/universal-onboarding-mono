import { ProductState } from '../product_state';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StringOutputParser } from '@langchain/core/output_parsers';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';

export const createQueryRewriterNode = (llm: BaseChatModel) => {
  return async (state: ProductState): Promise<Partial<ProductState>> => {
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
      [
        'human',
        '{question}\n\nReminder: Output ONLY a valid JSON array of strings containing the query variations. Do not answer the question or include conversational text.',
      ],
    ]);

    const chain = prompt.pipe(llm).pipe(new StringOutputParser());

    try {
      // Only take the last 4 messages for immediate context to prevent polluting the prompt with older topics
      const recentMessages = hasHistory ? state.messages.slice(-4) : [];

      const response = await chain.invoke({
        question: originalQuestion,
        ...(hasHistory && { messages: recentMessages }),
      });
      console.log('[QueryRewriter] Raw LLM response:', response);

      let cleanedResponse = response;
      if (cleanedResponse.includes('<think>') && !cleanedResponse.includes('</think>')) {
        cleanedResponse = cleanedResponse.replace(/<think>[\s\S]*/, '');
      } else {
        cleanedResponse = cleanedResponse.replace(/<think>[\s\S]*?<\/think>/g, '');
      }
      cleanedResponse = cleanedResponse.trim();

      console.log('[QueryRewriter] Cleaned response:', cleanedResponse);

      let variations: string[] = [];
      try {
        // Attempt to extract JSON array if there's surrounding text
        const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
        let strToParse = jsonMatch ? jsonMatch[0] : cleanedResponse;
        
        // Fix trailing commas in array
        strToParse = strToParse.replace(/,\s*\]/g, ']');
        
        variations = JSON.parse(strToParse);
      } catch (parseError) {
        console.log(
          '[QueryRewriter] JSON parse failed, using fallback:',
          parseError instanceof Error ? parseError.message : String(parseError),
        );
        
        // Better fallback parsing
        const textWithoutMarkdown = cleanedResponse.replace(/```json/gi, '').replace(/```/g, '');
        
        // 1. Try to find quoted strings directly
        const quotedStrings = [...textWithoutMarkdown.matchAll(/"([^"]+)"/g)].map(m => m[1]);
        if (quotedStrings.length > 0) {
          variations = quotedStrings;
        } else {
          // 2. Fallback to newline parsing, removing list numbers/bullets
          variations = textWithoutMarkdown
            .split('\n')
            .map((q) => q.trim().replace(/^-\s*/, '').replace(/^\d+\.\s*/, '').replace(/[\[\]"]/g, '').replace(/,$/, ''))
            .filter((q) => q.length > 0 && !q.toLowerCase().startsWith('here are'));
        }
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
