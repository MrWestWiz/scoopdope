import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Assignment, RubricCriterion } from './assignment.entity';
import { AssignmentSubmission } from './submission.entity';
import { PeerReview, RubricScore } from './peer-review.entity';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentRepo: Repository<Assignment>,
    @InjectRepository(AssignmentSubmission)
    private submissionRepo: Repository<AssignmentSubmission>,
    @InjectRepository(PeerReview)
    private peerReviewRepo: Repository<PeerReview>,
  ) {}

  async getAssignmentsByCourse(courseId: string) {
    return this.assignmentRepo.find({
      where: { lesson: { module: { courseId } } },
      relations: ['lesson', 'lesson.module'],
    });
  }

  async getAssignmentsByLesson(lessonId: string) {
    return this.assignmentRepo.find({
      where: { lessonId },
    });
  }

  async createAssignment(data: Partial<Assignment>) {
    const assignment = this.assignmentRepo.create(data);
    return this.assignmentRepo.save(assignment);
  }

  async getAssignment(id: string) {
    const assignment = await this.assignmentRepo.findOne({
      where: { id },
      relations: ['lesson'],
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  async submitAssignment(userId: string, assignmentId: string, fileUrl: string) {
    const assignment = await this.getAssignment(assignmentId);
    if (new Date() > assignment.dueDate) {
      throw new BadRequestException('Assignment due date has passed');
    }

    let submission = await this.submissionRepo.findOne({
      where: { userId, assignmentId },
    });

    if (submission) {
      submission.fileUrl = fileUrl;
      submission.submittedAt = new Date();
    } else {
      submission = this.submissionRepo.create({
        userId,
        assignmentId,
        fileUrl,
      });
    }

    return this.submissionRepo.save(submission);
  }

  async getSubmission(id: string) {
    const submission = await this.submissionRepo.findOne({
      where: { id },
      relations: ['assignment', 'peerReviews', 'peerReviews.reviewer'],
    });
    if (!submission) throw new NotFoundException('Submission not found');
    return submission;
  }

  async getSubmissionByUser(userId: string, assignmentId: string) {
    return this.submissionRepo.findOne({
      where: { userId, assignmentId },
      relations: ['peerReviews', 'peerReviews.reviewer'],
    });
  }

  /**
   * Assigns 3 peer reviewers to each submission for a given assignment.
   * Uses a circular assignment strategy to ensure balance.
   */
  async assignReviewers(assignmentId: string) {
    const submissions = await this.submissionRepo.find({
      where: { assignmentId },
      order: { submittedAt: 'ASC' },
    });

    if (submissions.length < 4) {
      throw new BadRequestException('Not enough submissions to assign 3 reviewers (minimum 4 required)');
    }

    const n = submissions.length;
    const assignments: Partial<PeerReview>[] = [];

    for (let i = 0; i < n; i++) {
      // User i will review submissions (i+1)%n, (i+2)%n, (i+3)%n
      for (let offset = 1; offset <= 3; offset++) {
        const submissionToReview = submissions[(i + offset) % n];
        assignments.push({
          reviewerId: submissions[i].userId,
          submissionId: submissionToReview.id,
        });
      }
    }

    // Clear existing assignments if any (or just skip duplicates)
    // For simplicity, we'll use save which handles updates if we had IDs, 
    // but here we just want to create new ones.
    // Better to check for existence or clear first.
    // Let's clear unsubmitted peer reviews for this assignment's submissions.
    const submissionIds = submissions.map(s => s.id);
    await this.peerReviewRepo.delete({
      submissionId: In(submissionIds),
      isSubmitted: false,
    });

    return this.peerReviewRepo.save(this.peerReviewRepo.create(assignments));
  }

  async submitPeerReview(
    reviewerId: string,
    submissionId: string,
    scores: RubricScore[],
    overallFeedback: string,
  ) {
    const review = await this.peerReviewRepo.findOne({
      where: { reviewerId, submissionId },
    });

    if (!review) {
      throw new NotFoundException('Peer review assignment not found');
    }

    review.scores = scores;
    review.overallFeedback = overallFeedback;
    review.isSubmitted = true;
    await this.peerReviewRepo.save(review);

    // After a review is submitted, check if we can calculate the final grade
    await this.calculateFinalGrade(submissionId);

    return review;
  }

  async calculateFinalGrade(submissionId: string) {
    const submission = await this.submissionRepo.findOne({
      where: { id: submissionId },
      relations: ['peerReviews', 'assignment'],
    });

    if (!submission) return;

    // If instructor has set a grade, that's the final grade (override)
    if (submission.instructorGrade !== null && submission.instructorGrade !== undefined) {
      submission.finalGrade = submission.instructorGrade;
      return this.submissionRepo.save(submission);
    }

    const completedReviews = submission.peerReviews.filter((r) => r.isSubmitted);
    if (completedReviews.length === 0) return;

    // Calculate average score from peer reviews
    let totalPeerScore = 0;
    for (const review of completedReviews) {
      const reviewScore = review.scores.reduce((sum, s) => sum + s.score, 0);
      totalPeerScore += reviewScore;
    }

    const averageScore = totalPeerScore / completedReviews.length;
    submission.finalGrade = averageScore;

    return this.submissionRepo.save(submission);
  }

  async instructorOverride(
    submissionId: string,
    grade: number,
    feedback: string,
  ) {
    const submission = await this.submissionRepo.findOne({ where: { id: submissionId } });
    if (!submission) throw new NotFoundException('Submission not found');

    submission.instructorGrade = grade;
    submission.instructorFeedback = feedback;
    submission.finalGrade = grade;

    return this.submissionRepo.save(submission);
  }

  async getReviewsForUser(userId: string) {
    return this.peerReviewRepo.find({
      where: { reviewerId: userId },
      relations: ['submission', 'submission.assignment'],
    });
  }
}
