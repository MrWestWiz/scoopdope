import { SetMetadata } from '@nestjs/common';
import { RATE_LIMIT_METADATA, RateLimitConfig } from './rate-limit.constants';

export const RateLimit = (config: Partial<RateLimitConfig> & { limit: number; windowMs: number }) =>
  SetMetadata(RATE_LIMIT_METADATA, config);
