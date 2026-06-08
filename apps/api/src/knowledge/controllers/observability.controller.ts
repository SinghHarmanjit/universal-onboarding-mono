import { Controller, Get, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActionLog } from '../../models/action_log';

@Controller('logs')
export class ObservabilityController {
  private readonly logger = new Logger(ObservabilityController.name);

  constructor(
    @InjectRepository(ActionLog)
    private readonly actionLogRepository: Repository<ActionLog>,
  ) { }

  @Get()
  async getLogs() {
    try {
      const logs = await this.actionLogRepository.find({
        order: { created_at: 'DESC' },
        take: 50,
      });
      return logs;
    } catch (error) {
      this.logger.error('Error fetching logs', error);
      throw new InternalServerErrorException('Error fetching logs');
    }
  }
}
