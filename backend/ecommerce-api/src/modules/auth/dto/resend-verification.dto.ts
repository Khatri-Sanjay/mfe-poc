import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class ResendVerificationDto {
	@ApiProperty({ example: 'john@example.com' })
	@Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
	@IsEmail()
	email!: string;
}
