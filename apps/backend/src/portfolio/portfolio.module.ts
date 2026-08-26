import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { Portfolio } from './portfolio.entity';
import { Enrollment } from '../enrollments/enrollment.entity';
import { Certificate } from '../certificates/certificate.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Portfolio, Enrollment, Certificate]),
  ],
  controllers: [PortfolioController],
  providers: [PortfolioService],
  exports: [PortfolioService],
})
export class PortfolioModule {}
