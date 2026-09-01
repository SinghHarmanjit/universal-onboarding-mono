import { ProductState } from '../product_state';

export const contextMergerNode = async (
  state: ProductState,
): Promise<Partial<ProductState>> => {
  const docs = state.docs_results || [];
  // const business = state.business_results || [];

  return {
    // merged_context: {
    //   docs, 
    //   business,
    // },
  };
};
