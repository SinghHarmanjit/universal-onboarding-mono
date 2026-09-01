import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Prospect } from './prospect';

@Entity('prospect_meddic')
export class ProspectMeddic {
  @PrimaryColumn('uuid')
  prospect_id: string;

  @OneToOne(() => Prospect, (prospect) => prospect.meddic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prospect_id' })
  prospect: Prospect;

  @Column({ type: 'jsonb', nullable: true })
  metrics: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  economic_buyer: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  decision_criteria: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  decision_process: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  identified_pain: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  champion: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  timeline: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  budget: Record<string, any>;

  @Column({ type: 'numeric', nullable: true })
  completeness_score: number;

  @UpdateDateColumn()
  updated_at: Date;
}
