import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('action_logs')
export class ActionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  session_id: string;

  @Column({ type: 'varchar' })
  action_type: string;

  @Column({ type: 'varchar', nullable: true })
  langsmith_run_id: string;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;
}
