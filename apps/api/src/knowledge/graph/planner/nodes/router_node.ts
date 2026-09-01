import { KnowledgePlannerState } from '../planner_state';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StringOutputParser } from '@langchain/core/output_parsers';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';

export const createRouterNode = (llm: BaseChatModel) => {
  return async (
    state: KnowledgePlannerState,
  ): Promise<Partial<KnowledgePlannerState>> => {
    const question = state.question;
    const hasHistory = state.messages && state.messages.length > 0;

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a routing assistant for a Sales Orchestrator agent for Reap Card Issuing.
Your job is to analyze the user's message/question and route it to the appropriate sub-agents.

- Route to 'product_agent' IF the user is asking technical questions (e.g. APIs, endpoints, webhooks, technical implementation details, exact features).
- Route to 'business_agent' IF the user is introducing themselves, giving business context, asking for case studies, pricing, business strategy, or high-level value propositions.
- You may route to BOTH if the query involves both business strategy and technical implementation details.
- When in doubt or if it's just a general introduction, ONLY route to 'business_agent' to avoid overwhelming the user with technical product pitches early on.

Return ONLY a valid JSON array of strings containing one or both of these exact strings: "product_agent", "business_agent". Do not include markdown formatting or backticks.

Example Outputs:
["business_agent"]
["product_agent"]
["product_agent", "business_agent"]
`,
      ],
      ...(hasHistory ? [new MessagesPlaceholder('messages')] : []),
      ['human', '{question}'],
    ]);

    const chain = prompt.pipe(llm).pipe(new StringOutputParser());

    try {
      // Only take the last 2 messages for immediate context to ensure routing is based on the latest pivot
      const recentMessages = hasHistory ? state.messages.slice(-2) : [];

      const response = await chain.invoke({
        question: question,
        ...(hasHistory && { messages: recentMessages }),
      });
      console.log('[RouterNode] Raw LLM response:', response);

      const cleanedResponse = response
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .trim()
        .replace(/```json/g, '')
        .replace(/```/g, '');

      let routes: ('product_agent' | 'business_agent')[] = [];
      try {
        routes = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.log('[RouterNode] JSON parse failed', parseError);
        routes = ['business_agent'];
      }

      if (!Array.isArray(routes) || routes.length === 0) {
        routes = ['business_agent'];
      }

      // Filter and validate routes
      routes = routes.filter(
        (r) => r === 'product_agent' || r === 'business_agent',
      );
      
      if (routes.length === 0) {
        routes = ['business_agent'];
      }

      console.log('[RouterNode] Evaluated routes:', routes);
      return { route: routes };
    } catch (e) {
      console.error('[RouterNode] Failed to route query, defaulting to both', e);
      return { route: ['product_agent', 'business_agent'] };
    }
  };
};
