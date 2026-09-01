import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
	@ApiProperty({ example: 'a-secure-random-refresh-token' })
	@IsString()
	@MinLength(32)
	refreshToken!: string;
}
