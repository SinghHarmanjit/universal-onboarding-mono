const { Client } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const ALL_IDS = [
  'bfd7c27b-0577-4d78-b5e2-d6d5df7534ba', 'c4589fb6-6504-46f5-b95c-4667fefa8a66',
  '10d4fca1-28be-4486-9312-e7443d5c2fcb', '511a245b-fee1-4ff5-a8de-bfa0e9e8a9e8',
  '344e1e8e-50b1-436c-954c-2d6ff970adcf', 'c444b98a-372f-4220-a3bb-88a6cbfed9cb',
  'abdad6a3-fe51-4b7d-8e73-028fd715e764', 'b447323c-9735-4b7a-9258-f986163274eb',
  '6b444abc-fcd2-4ae3-8f65-2ef0b629a981', '1ddec806-2b2b-4981-ba77-fce5c400cc26',
  '68499d50-934a-48b4-98c3-5d9c0e25bafa', 'c6e89801-e333-48ce-90e2-8e092d7b3e5c',
  '73e0cd07-0434-4c6b-826b-2871c9dad90f', '4e38c4dc-202c-4d8e-aa90-c769d40f66db',
  '659eb821-ba67-46b7-8e19-6f125f030197', '7be77653-6ca2-4595-92d8-91cc9d5a5375',
  '58e7c069-d9d0-4f1d-90eb-94a695dfb450', 'c9273eba-6780-4a8e-a92e-22717cb9002a',
  'bf1b78d6-9e2b-47d6-b06f-72f5a0592643', 'b83ca31f-596c-487c-98ed-62402149a162',
  'a3048977-6e15-4e8d-a8e8-69f62bd3980c', 'c5a3f085-5f92-41a1-b3b0-ea6d79b993df',
  '4dc73553-6ec1-49cb-8009-9c33ed650b0f', '5f1ea3e3-7f87-44af-a5bc-a4edca35f278',
  '7d1fdf7e-023c-455e-ad08-166a9dbb87b1', 'c3700148-d73c-4bd2-b114-311fcf00776a',
  'faf4e303-be0e-40a4-8395-7aefc0fb6d1a', '4f760e22-95ff-4de8-a326-946b50675c80',
  '1de3ba4d-c473-4d6b-bd8a-f5f6147ae9a1', 'fdaea927-95db-4311-b2a7-51699644b34c',
  'd2af16f2-8d54-470a-b4bb-4ff42752c5c7', '35539fdc-f694-4b47-90e9-961141dd9ee4',
  '736d5a55-762e-456a-8e79-b6007b91e2c6', '616d1712-c910-44f0-adf6-9359aa574166',
  'dcd3d867-cc21-44e2-b72a-2eb363556dba', '51a1befd-a960-44be-890d-d99bc86ac27f',
  '91bf10b7-0f19-40c2-b608-0258f8cd23f2', 'ca03d919-d3e1-43e5-9e06-45d0c49de410',
  '9ff0efe9-faea-45a3-8995-c5b0b4f60105', '571b0ec9-99ac-4517-a493-6a84420cd81c',
  '465a3f0b-96ef-4ebe-b351-175d763e80d3', 'a75431cc-9ab5-4610-9854-0c82527c700a'
];

async function run() {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://autonomous:autonomous_universal@localhost:5432/universal';
  const port = process.env.PORT || 8000;
  
  console.log(`Running entity extraction for all ${ALL_IDS.length} IDs (skipping already extracted)`);
  
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  for (const id of ALL_IDS) {
    console.log(`\n========================================`);
    console.log(`Processing ID: ${id}`);
    try {
      // Check if already extracted
      const existing = await client.query(
        "SELECT count(*) FROM business_entities WHERE business_knowledge_entry_id = $1;",
        [id]
      );
      if (parseInt(existing.rows[0].count) > 0) {
         console.log(`Skipping ${id} - Already has ${existing.rows[0].count} entities.`);
         continue;
      }

      console.log(`Making POST request to /v1/api/business-knowledge/${id}/entities`);
      const response = await fetch(`http://localhost:${port}/v1/api/business-knowledge/${id}/entities`, {
        method: 'POST',
      });
      
      const responseBody = await response.json();
      if (!response.ok) {
        console.error(`Request failed for ${id}:`, responseBody);
        continue;
      }
      console.log(`Successfully extracted entities for ${id}`);
      
    } catch (err) {
      console.error(`Error processing ID ${id}:`, err);
    }
  }

  await client.end();
}

run();
