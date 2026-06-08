import { ConfigService } from '@nestjs/config';
import { getLLM } from '../../src/config/llm';
import { createQueryRewriterNode } from '../../src/knowledge/graph/nodes/query_rewriter';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const testQuestion =
  process.argv[2] || 'Tell me about funding models supported by Reap';

async function run() {
  console.log(`Testing query rewriter node via ConfigService...`);
  console.log(`Testing Question: "${testQuestion}"`);

  // ConfigService reads directly from process.env
  const configService = new ConfigService(process.env);

  try {
    const llm = getLLM(configService);
    const node = createQueryRewriterNode(llm);

    const state = {
      question: testQuestion,
      messages: [],
    } as any;

    console.log('Running query rewriter node...');
    const result = await node(state);
    console.log('Result:\n', JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Failed to run query rewriter node:', e);
  }
}

run();
