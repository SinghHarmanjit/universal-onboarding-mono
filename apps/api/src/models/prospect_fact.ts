import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Prospect } from './prospect';
import { ChatMessage } from './chat_message';

@Entity('prospect_facts')
export class ProspectFact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  prospect_id: string;

  @ManyToOne(() => Prospect, (prospect) => prospect.facts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prospect_id' })
  prospect: Prospect;

  @Column({ type: 'varchar' })
  fact_type: string;

  @Column({ type: 'varchar' })
  fact_key: string;

  @Column({ type: 'jsonb', nullable: true })
  fact_value: Record<string, any>;

  @Column({ type: 'numeric', nullable: true })
  confidence: number;

  @Column({ type: 'uuid', nullable: true })
  source_message_id: string;

  @ManyToOne(() => ChatMessage, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'source_message_id' })
  source_message: ChatMessage;

  @CreateDateColumn()
  created_at: Date;
}
