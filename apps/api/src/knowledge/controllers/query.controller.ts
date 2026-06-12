import { Controller, Post, Body, Logger } from '@nestjs/common';
import { QueryService } from '../services/query.service';
import { BaseMessage } from '@langchain/core/messages';

@Controller('query')
export class QueryController {
  private readonly logger = new Logger(QueryController.name);

  constructor(private readonly queryService: QueryService) {}

  @Post()
  async query(@Body() body: { question: string; messages?: BaseMessage[] }) {
    try {
      const result = await this.queryService.processQuery(
        body.question,
        body.messages,
      );

      return {
        answer: result.answer,
        open_questions: result.open_questions,
        citations: result.citations,
        messages: result.messages,
      };
    } catch (error) {
      this.logger.error('Error executing query', error);
      throw error;
    }
  }
}
