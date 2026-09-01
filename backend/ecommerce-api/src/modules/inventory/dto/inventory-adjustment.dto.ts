import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class InventoryAdjustmentDto {
	@ApiProperty({ example: 10 })
	@IsInt()
	quantityDelta!: number;

	@ApiPropertyOptional({ example: 'Cycle count adjustment' })
	@IsString()
	@MaxLength(500)
	@IsOptional()
	note?: string;
}
