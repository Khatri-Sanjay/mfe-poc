import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsPhoneNumber, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
	@ApiProperty({ example: 'John' })
	@Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	firstName!: string;

	@ApiProperty({ example: 'Smith' })
	@Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
	@IsString()
	@MinLength(1)
	@MaxLength(100)
	lastName!: string;

	@ApiProperty({ example: 'john@example.com' })
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
}
