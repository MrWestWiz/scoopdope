import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ── Nested shapes ──────────────────────────────────────────────────────────────

export class PortfolioCourseDto {
  @ApiProperty() courseId: string;
  @ApiProperty() title: string;
  @ApiProperty() description: string;
  @ApiPropertyOptional() thumbnailUrl: string | null;
  @ApiProperty() level: string;
  @ApiProperty() durationHours: number;
  @ApiProperty({ description: 'ISO timestamp when the course was completed' })
  completedAt: string;
}

export class PortfolioCertificateDto {
  @ApiProperty() certificateId: string;
  @ApiProperty() courseId: string;
  @ApiProperty() courseTitle: string;
  @ApiProperty() certificateHash: string;
  @ApiPropertyOptional() stellarTransactionId: string | null;
  @ApiPropertyOptional() pdfUrl: string | null;
  @ApiProperty({ description: 'ISO timestamp when the certificate was issued' })
  issuedAt: string;
}

export class PortfolioBadgeDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() description: string;
  @ApiProperty() iconUrl: string;
  @ApiProperty() awardedAt: string;
}

export class PortfolioStatsDto {
  @ApiProperty({ description: 'Total number of completed courses' })
  totalCourses: number;

  @ApiProperty({ description: 'Total learning hours from completed courses' })
  totalHours: number;

  @ApiProperty({ description: 'Total number of certificates earned' })
  totalCertificates: number;

  @ApiProperty({ description: 'Total number of badges earned' })
  totalBadges: number;
}

// ── Main response shape ────────────────────────────────────────────────────────

export class PortfolioResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() publicSlug: string;
  @ApiProperty() isPublic: boolean;
  @ApiPropertyOptional() displayName: string | null;
  @ApiPropertyOptional() bio: string | null;
  @ApiProperty({ description: 'ISO creation timestamp' }) createdAt: string;
  @ApiProperty({ description: 'ISO last-update timestamp' }) updatedAt: string;

  @ApiProperty({ type: PortfolioStatsDto }) stats: PortfolioStatsDto;
  @ApiProperty({ type: [PortfolioCourseDto] }) completedCourses: PortfolioCourseDto[];
  @ApiProperty({ type: [PortfolioCertificateDto] }) certificates: PortfolioCertificateDto[];
  @ApiProperty({ type: [PortfolioBadgeDto] }) badges: PortfolioBadgeDto[];
}
