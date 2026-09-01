import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BusinessKnowledgeEntry } from './business_knowledge';
import { NOMIC_EMBEDDING_DIMENSIONS } from '../knowledge/constants/embedding';

@Entity('business_entities')
export class BusinessEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  business_knowledge_entry_id: string;

  @ManyToOne(() => BusinessKnowledgeEntry, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_knowledge_entry_id' })
  business_knowledge_entry: BusinessKnowledgeEntry;

  @Column({ type: 'varchar' })
  entity_type: string;

  @Column({ type: 'varchar' })
  entity_name: string;

  @Column({ type: 'jsonb' })
  attributes: Record<string, any>;

  @Column({ type: 'vector', length: NOMIC_EMBEDDING_DIMENSIONS, nullable: true })
  embedding: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
