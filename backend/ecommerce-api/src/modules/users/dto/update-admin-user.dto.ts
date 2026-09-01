import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
	ArrayNotEmpty,
	IsArray,
	IsBoolean,
	IsEmail,
	IsEnum,
	IsOptional,
	IsPhoneNumber,
	IsString,
	MaxLength,
	MinLength
} from 'class-validator';
import { UserStatus } from '../enums/user-status.enum';

export class UpdateAdminUserDto {
	@ApiPropertyOptional({ example: 'Jane' })
	@Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	@IsOptional()
	firstName?: string;

	@ApiPropertyOptional({ example: 'Manager' })
	@Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	@IsOptional()
	lastName?: string;

	@ApiPropertyOptional({ example: 'jane.manager@example.com' })
	@Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
	@IsEmail()
	@MaxLength(320)
	@IsOptional()
	email?: string;

	@ApiPropertyOptional({ example: '+61400000000' })
	@IsPhoneNumber()
	@IsOptional()
	phone?: string;

	@ApiPropertyOptional({ enum: UserStatus, example: UserStatus.Active })
	@IsEnum(UserStatus)
	@IsOptional()
	status?: UserStatus;

	@ApiPropertyOptional({ example: true })
	@IsBoolean()
	@IsOptional()
	emailVerified?: boolean;

	@ApiPropertyOptional({ example: ['CUSTOMER', 'ADMIN'] })
	@IsArray()
	@ArrayNotEmpty()
	@IsString({ each: true })
	@MaxLength(80, { each: true })
	@IsOptional()
	roles?: string[];
}
