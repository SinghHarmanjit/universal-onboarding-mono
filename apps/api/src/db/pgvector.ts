import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL'),
  autoLoadEntities: true,
  synchronize: false, // We'll use migrations for safety
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  migrationsRun: false, // Don't run automatically in app initialization
});
