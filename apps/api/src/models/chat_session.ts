import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Prospect } from './prospect';
import { ChatMessage } from './chat_message';

@Entity('chat_sessions')
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  prospect_id: string;

  @ManyToOne(() => Prospect, (prospect) => prospect.chat_sessions, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'prospect_id' })
  prospect: Prospect;

  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @OneToMany(() => ChatMessage, (message) => message.chat_session)
  messages: ChatMessage[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
