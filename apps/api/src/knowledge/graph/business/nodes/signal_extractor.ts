import { BusinessState, BusinessSignal } from '../business_state';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StringOutputParser } from '@langchain/core/output_parsers';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';

export const createSignalExtractorNode = (llm: BaseChatModel) => {
  return async (state: BusinessState): Promise<Partial<BusinessState>> => {
    const originalQuestion = state.question;
    const hasHistory = state.messages && state.messages.length > 0;

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are an expert sales intelligence signal extractor.
Your task is to take a user's question (and conversation history) and extract "BusinessSignals" to query our structured business entities database.

We have 9 distinct entity types you can target:
1. industry_use_case
2. pain_pattern
3. industry_benchmark
4. success_story
5. pricing_model
6. revenue_opportunity
7. timeline_pattern
8. competitive_position
9. objection

Guidelines:
1. Extract atleast 2 distinct signals that match the user's intent.
2. For each signal, specify the 'entity_type'.
3. Optionally provide 'keywords' (array of strings) if the user mentions specific terms (e.g. ['Marqeta']).
4. Return ONLY a valid JSON array of objects. Do not include markdown formatting or backticks.

Example Outputs:

User: "How do we compare against Marqeta in terms of launch timeline and cost?"
[
  {{ "entity_type": "competitive_position", "keywords": ["Marqeta"] }},
  {{ "entity_type": "timeline_pattern", "keywords": ["launch timeline"] }},
  {{ "entity_type": "pricing_model", "keywords": ["cost"] }}
]

User: "Do you have case studies for fintech lenders looking to reduce fraud?"
[
  {{ "entity_type": "success_story", "keywords": ["case studies"] }},
  {{ "entity_type": "industry_use_case", "keywords": ["fintech lenders"] }},
  {{ "entity_type": "pain_pattern", "keywords": ["reduce fraud"] }}
]

User: "What's the typical ROI or revenue uplift for neo-banks?"
[
  {{ "entity_type": "revenue_opportunity", "keywords": ["ROI", "revenue uplift"] }},
  {{ "entity_type": "industry_benchmark", "keywords": ["neo-banks"] }}
]
`,
      ],
      ...(hasHistory ? [new MessagesPlaceholder('messages')] : []),
      [
        'human',
        "{question}\n\nReminder: Extract BusinessSignals and output ONLY a valid JSON array of objects. Do not answer the user's query or include conversational text.",
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
      console.log('[SignalExtractor] Raw LLM response:', response);

      let cleanedResponse = response;
      if (cleanedResponse.includes('<think>') && !cleanedResponse.includes('</think>')) {
        cleanedResponse = cleanedResponse.replace(/<think>[\s\S]*/, '');
      } else {
        cleanedResponse = cleanedResponse.replace(/<think>[\s\S]*?<\/think>/g, '');
      }
      cleanedResponse = cleanedResponse.trim();

      let signals: BusinessSignal[] = [];
      try {
        const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
        let strToParse = jsonMatch ? jsonMatch[0] : cleanedResponse;
        
        // Fix trailing commas in objects and arrays
        strToParse = strToParse.replace(/,\s*([\]}])/g, '$1');
        
        signals = JSON.parse(strToParse);
      } catch (parseError) {
        console.log(
          '[SignalExtractor] JSON parse failed, using regex fallback:',
          parseError instanceof Error ? parseError.message : String(parseError),
        );
        
        // Fallback: try to extract individual JSON objects using regex
        const objectMatches = cleanedResponse.match(/\{[^{}]+\}/g);
        if (objectMatches) {
          for (const objStr of objectMatches) {
            try {
              const fixedObjStr = objStr.replace(/,\s*\}/g, '}');
              const parsed = JSON.parse(fixedObjStr);
              if (parsed && parsed.entity_type) {
                signals.push(parsed as BusinessSignal);
              }
            } catch (e) {
              // Ignore invalid individual objects
            }
          }
        }
      }

      if (!Array.isArray(signals)) {
        signals = [];
      }

      console.log('[SignalExtractor] Final extracted signals:', signals);

      return {
        signals,
      };
    } catch (e) {
      console.error('[SignalExtractor] Failed to extract signals', e);
      return {
        signals: [],
      };
    }
  };
};
