import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';
import { ProspectMeddic } from '../../../models/prospect_meddic';

export interface MeddicState {
  question: string;
  messages: BaseMessage[];
  current_meddic: Partial<ProspectMeddic>;
  
  // Outputs
  is_relevant: boolean;
  extracted_meddic: Partial<ProspectMeddic>;
  completeness_score: number;
  suggested_question: string;
}

export const MeddicStateAnnotation = Annotation.Root({
  question: Annotation<string>(),
  messages: Annotation<BaseMessage[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  current_meddic: Annotation<Partial<ProspectMeddic>>(),
  is_relevant: Annotation<boolean>(),
  extracted_meddic: Annotation<Partial<ProspectMeddic>>(),
  completeness_score: Annotation<number>(),
  suggested_question: Annotation<string>(),
});
