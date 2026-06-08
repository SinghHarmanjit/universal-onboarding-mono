const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { OpenAIEmbeddings } = require('@langchain/openai');

const embeddingBaseUrl = process.env.EMBEDDING_BASE_URL || 'http://localhost:10020/v1';
const embeddingModel = process.env.EMBEDDING_MODEL || 'nomic-embed-text-v1.5';

console.log(`Embedding Base URL: ${embeddingBaseUrl}`);
console.log(`Embedding Model: ${embeddingModel}`);

// Intercept global fetch
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  console.log("FETCH URL:", url);
  if (options && options.body) {
    console.log("FETCH BODY:", options.body);
  }
  const res = await originalFetch(url, options);
  const text = await res.clone().text();
  console.log("FETCH RESPONSE:", text.substring(0, 200));
  return res;
};

async function test() {
  const embeddings = new OpenAIEmbeddings({
    modelName: embeddingModel,
    configuration: {
      baseURL: embeddingBaseUrl,
    },
    openAIApiKey: 'not-needed',
    encodingFormat: 'float',
  });

  console.log("Embedding test query...");
  const res = await embeddings.embedQuery("test text");
  console.log("Vector length:", res.length);
  console.log("First 5 elements:", res.slice(0, 5));
}

test().catch(console.error);
