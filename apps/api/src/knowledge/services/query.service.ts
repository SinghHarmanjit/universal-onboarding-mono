import { Injectable, Logger } from '@nestjs/common';
import { DocsRetrievalService } from './docs_retrieval.service';
import { BusinessRetrievalService } from './business_retrieval.service';
import { createWorkflow } from '../graph/workflow';
import { getLLM } from '../../config/llm';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RetrievalEvent } from '../../models/retrieval_event';
import { Citation } from '../../models/citation';
import { DocumentationDocument } from '../../models/document';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

  constructor(
    private readonly docsRetrievalService: DocsRetrievalService,
    private readonly businessRetrievalService: BusinessRetrievalService,
    @InjectRepository(RetrievalEvent)
    private readonly retrievalEventRepo: Repository<RetrievalEvent>,
    @InjectRepository(Citation)
    private readonly citationRepo: Repository<Citation>,
    @InjectRepository(DocumentationDocument)
    private readonly documentRepo: Repository<DocumentationDocument>,
    private readonly configService: ConfigService,
  ) {}

  async processQuery(question: string, messages?: BaseMessage[]) {
    try {
      const llm = getLLM(this.configService);
      const workflow = createWorkflow(
        this.docsRetrievalService,
        this.businessRetrievalService,
        this.retrievalEventRepo,
        llm,
      );

      // We generate a query_id to link Citations together
      const queryId = uuidv4();

      // Convert incoming message objects to LangChain message classes
      // Ensure strict alternation (Human -> AI -> Human -> AI) to prevent LLM API errors
      const langchainMessages: BaseMessage[] = [];
      let nextExpected = 'human';

      for (const msg of (messages as any[]) || []) {
        const isHuman = msg.type === 'human' || msg.role === 'user';

        if (isHuman && nextExpected === 'human') {
          langchainMessages.push(new HumanMessage(msg.content));
          nextExpected = 'ai';
        } else if (!isHuman && nextExpected === 'ai') {
          langchainMessages.push(new AIMessage(msg.content));
          nextExpected = 'human';
        } else if (isHuman && nextExpected === 'ai') {
          // Consecutive Human messages: merge them
          if (langchainMessages.length > 0) {
            const lastMsg = langchainMessages[langchainMessages.length - 1];
            lastMsg.content = `${String(lastMsg.content)}\n\n${String(msg.content)}`;
          }
        } else if (!isHuman && nextExpected === 'human') {
          // Leading AI message or consecutive AI messages
          if (langchainMessages.length > 0) {
            // Consecutive AI messages: merge them
            const lastMsg = langchainMessages[langchainMessages.length - 1];
            lastMsg.content = `${String(lastMsg.content)}\n\n${String(msg.content)}`;
          }
          // If length is 0, it's a leading AI message (like a welcome message). We just drop it.
        }
      }

      const result = await workflow.invoke({
        question,
        messages: langchainMessages,
      });

      const docsResults = result.docs_results || [];
      const openQuestions: string[] = [];
      const citations: Citation[] = [];

      // 1. Process Open Questions
      if (docsResults.length === 0) {
        openQuestions.push(question);
      } else {
        // 2. Generate Citations
        // Get unique document IDs from chunks
        const documentIds = Array.from(
          new Set(docsResults.map((chunk) => chunk.document_id)),
        );

        // Fetch documents to get title and link
        const documents = await this.documentRepo.find({
          where: { id: In(documentIds) },
        });

        const docMap = new Map(documents.map((doc) => [doc.id, doc]));

        // We will create one citation per unique document involved in the response.
        // If we want more granular citations per chunk, we can iterate over chunks.
        // Based on the requirement: "unique Citations consisting of document id, document name, document link".
        for (const doc of documents) {
          const citation = this.citationRepo.create({
            query_id: queryId,
            source_id: doc.id,
            source_type: 'DOCUMENTATION',
            text_snippet: doc.title, // or chunk content if requested
            url: doc.source_url,
          });
          citations.push(citation);
        }

        if (citations.length > 0) {
          await this.citationRepo.save(citations);
        }
      }

      return {
        answer: result.final_answer,
        open_questions: openQuestions,
        citations,
        messages: result.messages,
      };
    } catch (error) {
      this.logger.error('Error in processQuery', error);
      throw error;
    }
  }
}
