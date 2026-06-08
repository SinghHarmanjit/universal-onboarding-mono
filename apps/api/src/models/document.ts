import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { DocumentationChunk } from './chunk';

@Entity('documentation_documents')
export class DocumentationDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'varchar' })
  source_url: string;

  @Column({ type: 'varchar', nullable: true })
  external_id: string;

  @Column({ type: 'varchar', nullable: true })
  version: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => DocumentationChunk, (chunk) => chunk.document)
  chunks: DocumentationChunk[];
}
