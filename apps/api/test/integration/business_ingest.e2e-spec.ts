import request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { INestApplication } from '@nestjs/common';

describe('Business Knowledge Ingestion (e2e)', () => {
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

  it('POST /api/v1/business-knowledge - should return 201 created', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/business-knowledge')
      .send({
        title: 'Objection Handling',
        content: 'When a customer says X, reply with Y.',
        category: 'Sales',
        audience: 'Internal',
        importance_score: 0.9,
        review_ownership: 'SalesOps',
        approval_status: 'APPROVED',
      });

    // Test fails because endpoint is not implemented yet
    expect(response.status).toBe(201);
  });
});
