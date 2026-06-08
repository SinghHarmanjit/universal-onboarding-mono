import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NOMIC_EMBEDDING_DIMENSIONS } from '../knowledge/constants/embedding';

@Entity('business_knowledge_entries')
export class BusinessKnowledgeEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar' })
  category: string;

  @Column({ type: 'varchar' })
  audience: string;

  @Column({ type: 'float' })
  importance_score: number;

  @Column({ type: 'vector', length: NOMIC_EMBEDDING_DIMENSIONS })
  embedding: string;

  @Column({ type: 'varchar' })
  embedding_model: string;

  @Column({ type: 'varchar' })
  review_ownership: string;

  @Column({ type: 'timestamp', nullable: true })
  expiration_date: Date;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'varchar' })
  approval_status: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
