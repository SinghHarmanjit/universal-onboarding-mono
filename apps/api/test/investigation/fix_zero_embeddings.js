const { Client } = require('pg');
const { OpenAIEmbeddings } = require('@langchain/openai');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function fixEmbeddings() {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://autonomous:autonomous_universal@localhost:5432/universal';
  const embeddingBaseUrl = process.env.EMBEDDING_BASE_URL || 'http://localhost:10020/v1';
  const embeddingModel = process.env.EMBEDDING_MODEL || 'nomic-embed-text-v1.5';

  console.log(`Database URL: ${dbUrl}`);
  console.log(`Embedding Base URL: ${embeddingBaseUrl}`);
  console.log(`Embedding Model: ${embeddingModel}`);

  const embeddings = new OpenAIEmbeddings({
    modelName: embeddingModel,
    configuration: {
      baseURL: embeddingBaseUrl,
    },
    openAIApiKey: 'not-needed',
    encodingFormat: 'float',
  });

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  console.log("Connected to database. Finding zero embeddings...");

  try {
    const res = await client.query(`
      SELECT id, content 
      FROM documentation_chunks 
      WHERE embedding::text LIKE '[0,0,0,0,0%'
    `);

    const chunks = res.rows;
    console.log(`Found ${chunks.length} chunks to update.`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        const vector = await embeddings.embedQuery(`search_document: ${chunk.content}`);
        const sliced = vector.slice(0, 192); // Keep 192 dimension slice if needed, or full dimension depending on config. Wait, let's keep original slice logic.
        
        await client.query(`
          UPDATE documentation_chunks 
          SET embedding = $1
          WHERE id = $2
        `, [`[${sliced.join(',')}]`, chunk.id]);

        if ((i + 1) % 50 === 0) {
          console.log(`Processed ${i + 1}/${chunks.length} chunks...`);
        }
      } catch (err) {
        console.error(`Failed to process chunk ${chunk.id}:`, err.message);
      }
    }

    console.log("Finished updating embeddings!");

  } catch (e) {
    console.error("Script failed:", e);
  } finally {
    await client.end();
  }
}

fixEmbeddings();
