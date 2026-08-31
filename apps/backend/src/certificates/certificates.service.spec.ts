import { BadRequestException, ConflictException } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { Certificate } from './certificate.entity';
import { Enrollment } from '../enrollments/enrollment.entity';
import { Progress } from '../progress/progress.entity';
import { Lesson } from '../courses/lesson.entity';
import { CourseModule } from '../courses/course-module.entity';

describe('CertificatesService', () => {
  let certificatesRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    remove: jest.Mock;
  };
  let enrollmentsRepository: {
    findOne: jest.Mock;
  };
  let progressRepository: {
    find: jest.Mock;
  };
  let courseModuleRepository: {
    find: jest.Mock;
  };
  let lessonRepository: {
    find: jest.Mock;
  };
  let stellarService: {
    mintCertificateNFT: jest.Mock;
    getTransactionExplorerUrl: jest.Mock;
  };

  beforeEach(() => {
    certificatesRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    };
    enrollmentsRepository = { findOne: jest.fn() };
    progressRepository = { find: jest.fn() };
    courseModuleRepository = { find: jest.fn() };
    lessonRepository = { find: jest.fn() };
    stellarService = {
      mintCertificateNFT: jest.fn(),
      getTransactionExplorerUrl: jest.fn(),
    };
  });

  const buildService = () =>
    new CertificatesService(
      certificatesRepository as any,
      enrollmentsRepository as any,
      stellarService as any,
      progressRepository as any,
      courseModuleRepository as any,
      lessonRepository as any,
    );

  it('rejects issuing a certificate before all course lessons are completed', async () => {
    enrollmentsRepository.findOne.mockResolvedValue({
      userId: 'user-1',
      courseId: 'course-1',
      completedAt: new Date(),
      user: { stellarPublicKey: 'GTEST' },
      course: { title: 'Course 1' },
    });
    certificatesRepository.findOne.mockResolvedValue(null);
    courseModuleRepository.find.mockResolvedValue([{ id: 'module-1' }]);
    lessonRepository.find.mockResolvedValue([{ id: 'lesson-1' }, { id: 'lesson-2' }]);
    progressRepository.find.mockResolvedValue([{ lessonId: 'lesson-1', progressPct: 100 }]);

    const service = buildService();

    await expect(service.issueCertificate('user-1', 'course-1')).rejects.toThrow(BadRequestException);
  });

  it('issues a certificate when all lessons are complete and stores the Stellar hash', async () => {
    const certificate = { id: 'cert-1', userId: 'user-1', courseId: 'course-1', status: 'pending' };

    enrollmentsRepository.findOne.mockResolvedValue({
      userId: 'user-1',
      courseId: 'course-1',
      completedAt: new Date(),
      user: { stellarPublicKey: 'GTEST' },
      course: { title: 'Course 1' },
    });
    certificatesRepository.findOne.mockResolvedValue(null);
    certificatesRepository.create.mockReturnValue(certificate);
    certificatesRepository.save.mockResolvedValue({
      ...certificate,
      status: 'minted',
      certificateHash: 'hash-123',
      stellarTransactionId: 'tx-123',
      issuedAt: new Date(),
    });
    courseModuleRepository.find.mockResolvedValue([{ id: 'module-1' }]);
    lessonRepository.find.mockResolvedValue([{ id: 'lesson-1' }, { id: 'lesson-2' }]);
    progressRepository.find.mockResolvedValue([
      { lessonId: 'lesson-1', progressPct: 100 },
      { lessonId: 'lesson-2', progressPct: 100 },
    ]);
    stellarService.mintCertificateNFT.mockResolvedValue('tx-123');
    stellarService.getTransactionExplorerUrl.mockReturnValue('https://stellar.expert/explorer/testnet/tx/tx-123');

    const service = buildService();
    const result = await service.issueCertificate('user-1', 'course-1');

    expect(stellarService.mintCertificateNFT).toHaveBeenCalledWith(
      'GTEST',
      expect.any(String),
      'Course 1',
    );
    expect(certificatesRepository.save).toHaveBeenCalled();
    expect(result.stellarTransactionId).toBe('tx-123');
  });
});
