import { Controller, Get, Logger, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'Health check' })
  check(): { status: string; timestamp: string } {
    try {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      throw new InternalServerErrorException('Health check failed');
    }
  }
}
