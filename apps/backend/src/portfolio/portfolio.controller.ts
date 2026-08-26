import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { PortfolioResponseDto } from './dto/portfolio-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('portfolio')
@Controller('v1/portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  // ── Authenticated owner endpoints ──────────────────────────────────────────

  /**
   * GET /v1/portfolio/me
   * Returns the authenticated user's full portfolio (creates one if missing).
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the authenticated user's portfolio" })
  @ApiResponse({ status: 200, type: PortfolioResponseDto, description: 'Portfolio data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getMyPortfolio(
    @Request() req: { user: { id: string } },
  ): Promise<PortfolioResponseDto> {
    return this.portfolioService.getMyPortfolio(req.user.id);
  }

  /**
   * PATCH /v1/portfolio/me
   * Updates mutable portfolio fields (displayName, bio, isPublic).
   */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update the authenticated user's portfolio" })
  @ApiResponse({ status: 200, type: PortfolioResponseDto, description: 'Updated portfolio' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async updateMyPortfolio(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdatePortfolioDto,
  ): Promise<PortfolioResponseDto> {
    return this.portfolioService.updatePortfolio(req.user.id, dto);
  }

  /**
   * POST /v1/portfolio/me/regenerate-slug
   * Invalidates the current shareable URL by generating a new random slug.
   */
  @Post('me/regenerate-slug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate the public portfolio URL slug' })
  @ApiResponse({ status: 200, description: 'New slug returned', schema: { example: { publicSlug: 'a1b2c3d4e5f6' } } })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async regenerateSlug(
    @Request() req: { user: { id: string } },
  ): Promise<{ publicSlug: string }> {
    return this.portfolioService.regenerateSlug(req.user.id);
  }

  // ── Admin / cross-user view ────────────────────────────────────────────────

  /**
   * GET /v1/portfolio/user/:userId
   * Admins can fetch any user's full portfolio by userId.
   * Non-admins attempting to access another user's portfolio are rejected.
   */
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get a user's portfolio by userId (admin or self)" })
  @ApiParam({ name: 'userId', description: 'Target user UUID' })
  @ApiResponse({ status: 200, type: PortfolioResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — not admin and not self' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getUserPortfolio(
    @Param('userId') userId: string,
    @Request() req: { user: { id: string; role: string } },
  ): Promise<PortfolioResponseDto> {
    if (req.user.id !== userId && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only view your own portfolio');
    }
    return this.portfolioService.getMyPortfolio(userId);
  }

  // ── Public endpoint ────────────────────────────────────────────────────────

  /**
   * GET /v1/portfolio/public/:slug
   * Publicly accessible — no authentication required.
   * Only returns data if isPublic === true.
   */
  @Get('public/:slug')
  @ApiOperation({
    summary: 'Get a public portfolio by its shareable slug',
    description: 'No authentication required. Returns 404 if the portfolio is private or does not exist.',
  })
  @ApiParam({ name: 'slug', description: 'The portfolio public slug (from the shareable URL)' })
  @ApiResponse({ status: 200, type: PortfolioResponseDto, description: 'Public portfolio' })
  @ApiResponse({ status: 404, description: 'Portfolio not found or is private' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getPublicPortfolio(
    @Param('slug') slug: string,
  ): Promise<PortfolioResponseDto> {
    return this.portfolioService.getPublicPortfolio(slug);
  }
}
