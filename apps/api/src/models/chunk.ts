import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DocumentationDocument } from './document';
import { NOMIC_EMBEDDING_DIMENSIONS } from '../knowledge/constants/embedding';

@Entity('documentation_chunks')
export class DocumentationChunk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  document_id: string;

  @ManyToOne(() => DocumentationDocument, (document) => document.chunks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'document_id' })
  document: DocumentationDocument;

  @Column({ type: 'int' })
  chunk_index: number;

  @Column({ type: 'varchar', nullable: true })
  section_heading: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int' })
  token_count: number;

  @Column({ type: 'vector', length: NOMIC_EMBEDDING_DIMENSIONS })
  embedding: string; // pgvector represents vectors as strings in TypeORM by default without special converters or arrays depending on version

  @Column({ type: 'varchar' })
  embedding_model: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;
}
