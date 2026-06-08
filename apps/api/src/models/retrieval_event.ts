import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('retrieval_events')
export class RetrievalEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  session_id: string;

  @Column({ type: 'varchar' })
  query: string;

  @Column({ type: 'boolean', default: false })
  has_conflict: boolean;

  @Column({ type: 'boolean', default: false })
  was_refused: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;
}
