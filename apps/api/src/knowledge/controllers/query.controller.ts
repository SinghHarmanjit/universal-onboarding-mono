import { Controller, Post, Body, Sse, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DocsRetrievalService } from '../services/docs_retrieval.service';
import { BusinessRetrievalService } from '../services/business_retrieval.service';
import { createWorkflow } from '../graph/workflow';
import { getLLM } from '../../config/llm';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RetrievalEvent } from '../../models/retrieval_event';

@Controller('query')
export class QueryController {
  private readonly logger = new Logger(QueryController.name);

  constructor(
    private readonly docsRetrievalService: DocsRetrievalService,
    private readonly businessRetrievalService: BusinessRetrievalService,
    @InjectRepository(RetrievalEvent)
    private readonly retrievalEventRepo: Repository<RetrievalEvent>,
    private readonly configService: ConfigService,
  ) { }

  @Post()
  @Sse()
  streamQuery(@Body() body: { question: string }): Observable<any> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          const llm = getLLM(this.configService);
          const workflow = createWorkflow(
            this.docsRetrievalService,
            this.businessRetrievalService,
            this.retrievalEventRepo,
            llm,
          );

          // For LangGraph streamEvents, we need to pass a valid version (e.g. 'v1' or 'v2')
          const stream = await workflow.streamEvents(
            { question: body.question },
            { version: 'v2' },
          );

          for await (const event of stream) {
            // Check for LLM generation streaming events
            if (event.event === 'on_chat_model_stream') {
              const content = event.data?.chunk?.content;
              if (content) {
                subscriber.next({ data: { type: 'chunk', content } });
              }
            } else if (
              event.event === 'on_chain_end' &&
              event.name === 'LangGraph'
            ) {
              // When workflow ends, you can emit the final answer or citations
              const finalState = event.data?.output;
              if (finalState && finalState.citations) {
                subscriber.next({
                  data: { type: 'citations', citations: finalState.citations },
                });
              }
            }
          }

          subscriber.next({ data: { type: 'done' } });
          subscriber.complete();
        } catch (error) {
          this.logger.error('Error streaming query', error);
          subscriber.error(error);
        }
      })();
    });
  }
}
