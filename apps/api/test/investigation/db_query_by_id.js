const { Client } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const targetId = process.argv[2] || '52678453-0def-4edc-bf16-ad7b4ce28523';

async function run() {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://autonomous:autonomous_universal@localhost:5432/universal';
  console.log(`Database URL: ${dbUrl}`);
  console.log(`Querying for ID: ${targetId}`);

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    const resChunk = await client.query(
      "SELECT id, document_id, left(content, 500) as content FROM documentation_chunks WHERE id = $1 OR document_id = $1;",
      [targetId]
    );
    console.log('Chunks:', JSON.stringify(resChunk.rows, null, 2));

    const resDoc = await client.query(
      "SELECT id, title, left(content, 500) as content FROM documentation_documents WHERE id = $1;",
      [targetId]
    );
    console.log('Document:', JSON.stringify(resDoc.rows, null, 2));
  } catch (err) {
    console.error("Database query failed:", err);
  } finally {
    await client.end();
  }
}

run();
