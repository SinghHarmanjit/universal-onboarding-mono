import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupervisorController } from './controllers/supervisor.controller';
import { SupervisorService } from './services/supervisor.service';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { ProspectModule } from '../prospect/prospect.module';
import { RetrievalEvent } from '../models/retrieval_event';
import { Citation } from '../models/citation';
import { DocumentationDocument } from '../models/document';
import { ProspectFact } from '../models/prospect_fact';
import { Prospect } from '../models/prospect';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RetrievalEvent,
      Citation,
      DocumentationDocument,
      ProspectFact,
      Prospect,
    ]),
    KnowledgeModule,
    ProspectModule,
  ],
  controllers: [SupervisorController],
  providers: [SupervisorService],
})
export class AgentsModule {}
