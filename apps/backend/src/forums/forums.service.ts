import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../courses/course.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { Post } from './post.entity';
import { Reply } from './reply.entity';
import { ForumVote, VoteDirection, VoteTarget } from './forum-vote.entity';
import { ModerationService } from '../moderation/moderation.service';
import { ContentType } from '../moderation/moderation.enums';
import { SearchService } from '../search/search.service';
import { StreaksService } from '../streaks/streaks.service';

@Injectable()
export class ForumsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Reply)
    private readonly replyRepo: Repository<Reply>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(ForumVote)
    private readonly voteRepo: Repository<ForumVote>,
    private readonly moderationService: ModerationService,
    private readonly searchService: SearchService,
    private readonly streaksService: StreaksService
  ) {}

  async findPostsByCourse(courseId: string) {
    await this.ensureCourseExists(courseId);

    return this.postRepo.find({
      where: { courseId },
      relations: ['user', 'replies', 'replies.user'],
      order: { isPinned: 'DESC', createdAt: 'DESC' },
    });
  }

  async createPost(courseId: string, userId: string, role: string, dto: CreatePostDto) {
    await this.ensureCourseExists(courseId);

    await this.streaksService.recordActivity(userId);

    if (dto.isPinned && !this.canModerate(role)) {
      throw new ForbiddenException('Only instructors and admins can pin posts');
    }

    const post = this.postRepo.create({
      courseId,
      userId,
      title: dto.title.trim(),
      content: dto.content.trim(),
      isPinned: Boolean(dto.isPinned && this.canModerate(role)),
    });

    const saved = await this.postRepo.save(post);
    await this.moderationService.analyzeContent(
      ContentType.POST,
      saved.id,
      `${saved.title} ${saved.content}`,
      userId
    );
    await this.searchService.indexPost(saved).catch(() => {});
    return saved;
  }

  async createReply(postId: string, userId: string, role: string, dto: CreateReplyDto) {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.streaksService.recordActivity(userId);

    if (dto.isAnswer && !this.canModerate(role)) {
      throw new ForbiddenException('Only instructors and admins can mark answers');
    }

    if (dto.isAnswer) {
      await this.replyRepo.update({ postId, isAnswer: true }, { isAnswer: false });
    }

    const reply = this.replyRepo.create({
      postId,
      userId,
      content: dto.content.trim(),
      isAnswer: Boolean(dto.isAnswer && this.canModerate(role)),
    });

    const savedReply = await this.replyRepo.save(reply);

    if (savedReply.isAnswer) {
      post.answerReplyId = savedReply.id;
      await this.postRepo.save(post);
    }

    await this.moderationService.analyzeContent(
      ContentType.REPLY,
      savedReply.id,
      savedReply.content,
      userId
    );
    return savedReply;
  }

  async votePost(
    postId: string,
    userId: string,
    direction: VoteDirection | 'remove'
  ): Promise<Post> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    return this.applyVote('post', postId, userId, direction, post, this.postRepo);
  }

  async voteReply(
    replyId: string,
    userId: string,
    direction: VoteDirection | 'remove'
  ): Promise<Reply> {
    const reply = await this.replyRepo.findOne({ where: { id: replyId } });
    if (!reply) throw new NotFoundException('Reply not found');

    return this.applyVote('reply', replyId, userId, direction, reply, this.replyRepo);
  }

  private async applyVote<T extends { upvotes: number; downvotes: number }>(
    targetType: VoteTarget,
    targetId: string,
    userId: string,
    direction: VoteDirection | 'remove',
    target: T,
    repo: Repository<T>
  ): Promise<T> {
    const existing = await this.voteRepo.findOne({
      where: { userId, targetType, targetId },
    });

    if (direction === 'remove') {
      if (existing) {
        if (existing.direction === 'up') target.upvotes = Math.max(0, target.upvotes - 1);
        else target.downvotes = Math.max(0, target.downvotes - 1);
        await this.voteRepo.remove(existing);
      }
    } else if (existing) {
      if (existing.direction !== direction) {
        // switching vote direction
        if (existing.direction === 'up') {
          target.upvotes = Math.max(0, target.upvotes - 1);
          target.downvotes += 1;
        } else {
          target.downvotes = Math.max(0, target.downvotes - 1);
          target.upvotes += 1;
        }
        existing.direction = direction;
        await this.voteRepo.save(existing);
      }
      // same direction = no-op
    } else {
      // new vote
      const vote = this.voteRepo.create({ userId, targetType, targetId, direction });
      await this.voteRepo.save(vote);
      if (direction === 'up') target.upvotes += 1;
      else target.downvotes += 1;
    }

    return repo.save(target);
  }

  private async ensureCourseExists(courseId: string) {
    const course = await this.courseRepo.findOne({
      where: { id: courseId, isDeleted: false },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }
  }

  private canModerate(role: string) {
    return role === 'admin' || role === 'instructor';
  }
}
