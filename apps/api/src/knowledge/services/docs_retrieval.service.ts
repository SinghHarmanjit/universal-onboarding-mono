import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentationChunk } from '../../models/chunk';
import { OpenAIEmbeddings } from '@langchain/openai';
import {
  NOMIC_EMBEDDING_DIMENSIONS,
  NOMIC_EMBEDDING_MODEL_NAME,
} from '../constants/embedding';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DocsRetrievalService {
  private readonly logger = new Logger(DocsRetrievalService.name);
  private readonly embeddings: OpenAIEmbeddings;

  constructor(
    @InjectRepository(DocumentationChunk)
    private readonly chunkRepository: Repository<DocumentationChunk>,
    private readonly configService: ConfigService,
  ) {
    const baseUrl = this.configService.get<string>('EMBEDDING_BASE_URL');
    this.embeddings = new OpenAIEmbeddings({
      modelName: NOMIC_EMBEDDING_MODEL_NAME,
      configuration: {
        baseURL: baseUrl,
      },
      openAIApiKey: 'not-needed',
      encodingFormat: 'float',
    });
  }

  async retrieveSimilarChunks(
    query: string,
    limit: number = 5,
  ): Promise<DocumentationChunk[]> {
    this.logger.log(`Retrieving chunks for query: "${query}"`);

    let queryEmbedding: number[] = [];
    try {
      queryEmbedding = await this.embeddings.embedQuery(
        `search_query: ${query}`,
      );
      // Ensure we truncate to the exact dimension needed by Postgres
      // Nomic Embed Text v1.5 is a Matryoshka model, so we can just slice it
      if (queryEmbedding.length > NOMIC_EMBEDDING_DIMENSIONS) {
        queryEmbedding = queryEmbedding.slice(0, NOMIC_EMBEDDING_DIMENSIONS);
      }
    } catch (err) {
      this.logger.error(`Error generating embedding for query:`, err);
      throw err;
    }

    const embeddingString = `[${queryEmbedding.join(',')}]`;

    // pgvector similarity search (<-> is L2 distance, <= > is cosine similarity, <#> is inner product)
    // Here we use cosine similarity (<=>) and order ascending
    const chunks = await this.chunkRepository
      .createQueryBuilder('chunk')
      .leftJoinAndSelect('chunk.document', 'document')
      .orderBy(`chunk.embedding <=> '${embeddingString}'`, 'ASC')
      .limit(limit)
      .getMany();

    return chunks;
  }
}
