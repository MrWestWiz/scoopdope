import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdatePortfolioDto {
  @ApiPropertyOptional({
    description: 'Portfolio display name (overrides username)',
    maxLength: 255,
    example: 'Alice the Blockchain Developer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Extended portfolio bio',
    example: 'Passionate about decentralised finance and smart contracts.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({
    description: 'Whether the portfolio is publicly visible via its shareable URL',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
