import { RAGState } from '../state';
import { Repository } from 'typeorm';
import { RetrievalEvent } from '../../../models/retrieval_event';

export const createAnalyticsLoggerNode = (
  retrievalEventRepo: Repository<RetrievalEvent>,
) => {
  return async (state: RAGState): Promise<Partial<RAGState>> => {
    const docs = state.merged_context?.docs || state.docs_results || [];
    const business =
      state.merged_context?.business || state.business_results || [];

    const wasRefused = docs.length === 0 && business.length === 0;
    // Rough heuristic for conflict checking: if both returned results, there's a potential conflict
    // that the LLM had to resolve using prioritization rules.
    const hasConflict = docs.length > 0 && business.length > 0;

    const event = retrievalEventRepo.create({
      session_id: 'anonymous', // Would normally come from request context
      query: state.question,
      has_conflict: hasConflict,
      was_refused: wasRefused,
      metadata: {
        docs_count: docs.length,
        business_count: business.length,
      },
    });

    // In a real high-throughput system, we might fire and forget or use a queue.
    // For MVP, we await the save.
    await retrievalEventRepo.save(event).catch((err) => {
      console.error('Failed to log analytics event', err);
    });

    return {};
  };
};
