import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ApiVersionMiddleware } from './api-version.middleware';
import { ApiVersionInterceptor } from './api-version.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiVersionInterceptor,
    },
  ],
  exports: [],
})
export class ApiVersionModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(ApiVersionMiddleware).forRoutes('*');
  }
}
