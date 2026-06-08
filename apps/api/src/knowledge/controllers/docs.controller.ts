import {
  Controller,
  Post,
  Body,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { DocsIngestService } from '../services/docs_ingest.service';

@Controller('documents')
export class DocsController {
  private readonly logger = new Logger(DocsController.name);

  constructor(private readonly docsIngestService: DocsIngestService) {}

  @Post()
  async ingestDocument(@Body() body: { source_url: string }) {
    try {
      const docOrDocs = await this.docsIngestService.ingestDocument(
        body.source_url,
      );

      if (Array.isArray(docOrDocs)) {
        return {
          message: 'Documents ingested successfully',
          documentIds: docOrDocs.map((doc) => doc.id),
        };
      }

      return {
        message: 'Document ingested successfully',
        documentId: docOrDocs.id,
      };
    } catch (error) {
      this.logger.error('Error ingesting document', error);
      throw new InternalServerErrorException('Error ingesting document');
    }
  }
}
