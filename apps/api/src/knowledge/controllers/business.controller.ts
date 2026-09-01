import {
  Controller,
  Post,
  Body,
  Logger,
  InternalServerErrorException,
  Param,
} from '@nestjs/common';
import { BusinessIngestService } from '../services/business_ingest.service';
import { BusinessKnowledgeEntry } from '../../models/business_knowledge';

@Controller('business-knowledge')
export class BusinessController {
  private readonly logger = new Logger(BusinessController.name);

  constructor(private readonly businessIngestService: BusinessIngestService) {}

  @Post()
  async ingestBusinessKnowledge(@Body() body: Partial<BusinessKnowledgeEntry>) {
    try {
      const entries =
        await this.businessIngestService.processAndIngestBusinessDocument(body);
      return {
        message: 'Business knowledge processed and ingested successfully',
        entryIds: entries.map((e) => e.id),
      };
    } catch (error) {
      this.logger.error('Error ingesting business knowledge', error);
      throw new InternalServerErrorException(
        'Error ingesting business knowledge',
      );
    }
  }

  @Post(':id/entities')
  async extractEntities(@Param('id') id: string) {
    try {
      const entities =
        await this.businessIngestService.extractEntitiesForDocumentId(id);
      return {
        message: 'Business entities extracted successfully',
        entityIds: entities.map((e) => e.id),
      };
    } catch (error) {
      this.logger.error(`Error extracting business entities for document ${id}`, error);
      throw new InternalServerErrorException(
        'Error extracting business entities',
      );
    }
  }
}
