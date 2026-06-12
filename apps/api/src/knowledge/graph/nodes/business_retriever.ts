import { RAGState } from '../state';
import { BusinessRetrievalService } from '../../services/business_retrieval.service';

export const createBusinessRetrieverNode = (
  businessRetrievalService: BusinessRetrievalService,
) => {
  return async (state: RAGState): Promise<Partial<RAGState>> => {
    const queries =
      state.query_variations && state.query_variations.length > 0
        ? state.query_variations
        : [state.question];

    // Run retrievals in parallel for all query variations
    const resultsPromises = queries.map((query) =>
      businessRetrievalService.retrieveRelevantKnowledge(query, 3),
    );
    const resultsArray = await Promise.all(resultsPromises);

    // Flatten and deduplicate by entry id
    const uniqueEntries = new Map();
    resultsArray.flat().forEach((entry) => {
      if (!uniqueEntries.has(entry.id)) {
        uniqueEntries.set(entry.id, entry);
      }
    });

    return {
      // business_results: Array.from(uniqueEntries.values()),
    };
  };
};
