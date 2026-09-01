import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prospect } from '../models/prospect';
import { ProspectMeddic } from '../models/prospect_meddic';
import { ProspectFact } from '../models/prospect_fact';
import { ChatSession } from '../models/chat_session';
import { ChatMessage } from '../models/chat_message';
import { MeddicAgentService } from './services/meddic_agent.service';
import { FactExtractionAgentService } from './services/fact_extraction_agent.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Prospect,
      ProspectMeddic,
      ProspectFact,
      ChatSession,
      ChatMessage,
    ]),
  ],
  providers: [MeddicAgentService, FactExtractionAgentService],
  exports: [MeddicAgentService, FactExtractionAgentService],
})
export class ProspectModule {}
