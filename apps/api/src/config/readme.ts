import { ConfigService } from '@nestjs/config';

export const getReadmeConfig = (configService: ConfigService) => ({
  apiKey: configService.get<string>('README_API_KEY'),
});
