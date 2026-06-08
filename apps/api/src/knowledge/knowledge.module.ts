import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryController } from './controllers/query.controller';
import { DocsController } from './controllers/docs.controller';
import { BusinessController } from './controllers/business.controller';
import { ObservabilityController } from './controllers/observability.controller';
import { DocsIngestService } from './services/docs_ingest.service';
import { DocsRetrievalService } from './services/docs_retrieval.service';
import { BusinessIngestService } from './services/business_ingest.service';
import { BusinessRetrievalService } from './services/business_retrieval.service';
import { DocumentationDocument } from '../models/document';
import { DocumentationChunk } from '../models/chunk';
import { BusinessKnowledgeEntry } from '../models/business_knowledge';
import { ActionLog } from '../models/action_log';
import { RetrievalEvent } from '../models/retrieval_event';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DocumentationDocument,
      DocumentationChunk,
      BusinessKnowledgeEntry,
      ActionLog,
      RetrievalEvent,
    ]),
    ConfigModule,
  ],
  controllers: [
    QueryController,
    DocsController,
    BusinessController,
    ObservabilityController,
  ],
  providers: [
    DocsIngestService,
    DocsRetrievalService,
    BusinessIngestService,
    BusinessRetrievalService,
  ],
})
export class KnowledgeModule {}
