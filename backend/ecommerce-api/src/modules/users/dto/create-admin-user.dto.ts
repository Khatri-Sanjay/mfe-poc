import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
	Matches,
	MaxLength,
	MinLength
} from 'class-validator';
import { UserStatus } from '../enums/user-status.enum';

export class CreateAdminUserDto {
	@ApiProperty({ example: 'Jane' })
	@Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	firstName!: string;

	@ApiProperty({ example: 'Manager' })
	@Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	lastName!: string;

	@ApiProperty({ example: 'jane.manager@example.com' })
	@Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
	@IsEmail()
	@MaxLength(320)
	email!: string;

	@ApiPropertyOptional({ example: '+61400000000' })
	@IsPhoneNumber()
	@IsOptional()
	phone?: string;

	@ApiProperty({ example: 'Strong-password-123' })
	@IsString()
	@MinLength(12)
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
		message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
	})
	password!: string;

	@ApiPropertyOptional({ enum: UserStatus, example: UserStatus.Active })
	@IsEnum(UserStatus)
	@IsOptional()
	status?: UserStatus;

	@ApiPropertyOptional({ example: true })
	@IsBoolean()
	@IsOptional()
	emailVerified?: boolean;

	@ApiPropertyOptional({ example: ['CUSTOMER'] })
	@IsArray()
	@ArrayNotEmpty()
	@IsString({ each: true })
	@MaxLength(80, { each: true })
	@IsOptional()
	roles?: string[];
}
