import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('ReadMe API Document Ingestion (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should trigger ingestion for a ReadMe URL and return 201 Created', async () => {
    // Assuming the API key is set in .env for tests or we mock it
    // For this integration test, we will just call the endpoint.
    // In a real environment we would mock fetch, but for simplicity we rely on the actual or mocked endpoint.
    const payload = {
      title: 'ReadMe Integration Test',
      source_url: 'https://reap.readme.io/docs/getting-started',
      version: '1.0',
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/documents')
      .send(payload)
      .expect(201);

    expect(response.body).toHaveProperty('documentId');
    expect(response.body).toHaveProperty('message');
  }, 30000);
});
