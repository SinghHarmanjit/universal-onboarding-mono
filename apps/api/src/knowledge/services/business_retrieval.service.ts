import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, IsNull } from 'typeorm';
import { BusinessKnowledgeEntry } from '../../models/business_knowledge';
import { BusinessEntity } from '../../models/business_entity';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import {
  NOMIC_EMBEDDING_DIMENSIONS,
  NOMIC_EMBEDDING_MODEL_NAME,
} from '../constants/embedding';

@Injectable()
export class BusinessRetrievalService {
  private readonly logger = new Logger(BusinessRetrievalService.name);
  private readonly embeddings: OpenAIEmbeddings;

  constructor(
    @InjectRepository(BusinessKnowledgeEntry)
    private readonly businessRepository: Repository<BusinessKnowledgeEntry>,
    @InjectRepository(BusinessEntity)
    private readonly businessEntityRepository: Repository<BusinessEntity>,
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

  async retrieveRelevantKnowledge(
    query: string,
    limit: number = 3,
  ): Promise<BusinessKnowledgeEntry[]> {
    this.logger.log(`Retrieving business knowledge for query: "${query}"`);

    let queryEmbedding: number[] = [];
    try {
      queryEmbedding = await this.embeddings.embedQuery(
        `search_query: ${query}`,
      );
      if (queryEmbedding.length > NOMIC_EMBEDDING_DIMENSIONS) {
        queryEmbedding = queryEmbedding.slice(0, NOMIC_EMBEDDING_DIMENSIONS);
      }
    } catch (err) {
      this.logger.error(`Error generating embedding for query:`, err);
      throw err;
    }

    const embeddingString = `[${queryEmbedding.join(',')}]`;

    // Retrieve active business knowledge that hasn't expired
    const currentDate = new Date();

    const entries = await this.businessRepository
      .createQueryBuilder('bk')
      // Ensure it's not expired
      .where(
        'bk.expiration_date IS NULL OR bk.expiration_date >= :currentDate',
        { currentDate },
      )
      .orderBy(`bk.embedding <=> '${embeddingString}'`, 'ASC')
      .limit(limit)
      .getMany();

    return entries;
  }

  async retrieveEntities(
    entityTypes: string[],
    limit: number = 5,
  ): Promise<BusinessEntity[]> {
    this.logger.log(`Retrieving business entities of types: ${entityTypes.join(', ')}`);
    if (!entityTypes || entityTypes.length === 0) {
      return [];
    }

    const entities = await this.businessEntityRepository
      .createQueryBuilder('be')
      .where('be.entity_type IN (:...entityTypes)', { entityTypes })
      .limit(limit)
      .getMany();

    return entities;
  }
}
