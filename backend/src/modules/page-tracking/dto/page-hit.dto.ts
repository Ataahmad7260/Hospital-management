import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PageHitDto {
  @ApiProperty({ description: 'Path or URL of the page being visited', example: '/dashboard' })
  @IsNotEmpty()
  @IsString()
  pageUrl: string;

  @ApiPropertyOptional({ description: 'Human-readable title of the page', example: 'Hospital Dashboard' })
  @IsOptional()
  @IsString()
  pageTitle?: string;

  @ApiPropertyOptional({ description: 'Role of the active user visiting the page', example: 'ADMIN' })
  @IsOptional()
  @IsString()
  userRole?: string;

  @ApiPropertyOptional({ description: 'User ID of the visitor if authenticated', example: '6adf77ce6db62658693e3198' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Referrer URL if any', example: '/patient/overview' })
  @IsOptional()
  @IsString()
  referrer?: string;
}
