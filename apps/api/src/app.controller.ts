import { Controller, Get, Logger, InternalServerErrorException } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot(): { message: string } {
    try {
      return this.appService.getRoot();
    } catch (error) {
      this.logger.error('Error in getRoot', error);
      throw new InternalServerErrorException('Error in getRoot');
    }
  }
}
