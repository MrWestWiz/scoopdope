import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  /** One-to-one with User: when the user is deleted, portfolio is cascade-deleted */
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Public-facing slug, e.g. "alice-blockchain-dev" or a random UUID-derived token.
   * Used in shareable URLs: /portfolio/:slug
   */
  @Column({ unique: true, type: 'varchar', length: 128 })
  publicSlug: string;

  /** Whether the portfolio is publicly accessible via the slug URL */
  @Column({ default: false })
  isPublic: boolean;

  /** Optional display name override (falls back to user.username) */
  @Column({ nullable: true, type: 'varchar', length: 255 })
  displayName: string | null;

  /** Extended bio for the portfolio (separate from user.bio) */
  @Column({ nullable: true, type: 'text' })
  bio: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
