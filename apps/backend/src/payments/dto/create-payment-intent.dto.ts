import { IsEnum, IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SUPPORTED_CURRENCIES, SupportedCurrency } from '../currency-conversion.service';

export class CreatePaymentIntentDto {
  @ApiProperty({ example: 'uuid-of-course' })
  @IsUUID()
  courseId: string;

  @ApiProperty({ enum: SUPPORTED_CURRENCIES, example: 'USD' })
  @IsEnum(SUPPORTED_CURRENCIES)
  currency: SupportedCurrency;

  @ApiPropertyOptional({ example: 'SAVE20' })
  @IsOptional()
  @IsString()
  couponCode?: string;
}
