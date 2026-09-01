import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StringOutputParser } from '@langchain/core/output_parsers';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { MeddicState } from '../meddic_state';

export const createMeddicExtractorNode = (llm: BaseChatModel) => {
  return async (state: MeddicState): Promise<Partial<MeddicState>> => {
    const originalQuestion = state.question;
    const hasHistory = state.messages && state.messages.length > 0;
    const currentMeddic = state.current_meddic || {};

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a specialized MEDDIC extraction agent for a sales process.
Your job is to analyze the user's latest message (and conversation history) and extract any relevant MEDDIC information to build the prospect's profile.

MEDDIC Fields:
- metrics: Expected ROI, cost savings, usage volumes
- economic_buyer: Decision maker, budget owner
- decision_criteria: Security, pricing, integrations
- decision_process: Procurement process, timeline steps
- identified_pain: Current challenges, pain points
- champion: Internal advocate
- timeline: Expected launch date or evaluation timeframe
- budget: Available funds or budget constraints

Instructions:
1. Determine if the user's latest message contains ANY information relevant to building the MEDDIC profile. If it's a completely unrelated technical question, set "is_relevant" to false.
2. If relevant, extract any new facts into the respective MEDDIC fields. Represent each field as a JSON object of key-value pairs.
3. Merge this with the current MEDDIC state provided below:
CURRENT MEDDIC STATE:
{current_meddic}

4. Calculate a "completeness_score" from 0 to 100 based on how many fields have substantial information.
5. Determine the highest-value, lowest-confidence missing area in the profile, and formulate a "suggested_question" to ask the user next.
6. Return ONLY a valid JSON object matching the following structure. Do not include markdown formatting or backticks.

Expected JSON Structure:
{{
  "is_relevant": true,
  "extracted_meddic": {{
    "metrics": {{ "current_volume": "40M" }},
    "economic_buyer": {{}},
    "decision_criteria": {{}},
    "decision_process": {{}},
    "identified_pain": {{}},
    "champion": {{}},
    "timeline": {{}},
    "budget": {{}}
  }},
  "completeness_score": 25,
  "suggested_question": "Can you share what metrics you'll use to measure success?"
}}`,
      ],
      ...(hasHistory ? [new MessagesPlaceholder('messages')] : []),
      ['human', '{question}'],
    ]);

    const chain = prompt.pipe(llm).pipe(new StringOutputParser());

    try {
      const response = await chain.invoke({
        question: originalQuestion,
        current_meddic: JSON.stringify(currentMeddic, null, 2),
        ...(hasHistory && { messages: state.messages }),
      });

      console.log('[MeddicExtractor] Raw LLM response:', response);

      const cleanedResponse = response
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      console.log('[MeddicExtractor] Cleaned response:', cleanedResponse);

      const parsed = JSON.parse(cleanedResponse);

      return {
        is_relevant: parsed.is_relevant ?? false,
        extracted_meddic: parsed.extracted_meddic || {},
        completeness_score: parsed.completeness_score || 0,
        suggested_question: parsed.suggested_question || '',
      };
    } catch (e) {
      console.error('[MeddicExtractor] Failed to extract MEDDIC state', e);
      return {
        is_relevant: false,
        extracted_meddic: {},
        completeness_score: 0,
        suggested_question: '',
      };
    }
  };
};
