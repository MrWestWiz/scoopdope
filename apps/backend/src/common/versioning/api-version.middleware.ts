import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import {
  isApiVersion,
  DEFAULT_API_VERSION,
  API_VERSION_HEADER,
} from './api-version.constants';

declare global {
  namespace Express {
    interface Request {
      metadata?: { version: string };
    }
  }
}

@Injectable()
export class ApiVersionMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const pathParts = req.path.split('/').filter(Boolean);

    let version: string | null = null;

    if (pathParts.length > 0 && /^v\d+$/.test(pathParts[0])) {
      version = pathParts[0];
    }

    if (!version) {
      const headerVersion = req.headers[API_VERSION_HEADER.toLowerCase()] as string | undefined;
      if (headerVersion && isApiVersion(headerVersion)) {
        version = headerVersion;
      }
    }

    if (!version) {
      version = DEFAULT_API_VERSION;
    }

    req.metadata = { ...req.metadata, version };

    next();
  }
}
