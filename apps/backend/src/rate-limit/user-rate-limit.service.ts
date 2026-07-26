import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RateLimitConfig, UserRateLimitRole, DEFAULT_RATE_LIMITS } from './rate-limit.constants';

@Injectable()
export class UserRateLimitService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  private roleKey(userId: string, ip: string): string {
    return `rate-limit:${userId || ip}`;
  }

  async checkRateLimit(
    userId: string | null,
    ip: string,
    role: UserRateLimitRole,
    overrideConfig?: Partial<RateLimitConfig>,
  ): Promise<boolean> {
    const config = { ...DEFAULT_RATE_LIMITS[role], ...overrideConfig };
    const key = this.roleKey(userId || ip, ip);

    const current = await this.cacheManager.get<number>(key);
    const count = (current || 0) + 1;

    if (count > config.limit) {
      return false;
    }

    await this.cacheManager.set(key, count, config.windowMs);
    return true;
  }

  async getRateLimitStatus(
    userId: string | null,
    ip: string,
    role: UserRateLimitRole,
    overrideConfig?: Partial<RateLimitConfig>,
  ) {
    const config = { ...DEFAULT_RATE_LIMITS[role], ...overrideConfig };
    const key = this.roleKey(userId || ip, ip);
    const current = await this.cacheManager.get<number>(key);
    const count = current || 0;

    return {
      limit: config.limit,
      current: count,
      remaining: Math.max(0, config.limit - count),
      resetTime: new Date(Date.now() + config.windowMs),
    };
  }

  async resetUserLimit(userId: string): Promise<void> {
    const key = `rate-limit:${userId}`;
    await this.cacheManager.del(key);
  }

  resolveRole(userRole: string | undefined, authenticated: boolean): UserRateLimitRole {
    if (!authenticated) return 'guest';
    const normalized = (userRole || 'student').toLowerCase();
    if (normalized === 'admin') return 'admin';
    if (normalized === 'instructor') return 'instructor';
    return 'student';
  }
}
