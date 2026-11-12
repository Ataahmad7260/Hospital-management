import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class RecordPaymentDto {
  @ApiProperty({ example: 75.0, description: 'Payment amount being recorded' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  paidAmount: number;

  @ApiPropertyOptional({
    enum: PaymentMethod,
    description: 'Payment method used to settle invoice',
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}

