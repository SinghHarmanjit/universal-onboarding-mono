import { BusinessState } from '../business_state';
import { BusinessRetrievalService } from '../../../services/business_retrieval.service';

export const createEntityRetrieverNode = (
  businessRetrievalService: BusinessRetrievalService,
) => {
  return async (state: BusinessState): Promise<Partial<BusinessState>> => {
    const signals = state.signals || [];

    // Extract entity types from signals
    const entityTypes = Array.from(
      new Set(signals.map((s) => s.entity_type).filter(Boolean)),
    );

    if (entityTypes.length === 0) {
      console.log('[EntityRetriever] No entity types found in signals. Skipping entity retrieval.');
      return {
        business_entities_results: [],
      };
    }

    try {
      const entities = await businessRetrievalService.retrieveEntities(
        entityTypes,
        5, // limit
      );

      console.log(`[EntityRetriever] Retrieved ${entities.length} entities.`);
      return {
        business_entities_results: entities,
      };
    } catch (e) {
      console.error('[EntityRetriever] Failed to retrieve entities', e);
      return {
        business_entities_results: [],
      };
    }
  };
};
