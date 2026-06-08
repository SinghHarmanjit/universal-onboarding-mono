import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('citations')
export class Citation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  query_id: string; // Reference to the query/retrieval event

  @Column({ type: 'varchar' })
  source_id: string; // Could be DocumentationChunk.id or BusinessKnowledgeEntry.id

  @Column({ type: 'varchar' })
  source_type: 'DOCUMENTATION' | 'BUSINESS';

  @Column({ type: 'text' })
  text_snippet: string;

  @Column({ type: 'varchar', nullable: true })
  url: string;

  @CreateDateColumn()
  created_at: Date;
}
