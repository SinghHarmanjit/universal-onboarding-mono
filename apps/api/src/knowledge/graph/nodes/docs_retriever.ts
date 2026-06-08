import { RAGState } from '../state';
import { DocsRetrievalService } from '../../services/docs_retrieval.service';

export const createDocsRetrieverNode = (
  docsRetrievalService: DocsRetrievalService,
) => {
  return async (state: RAGState): Promise<Partial<RAGState>> => {
    const queries =
      state.query_variations && state.query_variations.length > 0
        ? state.query_variations
        : [state.question];

    // Run retrievals in parallel for all query variations
    const resultsPromises = queries.map(query =>
      docsRetrievalService.retrieveSimilarChunks(query, 5)
    );
    const resultsArray = await Promise.all(resultsPromises);

    // Flatten and deduplicate by chunk id
    const uniqueChunks = new Map();
    resultsArray.flat().forEach(chunk => {
      if (!uniqueChunks.has(chunk.id)) {
        uniqueChunks.set(chunk.id, chunk);
      }
    });

    return {
      docs_results: Array.from(uniqueChunks.values()),
    };
  };
};
