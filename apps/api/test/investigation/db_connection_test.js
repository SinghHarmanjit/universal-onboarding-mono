const { Client } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const testDocumentId = process.argv[2] || '52678453-0def-4edc-bf16-ad7b4ce28523';

async function test() {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://autonomous:autonomous_universal@localhost:5432/universal';
  console.log(`Database URL: ${dbUrl}`);

  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    console.log("Successfully connected to the database.");

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Available Tables:", tablesRes.rows.map(r => r.table_name));
    
    const chunkCountRes = await client.query(`
      SELECT count(*) as count 
      FROM documentation_chunks 
      WHERE document_id = $1
    `, [testDocumentId]);
    console.log(`Chunks for document ${testDocumentId}:`, chunkCountRes.rows[0].count);

    if (parseInt(chunkCountRes.rows[0].count) > 0) {
      const chunks = await client.query(`
        SELECT id, substring(content for 200) as content 
        FROM documentation_chunks 
        WHERE document_id = $1 
        LIMIT 3
      `, [testDocumentId]);
      console.log("Sample chunks:", chunks.rows);
    }
    
  } catch (e) {
    console.error("Database connection/test failed:", e);
  } finally {
    await client.end();
  }
}

test();
