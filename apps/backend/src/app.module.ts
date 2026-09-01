import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';

// ── Entities ────────────────────────────────────────────────────────────────────

import { User } from './users/user.entity';
import { Course } from './courses/course.entity';
import { Enrollment } from './enrollments/enrollment.entity';
import { Certificate } from './certificates/certificate.entity';
import { Bundle } from './bundles/bundle.entity';
import { BundleCourse } from './bundles/bundle-course.entity';

// ── Modules ─────────────────────────────────────────────────────────────────────

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { CertificatesModule } from './certificates/certificates.module';
import { BundlesModule } from './bundles/bundles.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { LiveSessionsModule } from './live-sessions/live-sessions.module';
import { PaymentsModule } from './payments/payments.module';
import { RewardsModule } from './rewards/rewards.module';
import * as redisStore from 'cache-manager-redis-store';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60 * 1000,
        limit: 100,
      },
    ]),
    TypeOrmModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        entities: [User, Course, Enrollment, Certificate, Bundle, BundleCourse],
        synchronize: configService.get('environment') !== 'production',
        logging: configService.get('environment') !== 'production',
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    CoursesModule,
    EnrollmentsModule,
    CertificatesModule,
    BundlesModule,
    SubscriptionsModule,
    LiveSessionsModule,
    PaymentsModule,
    RewardsModule,
    ApiVersionModule,
    MonitoringModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: GlobalErrorInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}