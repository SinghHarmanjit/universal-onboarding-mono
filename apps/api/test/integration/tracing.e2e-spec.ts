import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { INestApplication } from '@nestjs/common';

describe('Observability & Tracing (e2e)', () => {
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

  it('should have tracing configured', () => {
    // We expect LANGCHAIN_TRACING_V2 to be active for LangSmith
    expect(process.env.LANGCHAIN_TRACING_V2).toBeDefined();
  });
});
