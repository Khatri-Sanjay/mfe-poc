import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsPhoneNumber, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCurrentUserDto {
	@ApiPropertyOptional({ example: 'John' })
	@Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	@IsOptional()
	firstName?: string;

	@ApiPropertyOptional({ example: 'Smith' })
	@Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	@IsOptional()
	lastName?: string;

	@ApiPropertyOptional({ example: '+61400000000' })
	@IsPhoneNumber()
	@IsOptional()
	phone?: string;
}
