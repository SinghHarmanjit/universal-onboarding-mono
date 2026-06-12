import { RAGState } from '../state';

export const contextMergerNode = async (
  state: RAGState,
): Promise<Partial<RAGState>> => {
  const docs = state.docs_results || [];
  // const business = state.business_results || [];

  return {
    // merged_context: {
    //   docs,
    //   business,
    // },
  };
};
