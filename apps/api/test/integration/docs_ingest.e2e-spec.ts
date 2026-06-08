import request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { INestApplication } from '@nestjs/common';

describe('Docs Ingestion (e2e)', () => {
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

  it('POST /api/v1/documents - should fail before implementation', async () => {
    // We expect this to fail initially since it's not fully implemented
    const response = await request(app.getHttpServer())
      .post('/api/v1/documents')
      .send({
        title: 'Test Doc',
        source_url: 'http://example.com/doc',
        content: 'This is a test documentation.',
      });

    // Since we now strictly require ReadMe URLs, this should throw an error and return 500
    expect(response.status).toBe(500);
  });
});
