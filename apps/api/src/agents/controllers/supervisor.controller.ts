import { Controller, Post, Body, Logger } from '@nestjs/common';
import { SupervisorService } from '../services/supervisor.service';
import { BaseMessage } from '@langchain/core/messages';

@Controller('supervisor')
export class SupervisorController {
  private readonly logger = new Logger(SupervisorController.name);

  constructor(private readonly supervisorService: SupervisorService) {}

  @Post()
  async query(
    @Body() body: { prospectId?: string; question: string; messages?: BaseMessage[] }
  ) {
    try {
      const result = await this.supervisorService.processQuery(
        body.prospectId,
        body.question,
        body.messages,
      );

      return {
        answer: result.answer,
        facts: result.facts,
        meddic: result.meddic,
        prospectId: result.prospectId,
        citations: result.citations,
        messages: result.messages,
      };
    } catch (error) {
      this.logger.error('Error executing query', error);
      throw error;
    }
  }
}
