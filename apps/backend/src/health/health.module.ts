import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import {
  DiskHealthIndicator,
  ElasticsearchHealthIndicator,
  StellarSorobanHealthIndicator,
} from './indicators';

@Module({
  imports: [
    TerminusModule.forRoot({
      errorLogStyle: 'json',
      gracefulShutdownTimeoutMs: 1000,
    }),
    HttpModule,
  ],
  controllers: [HealthController],
  providers: [
    HealthService,
    DiskHealthIndicator,
    ElasticsearchHealthIndicator,
    StellarSorobanHealthIndicator,
  ],
  exports: [HealthService],
})
export class HealthModule {}
