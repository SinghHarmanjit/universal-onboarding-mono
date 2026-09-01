import { Injectable, Logger } from '@nestjs/common';
import { DocsRetrievalService } from '../../knowledge/services/docs_retrieval.service';
import { BusinessRetrievalService } from '../../knowledge/services/business_retrieval.service';
import { FactExtractionAgentService } from '../../prospect/services/fact_extraction_agent.service';
import { MeddicAgentService } from '../../prospect/services/meddic_agent.service';
import { createPlannerWorkflow } from '../../knowledge/graph/planner/planner_workflow';
import { createSupervisorWorkflow } from '../graph/supervisor/supervisor_workflow';
import { getLLM } from '../../config/llm';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RetrievalEvent } from '../../models/retrieval_event';
import { Citation } from '../../models/citation';
import { DocumentationDocument } from '../../models/document';
import { ProspectFact } from '../../models/prospect_fact';
import { Prospect } from '../../models/prospect';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SupervisorService {
  private readonly logger = new Logger(SupervisorService.name);

  constructor(
    private readonly docsRetrievalService: DocsRetrievalService,
    private readonly businessRetrievalService: BusinessRetrievalService,
    private readonly factExtractionService: FactExtractionAgentService,
    private readonly meddicAgentService: MeddicAgentService,
    @InjectRepository(RetrievalEvent)
    private readonly retrievalEventRepo: Repository<RetrievalEvent>,
    @InjectRepository(Citation)
    private readonly citationRepo: Repository<Citation>,
    @InjectRepository(DocumentationDocument)
    private readonly documentRepo: Repository<DocumentationDocument>,
    @InjectRepository(ProspectFact)
    private readonly factRepo: Repository<ProspectFact>,
    @InjectRepository(Prospect)
    private readonly prospectRepo: Repository<Prospect>,
    private readonly configService: ConfigService,
  ) {}

  async processQuery(prospectId: string | undefined, question: string, messages?: BaseMessage[]) {
    try {
      let prospect: Prospect | null = null;
      if (prospectId) {
        prospect = await this.prospectRepo.findOne({ where: { id: prospectId } });
      }
      if (!prospect) {
        const newProspect = this.prospectRepo.create(prospectId ? { id: prospectId } : {});
        await this.prospectRepo.save(newProspect);
        prospect = newProspect;
        prospectId = newProspect.id;
      }

      const llm = getLLM(this.configService);
      
      const plannerWorkflow = createPlannerWorkflow(
        this.docsRetrievalService,
        this.businessRetrievalService,
        this.retrievalEventRepo,
        llm,
      );

      const supervisorWorkflow = createSupervisorWorkflow(
        this.factExtractionService,
        this.meddicAgentService,
        plannerWorkflow,
        llm,
      );

      const queryId = uuidv4();

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
          if (langchainMessages.length > 0) {
            const lastMsg = langchainMessages[langchainMessages.length - 1];
            lastMsg.content = `${String(lastMsg.content)}\n\n${String(msg.content)}`;
          }
        } else if (!isHuman && nextExpected === 'human') {
          if (langchainMessages.length > 0) {
            const lastMsg = langchainMessages[langchainMessages.length - 1];
            lastMsg.content = `${String(lastMsg.content)}\n\n${String(msg.content)}`;
          }
        }
      }

      const result = await supervisorWorkflow.invoke({
        prospectId: prospect.id,
        question,
        messages: langchainMessages,
      });

      const docsResults = result.product_result?.docs || [];
      const citations: Citation[] = [];

      if (docsResults.length > 0) {
        const documentIds = Array.from(
          new Set(docsResults.map((chunk: any) => chunk.document_id)),
        );

        const documents = await this.documentRepo.find({
          where: { id: In(documentIds) },
        });

        for (const doc of documents) {
          const citation = this.citationRepo.create({
            query_id: queryId,
            source_id: doc.id,
            source_type: 'DOCUMENTATION',
            text_snippet: doc.title,
            url: doc.source_url,
          });
          citations.push(citation);
        }

        if (citations.length > 0) {
          await this.citationRepo.save(citations);
        }
      }

      const facts = await this.factRepo.find({
        where: { prospect_id: prospect.id }
      });

      return {
        answer: result.final_answer,
        meddic: result.meddic,
        facts: facts,
        prospectId: prospect.id,
        citations,
        messages: result.messages,
      };
    } catch (error) {
      this.logger.error('Error in processQuery', error);
      throw error;
    }
  }
}
