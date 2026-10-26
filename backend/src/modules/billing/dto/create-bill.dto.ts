import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class BillItemDto {
  @ApiProperty({ example: 'General Consultation Fee', description: 'Itemized description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 1, description: 'Quantity count' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 50.0, description: 'Per-unit rate' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ example: 50.0, description: 'Total line amount' })
  @IsNumber()
  @Min(0)
  total: number;
}

export class CreateBillDto {
  @ApiProperty({ example: '652f1b2c4f8d2b001a123457', description: 'Patient profile ObjectId' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiPropertyOptional({ example: '652f1b2c4f8d2b001a123459', description: 'Related appointment ObjectId' })
  @IsString()
  @IsOptional()
  appointmentId?: string;

  @ApiProperty({ type: [BillItemDto], description: 'List of invoice line items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillItemDto)
  items: BillItemDto[];

  @ApiProperty({ example: 50.0, description: 'Sum total before taxes and discounts' })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({ example: 5.0, description: 'Applicable tax amount' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  taxAmount?: number = 0;

  @ApiPropertyOptional({ example: 0.0, description: 'Discount applied' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discountAmount?: number = 0;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.CASH, description: 'Payment method' })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod = PaymentMethod.CASH;
}
