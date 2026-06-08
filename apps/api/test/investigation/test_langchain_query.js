const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { ChatOpenAI } = require('@langchain/openai');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { ChatPromptTemplate } = require('@langchain/core/prompts');

const llmBaseUrl = process.env.LLM_BASE_URL || 'http://localhost:10030';
const llmModel = process.env.LLM_CONVERSATION_MODEL || 'gemma3';
const testQuestion = process.argv[2] || "Tell me about funding models supported by Reap";

async function run() {
  console.log(`LLM Base URL: ${llmBaseUrl}`);
  console.log(`LLM Model: ${llmModel}`);
  console.log(`Testing Question: "${testQuestion}"`);

  // Ensure Base URL ends with /v1 for LangChain's ChatOpenAI
  const baseURL = llmBaseUrl.endsWith('/v1') ? llmBaseUrl : `${llmBaseUrl}/v1`;

  const llm = new ChatOpenAI({
    modelName: llmModel,
    apiKey: 'not-needed-for-local',
    openAIApiKey: 'not-needed-for-local',
    configuration: {
      baseURL: baseURL,
    },
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are an expert search query generator for a retrieval-augmented generation (RAG) system for the Reap Card Issuing Service.
Your task is to take a user's question and generate 3 distinct search query variations optimized for vector similarity search.

Guidelines:
1. Generate concise, keyword-focused queries (2-5 words) rather than full sentences. Vector search works best with keywords.
2. Map user terms to domain-specific terminology where appropriate (e.g., "apple pay" -> "digital wallet", "how to fund" -> "funding model").
3. DO NOT include conversational filler like "Tell me about", "What is", etc.
4. Return ONLY a valid JSON array of strings containing the queries. Do not include markdown formatting or backticks.

Domain Context Keywords: Real-Time Authorization, Standard Authorization, Cardholder Managed Funding, Program Owner Managed Funding, Physical/Virtual Cards, Digital Wallet Provisioning, Tokenization, KYC/KYB, 3DS Forwarding, MCC Padding, Disputes, Fraud Alerts, Webhooks, Reconciliation, Crypto Top-up.`
    ],
    ['human', '{question}']
  ]);

  const chain = prompt.pipe(llm).pipe(new StringOutputParser());

  try {
    const response = await chain.invoke({ question: testQuestion });
    console.log("Raw Response:\n", response);

    let variations = [];
    try {
      variations = JSON.parse(response.trim());
    } catch (parseError) {
      console.log("JSON Parse Failed! Using fallback");
      variations = response
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/[\[\]"]/g, '')
        .split('\n')
        .map(q => q.trim().replace(/,$/, '')) // Remove trailing comma
        .filter(q => q.length > 0);
    }

    console.log("Parsed Variations:", variations);
  } catch (e) {
    console.error("LangChain query variations generation failed:", e);
  }
}

run();
