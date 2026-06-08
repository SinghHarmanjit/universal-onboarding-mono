import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessKnowledgeEntry } from '../../models/business_knowledge';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import {
  NOMIC_EMBEDDING_DIMENSIONS,
  NOMIC_EMBEDDING_MODEL_NAME,
} from '../constants/embedding';

@Injectable()
export class BusinessIngestService {
  private readonly logger = new Logger(BusinessIngestService.name);
  private readonly embeddings: OpenAIEmbeddings;

  constructor(
    @InjectRepository(BusinessKnowledgeEntry)
    private readonly businessRepository: Repository<BusinessKnowledgeEntry>,
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
        embeddingVector = await this.embeddings.embedQuery(data.content);
        if (embeddingVector.length > NOMIC_EMBEDDING_DIMENSIONS) {
          embeddingVector = embeddingVector.slice(0, NOMIC_EMBEDDING_DIMENSIONS);
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
}
