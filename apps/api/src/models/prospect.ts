import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { ProspectMeddic } from './prospect_meddic';
import { ProspectFact } from './prospect_fact';
import { ChatSession } from './chat_session';

@Entity('prospects')
export class Prospect {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  company_name: string;

  @Column({ type: 'varchar', nullable: true })
  industry: string;

  @Column({ type: 'varchar', nullable: true })
  website: string;

  @Column({ type: 'varchar', nullable: true })
  current_stage: string;

  @OneToOne(() => ProspectMeddic, (meddic) => meddic.prospect)
  meddic: ProspectMeddic;

  @OneToMany(() => ProspectFact, (fact) => fact.prospect)
  facts: ProspectFact[];

  @OneToMany(() => ChatSession, (session) => session.prospect)
  chat_sessions: ChatSession[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
