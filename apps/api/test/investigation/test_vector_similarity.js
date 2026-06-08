const { Client } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const searchQuery = process.argv[2] || "Funding Model";
const targetChunkId = process.argv[3] || "7a8dfef3-ef74-4a9e-8c41-432eb791ea23";

async function test() {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://autonomous:autonomous_universal@localhost:5432/universal';
  const embeddingBaseUrl = process.env.EMBEDDING_BASE_URL || 'http://localhost:10020/v1';
  const embeddingModel = process.env.EMBEDDING_MODEL || 'nomic-embed-text-v1.5';

  console.log(`Database URL: ${dbUrl}`);
  console.log(`Embedding Base URL: ${embeddingBaseUrl}`);
  console.log(`Embedding Model: ${embeddingModel}`);
  console.log(`Search Query: "${searchQuery}"`);
  console.log(`Target Chunk ID to check: ${targetChunkId}`);

  // 1. Get embedding for input query
  let queryEmbedding;
  try {
    const embeddingsUrl = `${embeddingBaseUrl.replace(/\/$/, '')}/embeddings`;
    const res = await fetch(embeddingsUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": "Bearer not-needed" 
      },
      body: JSON.stringify({
        input: `search_query: ${searchQuery}`,
        model: embeddingModel
      })
    });
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      queryEmbedding = data.data[0].embedding;
      // Database documentation_chunks embedding column is vector(192)
      if (queryEmbedding.length > 192) {
        console.log(`Slicing embedding from ${queryEmbedding.length} to 192 dimensions...`);
        queryEmbedding = queryEmbedding.slice(0, 192);
      }
    } else {
      console.error("Embedding API failed:", data);
      return;
    }
  } catch (e) {
    console.error("Fetch query embedding failed:", e);
    return;
  }

  // 2. Query PostgreSQL
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    
    const embeddingString = `[${queryEmbedding.join(',')}]`;
    const res = await client.query(`
      SELECT 
        id, 
        document_id,
        substring(content for 100) as content, 
        (embedding <=> $1) as distance 
      FROM documentation_chunks 
      ORDER BY embedding <=> $1 ASC 
      LIMIT 10
    `, [embeddingString]);
    
    console.log(`\nTop 10 chunks for '${searchQuery}':`);
    res.rows.forEach(r => {
      console.log(`- Dist: ${r.distance.toFixed(4)} | Doc: ${r.document_id} | Chunk: ${r.id} | Content: ${r.content.replace(/\n/g, ' ')}`);
    });
    
    // Specifically check the distance for the target chunk
    const targetRes = await client.query(`
      SELECT (embedding <=> $1) as distance 
      FROM documentation_chunks 
      WHERE id = $2
    `, [embeddingString, targetChunkId]);
    if (targetRes.rows.length > 0) {
      console.log(`\nTarget chunk (${targetChunkId}) distance: ${targetRes.rows[0].distance}`);
    } else {
      console.log(`\nTarget chunk (${targetChunkId}) not found in table!`);
    }
    
  } catch (e) {
    console.error("Database query failed:", e);
  } finally {
    await client.end();
  }
}

test();
