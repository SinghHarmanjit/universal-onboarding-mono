import { Controller, Post, Body, Logger, InternalServerErrorException } from '@nestjs/common';
import { BusinessIngestService } from '../services/business_ingest.service';
import { BusinessKnowledgeEntry } from '../../models/business_knowledge';

@Controller('business-knowledge')
export class BusinessController {
  private readonly logger = new Logger(BusinessController.name);

  constructor(private readonly businessIngestService: BusinessIngestService) { }

  @Post()
  async ingestBusinessKnowledge(@Body() body: Partial<BusinessKnowledgeEntry>) {
    try {
      const entry =
        await this.businessIngestService.ingestBusinessKnowledge(body);
      return {
        message: 'Business knowledge ingested successfully',
        entryId: entry.id,
      };
    } catch (error) {
      this.logger.error('Error ingesting business knowledge', error);
      throw new InternalServerErrorException('Error ingesting business knowledge');
    }
  }
}
