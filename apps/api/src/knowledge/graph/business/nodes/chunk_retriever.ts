import { BusinessState } from '../business_state';
import { BusinessRetrievalService } from '../../../services/business_retrieval.service';

export const createChunkRetrieverNode = (
  businessRetrievalService: BusinessRetrievalService,
) => {
  return async (state: BusinessState): Promise<Partial<BusinessState>> => {
    const question = state.question;

    try {
      // For general context, we just retrieve based on the user's raw question
      // This is a semantic search against business_chunks
      const chunks = await businessRetrievalService.retrieveRelevantKnowledge(
        question,
        3, // limit
      );

      console.log(`[ChunkRetriever] Retrieved ${chunks.length} chunks.`);
      return {
        business_chunks_results: chunks,
      };
    } catch (e) {
      console.error('[ChunkRetriever] Failed to retrieve chunks', e);
      return {
        business_chunks_results: [],
      };
    }
  };
};
