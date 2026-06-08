import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TracingInterceptor } from './common/interceptors/tracing.interceptor';

import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.setGlobalPrefix('v1/api');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TracingInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      errorHttpStatusCode: 422,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Universal Onboarding API')
    .setDescription('REST API for the AI Sales Assistant')
    .setVersion('0.1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const corsOrigins: string[] = process.env['CORS_ORIGINS']
    ? (JSON.parse(process.env['CORS_ORIGINS']) as string[])
    : [];
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  });

  const port = process.env['PORT'] ?? 8000;
  await app.listen(port);
}

void bootstrap();
