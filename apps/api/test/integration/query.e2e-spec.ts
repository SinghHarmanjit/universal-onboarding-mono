import request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { INestApplication } from '@nestjs/common';

describe('Query API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/query - should stream SSE response', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/query')
      .send({ question: 'Test question' });

    // We expect an SSE response (text/event-stream)
    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.status).toBe(201); // NestJS defaults to 201 for POST
  });
});
