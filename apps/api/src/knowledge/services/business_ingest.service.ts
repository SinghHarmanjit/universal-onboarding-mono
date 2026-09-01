import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessKnowledgeEntry } from '../../models/business_knowledge';
import { BusinessEntity } from '../../models/business_entity';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import {
  NOMIC_EMBEDDING_DIMENSIONS,
  NOMIC_EMBEDDING_MODEL_NAME,
} from '../constants/embedding';
import { getLLM } from '../../config/llm';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser, JsonOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';

@Injectable()
export class BusinessIngestService {
  private readonly logger = new Logger(BusinessIngestService.name);
  private readonly embeddings: OpenAIEmbeddings;

  constructor(
    @InjectRepository(BusinessKnowledgeEntry)
    private readonly businessRepository: Repository<BusinessKnowledgeEntry>,
    @InjectRepository(BusinessEntity)
    private readonly entityRepository: Repository<BusinessEntity>,
    private readonly configService: ConfigService,
  ) {
    const baseUrl = this.configService.get<string>(
      'EMBEDDING_BASE_URL',
      'http://localhost:8000/v1',
    );
    this.embeddings = new OpenAIEmbeddings({
      modelName: NOMIC_EMBEDDING_MODEL_NAME,
      configuration: {
        baseURL: baseUrl,
      },
      openAIApiKey: 'not-needed',
      encodingFormat: 'float',
    });
  }

  async ingestBusinessKnowledge(
    data: Partial<BusinessKnowledgeEntry>,
  ): Promise<BusinessKnowledgeEntry> {
    this.logger.log(`Ingesting business knowledge: ${data.title}`);

    // Validate expiration if provided (though handled by schema natively)
    if (data.expiration_date && new Date(data.expiration_date) < new Date()) {
      this.logger.warn(`Ingesting expired business knowledge: ${data.title}`);
    }

    let embeddingVector: number[] = [];
    try {
      if (data.content) {
        embeddingVector = await this.embeddings.embedQuery(`search_document: ${data.content}`);
        if (embeddingVector.length > NOMIC_EMBEDDING_DIMENSIONS) {
          embeddingVector = embeddingVector.slice(
            0,
            NOMIC_EMBEDDING_DIMENSIONS,
          );
        }
      }
    } catch (err) {
      this.logger.error(
        `Error generating embedding for business knowledge:`,
        err,
      );
      throw err;
    }

    const entry = this.businessRepository.create({
      importance_score: 1.0,
      review_ownership: 'System',
      ...data,
      embedding: `[${embeddingVector.join(',')}]`,
      embedding_model: NOMIC_EMBEDDING_MODEL_NAME,
      version: 1,
      approval_status: data.approval_status || 'PENDING',
    });

    const savedEntry = await this.businessRepository.save(entry);
    this.logger.log(
      `Successfully ingested business knowledge ${savedEntry.id}.`,
    );

    return savedEntry;
  }

  async processAndIngestBusinessDocument(
    data: Partial<BusinessKnowledgeEntry>,
  ): Promise<BusinessKnowledgeEntry[]> {
    const content = data.content || '';
    // Split content by markdown h2 headers (## ) to chunk it.
    const chunks = content.split(/(?=^## )/gm).filter(c => c.trim().length > 0);

    if (chunks.length === 0) {
      chunks.push(content);
    }

    const llm = getLLM(this.configService);
    const parser = new StringOutputParser();
    const prompt = PromptTemplate.fromTemplate(`
You are an expert sales AI categorizing business documentation.
Analyze the following text chunk and extract the relevant MEDDIC sales framework categories it addresses.
MEDDIC stands for: Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion.
Reply with ONLY a comma-separated list of the categories present (e.g. "Identify Pain, Decision Criteria"). If none apply, reply "None".

Text Chunk:
{text}
`);
    const chain = prompt.pipe(llm).pipe(parser);

    const savedEntries: BusinessKnowledgeEntry[] = [];

    let chunkIndex = 1;
    for (const chunk of chunks) {
      this.logger.log(`Extracting MEDDIC metadata for chunk ${chunkIndex} of ${data.title}`);
      let meddicCategory = 'None';
      try {
        meddicCategory = await chain.invoke({ text: chunk });
      } catch (err: any) {
        this.logger.warn(`Failed to extract MEDDIC for chunk: ${err.message}`);
      }

      const chunkData: Partial<BusinessKnowledgeEntry> = {
        ...data,
        title: chunks.length > 1 ? `${data.title} (Part ${chunkIndex})` : data.title,
        content: chunk.trim(),
        metadata: {
          ...(data.metadata || {}),
          meddic_category: meddicCategory.trim(),
        },
      };

      const entry = await this.ingestBusinessKnowledge(chunkData);
      savedEntries.push(entry);

      // Extract entities
      await this.extractAndIngestEntitiesForBusinessKnowledge(entry);

      chunkIndex++;
    }

    return savedEntries;
  }

  async extractEntitiesForDocumentId(id: string): Promise<BusinessEntity[]> {
    const entry = await this.businessRepository.findOne({ where: { id } });
    if (!entry) {
      throw new Error(`BusinessKnowledgeEntry with id ${id} not found`);
    }
    return this.extractAndIngestEntitiesForBusinessKnowledge(entry);
  }

  async extractAndIngestEntitiesForBusinessKnowledge(entry: BusinessKnowledgeEntry): Promise<BusinessEntity[]> {
    this.logger.log(`Extracting business entities for entry ${entry.id}`);
    const llm = getLLM(this.configService);

    const EntitySchema = z.object({
      entity_type: z.string().describe('The type of entity (e.g. industry_use_case, pain_pattern, etc.)'),
      entity_name: z.string().describe('The name of the entity'),
      attributes: z.record(z.string(), z.any()).describe('The key-value attributes associated with this entity based on its type'),
    });

    const ExtractionSchema = z.object({
      entities: z.array(EntitySchema),
    });

    const savedEntities: BusinessEntity[] = [];

    try {
      const parser = new JsonOutputParser<z.infer<typeof ExtractionSchema>>();
      const extractionPrompt = `You are an expert sales AI analyzing business documentation.
Extract any business entities from the following text chunk. Only extract facts explicitly supported by the source.
Prefer structured values over free text. Generate multiple entities if multiple concepts exist.

CRITICAL: Return ONLY valid JSON matching the schema below. DO NOT wrap the response in markdown code blocks (e.g. no \`\`\`json). Start your response directly with { and end with }.

Expected JSON schema:
{
  "entities": [
    {
      "entity_type": "The type of entity (e.g. industry_use_case, pain_pattern, etc.)",
      "entity_name": "The name of the entity",
      "attributes": { ...key-value pairs... }
    }
  ]
}

Valid entity types and their expected attribute structures:

1. industry_use_case
Represents a common industry workflow where the product creates value.
{
  "industry": "Target industry",
  "sub_industry": "Optional niche",
  "persona_targets": ["Relevant buyers"],
  "current_state": ["Current approach"],
  "pain_points": ["Business pains"],
  "solution": ["Product solution"],
  "product_features": ["Relevant features"],
  "business_outcomes": ["Expected outcomes"]
}

2. pain_pattern
Represents a recurring operational or commercial problem.
{
  "industry": "Industry",
  "pain_name": "Short pain name",
  "description": "Pain summary",
  "symptoms": ["Observable symptoms"],
  "affected_teams": ["Teams impacted"],
  "severity": "low|medium|high",
  "current_alternatives": ["How they solve it today"],
  "solution": "Recommended solution"
}

3. industry_benchmark
Represents measurable industry performance data.
{
  "industry": "Industry",
  "metric": "Metric name",
  "value": "Primary value",
  "unit": "Unit",
  "low": "Optional lower bound",
  "high": "Optional upper bound",
  "before": "Optional baseline",
  "after": "Optional improved state",
  "benchmark_type": "fraud|cost|revenue|efficiency|operations",
  "source_confidence": "high|medium|low"
}

4. success_story
Represents a customer outcome.
{
  "industry": "Industry",
  "customer_type": "Customer segment",
  "customer_size": "Startup|SMB|MidMarket|Enterprise",
  "pain_points": ["Original pains"],
  "solution": ["Implemented solution"],
  "implementation_weeks": 0,
  "outcomes": {
    "metric_name": "value"
  },
  "business_results": ["Business outcomes"]
}

5. pricing_model
Represents commercial structures.
{
  "pricing_type": "Revenue Share|SaaS|Transaction Fee",
  "best_fit": ["Suitable customer types"],
  "minimum_scale": {
    "metric": "value"
  },
  "advantages": ["Advantages"],
  "disadvantages": ["Disadvantages"],
  "revenue_drivers": ["Drivers"],
  "commercial_notes": ["Notes"]
}

6. revenue_opportunity
Represents new revenue creation.
{
  "industry": "Industry",
  "revenue_source": "Interchange|Subscription|Float",
  "description": "Revenue explanation",
  "qualifying_signals": ["Signals prospect is eligible"],
  "economic_buyer_relevance": "low|medium|high",
  "revenue_drivers": ["What increases revenue"]
}

7. timeline_pattern
Represents implementation or delivery expectations.
{
  "industry": "Industry",
  "project_type": "Project category",
  "typical_duration_weeks": 0,
  "minimum_duration_weeks": 0,
  "maximum_duration_weeks": 0,
  "dependencies": ["Key dependencies"],
  "risk_factors": ["Delay factors"],
  "accelerators": ["Factors speeding delivery"]
}

8. competitive_position
Represents competitive intelligence.
{
  "competitor": "Competitor name",
  "industry": "Industry",
  "competitor_strengths": ["Strengths"],
  "our_advantages": ["Advantages"],
  "our_weaknesses": ["Weaknesses if documented"],
  "replacement_triggers": ["Reasons prospects switch"],
  "proof_points": ["Supporting evidence"]
}

9. objection
Represents a known objection and response strategy.
{
  "objection_type": "pricing|implementation|security|compliance",
  "buyer_persona": "Relevant persona",
  "sales_stage": "discovery|evaluation|procurement",
  "objection_text": "Typical objection",
  "root_cause": "Underlying concern",
  "response_strategy": ["Recommended actions"],
  "supporting_assets": ["Related entity names"],
  "severity": "low|medium|high"
}

Text Chunk:
${entry.content}`;

      const result = await parser.invoke(await llm.invoke(extractionPrompt));

      for (const e of result.entities) {
        const contentToEmbed = `Entity Name: ${e.entity_name}\nType: ${e.entity_type}\nAttributes: ${JSON.stringify(e.attributes)}`;
        let embeddingVector: number[] = [];
        try {
          embeddingVector = await this.embeddings.embedQuery(`search_document: ${contentToEmbed}`);
          if (embeddingVector.length > NOMIC_EMBEDDING_DIMENSIONS) {
            embeddingVector = embeddingVector.slice(0, NOMIC_EMBEDDING_DIMENSIONS);
          }
        } catch (err) {
          this.logger.error(`Error embedding entity ${e.entity_name}`, err);
        }

        const businessEntity = this.entityRepository.create({
          business_knowledge_entry_id: entry.id,
          entity_type: e.entity_type,
          entity_name: e.entity_name,
          attributes: e.attributes,
          embedding: embeddingVector.length ? `[${embeddingVector.join(',')}]` : undefined,
        });
        const savedEntity = await this.entityRepository.save(businessEntity);
        savedEntities.push(savedEntity);
        this.logger.log(`Saved entity ${e.entity_name} of type ${e.entity_type}`);
      }
    } catch (err: any) {
      this.logger.warn(`Failed to extract entities for entry ${entry.id}: ${err.message}`);
    }

    return savedEntities;
  }
}
