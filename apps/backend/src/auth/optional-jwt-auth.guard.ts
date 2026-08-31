import { Injectable, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Like {@link JwtAuthGuard} but never rejects the request when authentication
 * is missing or invalid. When a valid token is present `request.user` is
 * populated; otherwise it stays undefined and the handler runs anonymously.
 *
 * Use on endpoints that are public but behave differently for authenticated
 * users (e.g. showing a creator their own unpublished content).
 */
@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // Ignore auth failures — the request continues unauthenticated.
    }
    return true;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Never throw: return the user if we have one, otherwise undefined.
    if (user) {
      return super.handleRequest(err, user, info, context);
    }
    return undefined;
  }
}
