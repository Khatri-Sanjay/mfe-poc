import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class VerifyEmailDto {
	@ApiProperty({ example: 'verification-token' })
	@IsString()
	@MinLength(32)
	token!: string;
}
