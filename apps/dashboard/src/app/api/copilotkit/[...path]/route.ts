// Catch-all route to forward sub-path requests to the CopilotKit v2 handler.
// The v2 runtime uses multi-route mode and expects sub-paths such as:
//   GET  /api/copilotkit/info
//   POST /api/copilotkit/agent/:agentId/run
// Next.js App Router requires a separate route file for these sub-paths.
import { NextRequest } from "next/server";
import { copilotHandler } from "../route";

export const POST = (req: NextRequest) => copilotHandler(req);
export const GET = (req: NextRequest) => copilotHandler(req);
