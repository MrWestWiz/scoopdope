import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ApiVersion,
  X_API_VERSION,
  X_API_DEPRECATED,
  X_API_SUNSET,
  VERSION_MANIFEST,
  DEFAULT_API_VERSION,
  getVersionInfo,
  API_VERSION_HEADER,
} from './api-version.constants';

export const RESOLVED_VERSION_KEY = 'api:resolvedVersion';

@Injectable()
export class ApiVersionInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    const request = context.switchToHttp().getRequest();

    const version: ApiVersion =
      request.metadata?.version ??
      this.reflector.get<ApiVersion>(RESOLVED_VERSION_KEY, context.getHandler()) ??
      DEFAULT_API_VERSION;

    response.setHeader(X_API_VERSION, version);

    const info = getVersionInfo(version);
    if (info.deprecationDate && info.deprecationDate <= new Date()) {
      response.setHeader(X_API_DEPRECATED, `true; deprecation_date=${info.deprecationDate.toISOString()}`);
      if (info.sunsetDate) {
        response.setHeader(X_API_SUNSET, info.sunsetDate.toISOString());
      }
    }

    const acceptVersion = request.headers[API_VERSION_HEADER.toLowerCase()];
    if (acceptVersion && acceptVersion !== version) {
      response.setHeader('Warning', `299 - Requested version "${acceptVersion}" is not available; using "${version}"`);
    }

    return next.handle().pipe(
      map((data: any) => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          return { ...data, apiVersion: version };
        }
        return data;
      })
    );
  }
}
