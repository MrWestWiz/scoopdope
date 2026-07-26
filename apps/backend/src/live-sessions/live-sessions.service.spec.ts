import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LiveSessionsService } from './live-sessions.service';
import { LiveSession, SessionStatus } from './live-session.entity';
import { CohortMember } from '../cohorts/cohort-member.entity';
import { User } from '../users/user.entity';
import { EmailService } from '../email/email.service';
import { UpdateLiveSessionDto } from './live-session.dto';

// ── Constants ─────────────────────────────────────────────────────────────────

const OWNER_ID = 'instructor-owner-uuid';
const OTHER_ID = 'instructor-other-uuid';
const SESSION_ID = 'session-uuid-1';
const COHORT_ID = 'cohort-uuid-1';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSession(overrides: Partial<LiveSession> = {}): LiveSession {
  return {
    id: SESSION_ID,
    cohortId: COHORT_ID,
    instructorId: OWNER_ID,
    title: 'Intro to Soroban',
    description: null,
    scheduledAt: new Date('2026-09-01T10:00:00Z'),
    durationMinutes: 60,
    meetingUrl: 'https://zoom.us/j/123456789',
    status: SessionStatus.SCHEDULED,
    remindersSent: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    cohort: null as any,
    instructor: null as any,
    ...overrides,
  };
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('LiveSessionsService — ownership enforcement', () => {
  let service: LiveSessionsService;

  const sessionRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveSessionsService,
        { provide: getRepositoryToken(LiveSession), useValue: sessionRepo },
        { provide: getRepositoryToken(CohortMember), useValue: { find: jest.fn() } },
        { provide: getRepositoryToken(User), useValue: { findByIds: jest.fn() } },
        { provide: EmailService, useValue: { enqueue: jest.fn() } },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('http://localhost:3001') },
        },
      ],
    }).compile();

    service = module.get(LiveSessionsService);
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('allows the owning instructor to update their own session', async () => {
      const session = makeSession();
      sessionRepo.findOne.mockResolvedValue(session);
      sessionRepo.save.mockResolvedValue({ ...session, title: 'Updated Title' });

      const dto: UpdateLiveSessionDto = { title: 'Updated Title' };
      const result = await service.update(SESSION_ID, OWNER_ID, dto);

      expect(result.title).toBe('Updated Title');
      expect(sessionRepo.save).toHaveBeenCalledTimes(1);
    });

    it('throws ForbiddenException when a different instructor tries to update the session', async () => {
      sessionRepo.findOne.mockResolvedValue(makeSession({ instructorId: OWNER_ID }));

      const dto: UpdateLiveSessionDto = { title: 'Hijacked Title' };

      await expect(service.update(SESSION_ID, OTHER_ID, dto)).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      // The session must not be persisted
      expect(sessionRepo.save).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the session does not exist', async () => {
      sessionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', OWNER_ID, { title: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ── cancel ────────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('allows the owning instructor to cancel their own session', async () => {
      const session = makeSession();
      sessionRepo.findOne.mockResolvedValue(session);
      sessionRepo.save.mockResolvedValue({ ...session, status: SessionStatus.CANCELLED });

      const result = await service.cancel(SESSION_ID, OWNER_ID);

      expect(result.status).toBe(SessionStatus.CANCELLED);
      expect(sessionRepo.save).toHaveBeenCalledTimes(1);
    });

    it('throws ForbiddenException when a different instructor tries to cancel the session', async () => {
      sessionRepo.findOne.mockResolvedValue(makeSession({ instructorId: OWNER_ID }));

      await expect(service.cancel(SESSION_ID, OTHER_ID)).rejects.toBeInstanceOf(
        ForbiddenException,
      );

      expect(sessionRepo.save).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the session does not exist', async () => {
      sessionRepo.findOne.mockResolvedValue(null);

      await expect(service.cancel('nonexistent-id', OWNER_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
