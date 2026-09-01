import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ProspectFact } from '../../models/prospect_fact';
import { getLLM } from '../../config/llm';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';

@Injectable()
export class FactExtractionAgentService {
  private readonly logger = new Logger(FactExtractionAgentService.name);

  constructor(
    @InjectRepository(ProspectFact)
    private readonly prospectFactRepo: Repository<ProspectFact>,
    private readonly configService: ConfigService,
  ) { }

  async processFactExtraction(
    prospectId: string,
    userMessage: string,
    chatHistory: any[] = [],
    sourceMessageId?: string,
  ) {
    try {
      const llm = getLLM(this.configService);

      const hasHistory = chatHistory && chatHistory.length > 0;

      let historyText = '';
      if (hasHistory) {
        // Keep the last 4 messages for context to keep the prompt focused
        const recentHistory = chatHistory.slice(-4);
        historyText = recentHistory.map(msg => {
          const role = (msg.type === 'human' || msg.role === 'user') ? 'User' : 'Sales Agent';
          return `${role}: ${msg.content}`;
        }).join('\n\n');
      }

      const prompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          `You are an internal background Fact Extraction Agent.
Your job is to analyze the conversation between a Sales Agent and a User, and extract structured business and sales facts from the User's statements.
Extract facts related to current providers, metrics, volume, pain points, timeline, industry, integration needs, etc.

For each extracted fact, provide:
1. fact_type: e.g., "current_provider", "metric", "pain_point", "industry"
2. fact_key: A normalized key representing the fact, e.g., "provider_name", "monthly_volume", "industry_type".
3. fact_value: A JSON object containing the detailed values.
4. confidence: A number between 0 and 100 representing how confident you are in this fact.

If the user statement does not contain any relevant facts (e.g., just asking a general question, greetings), return "is_relevant": false.

Expected JSON Structure:
{{
  "is_relevant": true,
  "facts": [
    {{
      "fact_type": "current_provider",
      "fact_key": "provider_name",
      "fact_value": {{ "provider_name": "Marqeta" }},
      "confidence": 95
    }},
    {{
      "fact_type": "metric",
      "fact_key": "monthly_volume",
      "fact_value": {{ "value": 40000000, "currency": "USD" }},
      "confidence": 90
    }}
  ]
}}

Return ONLY a valid JSON object matching the above structure. Do not include markdown formatting or backticks.`,
        ],
        [
          'human',
          `${hasHistory ? `Recent Conversation Context:\n${historyText}\n\n---\n` : ''}User's Latest Statement:
{question}

---
CRITICAL REMINDER: You are a background Fact Extraction Agent analyzing the transcript, NOT the conversational Sales Agent. DO NOT respond to the user or continue the conversation. You MUST ONLY return a valid JSON object matching the requested structure. No other text, no markdown, no explanation.`,
        ],
      ]);

      const chain = prompt.pipe(llm).pipe(new StringOutputParser());

      const response = await chain.invoke({
        question: userMessage,
      });

      this.logger.debug(`Raw LLM response: ${response}`);

      let cleanedResponse = response
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const startIndex = cleanedResponse.indexOf('{');
      const endIndex = cleanedResponse.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1) {
        cleanedResponse = cleanedResponse.substring(startIndex, endIndex + 1);
      }

      let parsed;
      try {
        parsed = JSON.parse(cleanedResponse);
      } catch (e) {
        this.logger.error(`Failed to parse JSON. Cleaned response: ${cleanedResponse}`);
        throw e;
      }

      if (parsed.is_relevant && parsed.facts && Array.isArray(parsed.facts)) {
        for (const fact of parsed.facts) {
          const newFact = this.prospectFactRepo.create({
            prospect_id: prospectId,
            fact_type: fact.fact_type,
            fact_key: fact.fact_key,
            fact_value: fact.fact_value,
            confidence: fact.confidence,
            source_message_id: sourceMessageId,
          });
          await this.prospectFactRepo.save(newFact);
        }
        return {
          is_relevant: true,
          extracted_facts_count: parsed.facts.length,
        };
      } else {
        this.logger.log(
          `Message discarded by Fact Extraction agent (irrelevant): ${userMessage}`,
        );
        return { is_relevant: false, extracted_facts_count: 0 };
      }
    } catch (error) {
      this.logger.error('Error in processFactExtraction', error);
      throw error;
    }
  }
}
