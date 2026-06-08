const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const llmBaseUrl = process.env.LLM_BASE_URL || 'http://localhost:10030';
const llmModel = process.env.LLM_CONVERSATION_MODEL || 'gemma3';
const promptToTest = process.argv[2] || 'Say hello!';

async function pingEndpoint(url, payload) {
  console.log(`\nTesting POST request to: ${url}`);
  console.log(`Model: ${llmModel}`);
  try {
    const start = Date.now();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer not-needed"
      },
      body: JSON.stringify(payload)
    });
    const data = await res.text();
    const duration = Date.now() - start;
    
    console.log(`Status: ${res.status} (${res.statusText})`);
    console.log(`Response time: ${duration}ms`);
    console.log("Data snippet:", data.substring(0, 500));
    return res.status === 200;
  } catch (e) {
    console.error(`Error connecting to ${url}:`, e.message);
    return false;
  }
}

async function run() {
  console.log(`LLM Base URL: ${llmBaseUrl}`);
  console.log(`LLM Model: ${llmModel}`);

  const payload = {
    model: llmModel,
    messages: [{ role: "user", content: promptToTest }],
    max_tokens: 256,
    temperature: 0
  };

  // Try both endpoints (standard OpenAI v1 and prefixless for custom local setups)
  const v1Url = `${llmBaseUrl.replace(/\/v1$/, '')}/v1/chat/completions`;
  const rootUrl = `${llmBaseUrl.replace(/\/v1$/, '')}/chat/completions`;

  const v1Success = await pingEndpoint(v1Url, payload);
  if (!v1Success) {
    console.log("\nRetrying with non-v1 endpoint...");
    await pingEndpoint(rootUrl, payload);
  }
}

run();
