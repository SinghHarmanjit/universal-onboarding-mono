import {
  CopilotRuntime,
  BuiltInAgent,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { NextRequest } from "next/server";

// Suppress AI SDK warnings for v2 specification compatibility mode
(globalThis as any).AI_SDK_LOG_WARNINGS = false;

const baseURL = process.env.LLM_BASE_URL?.endsWith("/v1")
  ? process.env.LLM_BASE_URL
  : `${process.env.LLM_BASE_URL}/v1`;

const modelName = process.env.LLM_GENERALIST_MODEL ?? "qwen3";

// Build an AI SDK-compatible LanguageModel backed by the local OpenAI-compatible server
const localProvider = createOpenAICompatible({
  name: "local",
  baseURL,
  apiKey: "local",
});

const localModel = localProvider(modelName);

const runtime = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model: localModel,
    }),
  },
});

// Use single-route mode so that the frontend can POST everything to
// /api/copilotkit as a JSON-RPC envelope { method, params, body }.
// This is the v1-compatible mode that the CopilotKit React SDK expects
// when given a plain runtimeUrl string.
export const copilotHandler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
  mode: "single-route",
});

export const POST = (req: NextRequest) => copilotHandler(req);
export const GET = (req: NextRequest) => copilotHandler(req);