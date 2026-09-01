import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ProspectMeddic } from '../../models/prospect_meddic';
import { getLLM } from '../../config/llm';
import { createMeddicWorkflow } from '../graph/meddic/meddic_workflow';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';

@Injectable()
export class MeddicAgentService {
  private readonly logger = new Logger(MeddicAgentService.name);

  constructor(
    @InjectRepository(ProspectMeddic)
    private readonly prospectMeddicRepo: Repository<ProspectMeddic>,
    private readonly configService: ConfigService,
  ) {}

  async processMeddicMessage(prospectId: string, userMessage: string, chatHistory: any[] = []) {
    try {
      const llm = getLLM(this.configService);
      const workflow = createMeddicWorkflow(llm);

      // Convert incoming message objects to LangChain message classes
      const langchainMessages: BaseMessage[] = [];
      for (const msg of chatHistory) {
        const isHuman = msg.type === 'human' || msg.role === 'user';
        if (isHuman) {
          langchainMessages.push(new HumanMessage(msg.content));
        } else {
          langchainMessages.push(new AIMessage(msg.content));
        }
      }

      // Fetch current state from DB
      let currentMeddic = await this.prospectMeddicRepo.findOne({
        where: { prospect_id: prospectId },
      });

      if (!currentMeddic) {
        currentMeddic = this.prospectMeddicRepo.create({
          prospect_id: prospectId,
        });
      }

      // Only pass necessary state to avoid massive objects
      const stateToPass = {
        metrics: currentMeddic.metrics,
        economic_buyer: currentMeddic.economic_buyer,
        decision_criteria: currentMeddic.decision_criteria,
        decision_process: currentMeddic.decision_process,
        identified_pain: currentMeddic.identified_pain,
        champion: currentMeddic.champion,
        timeline: currentMeddic.timeline,
        budget: currentMeddic.budget,
      };

      const result = await workflow.invoke({
        question: userMessage,
        messages: langchainMessages,
        current_meddic: stateToPass,
      });

      if (result.is_relevant && result.extracted_meddic) {
        // Merge updates
        const updates = result.extracted_meddic;
        if (updates.metrics && Object.keys(updates.metrics).length > 0) currentMeddic.metrics = { ...currentMeddic.metrics, ...updates.metrics };
        if (updates.economic_buyer && Object.keys(updates.economic_buyer).length > 0) currentMeddic.economic_buyer = { ...currentMeddic.economic_buyer, ...updates.economic_buyer };
        if (updates.decision_criteria && Object.keys(updates.decision_criteria).length > 0) currentMeddic.decision_criteria = { ...currentMeddic.decision_criteria, ...updates.decision_criteria };
        if (updates.decision_process && Object.keys(updates.decision_process).length > 0) currentMeddic.decision_process = { ...currentMeddic.decision_process, ...updates.decision_process };
        if (updates.identified_pain && Object.keys(updates.identified_pain).length > 0) currentMeddic.identified_pain = { ...currentMeddic.identified_pain, ...updates.identified_pain };
        if (updates.champion && Object.keys(updates.champion).length > 0) currentMeddic.champion = { ...currentMeddic.champion, ...updates.champion };
        if (updates.timeline && Object.keys(updates.timeline).length > 0) currentMeddic.timeline = { ...currentMeddic.timeline, ...updates.timeline };
        if (updates.budget && Object.keys(updates.budget).length > 0) currentMeddic.budget = { ...currentMeddic.budget, ...updates.budget };

        currentMeddic.completeness_score = result.completeness_score;

        await this.prospectMeddicRepo.save(currentMeddic);
      } else {
         this.logger.log(`Message discarded by MEDDIC agent (irrelevant): ${userMessage}`);
      }

      return {
        is_relevant: result.is_relevant,
        suggested_question: result.suggested_question,
        profile: currentMeddic,
      };
    } catch (error) {
      this.logger.error('Error in processMeddicMessage', error);
      throw error;
    }
  }
}
