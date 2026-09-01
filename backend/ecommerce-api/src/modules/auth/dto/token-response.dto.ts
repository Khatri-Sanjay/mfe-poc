import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
	@ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
	accessToken!: string;

	@ApiProperty({ example: 'a-secure-random-refresh-token' })
	refreshToken!: string;

	@ApiProperty({ example: 'Bearer' })
	tokenType!: 'Bearer';

	@ApiProperty({ example: 900 })
	accessTokenExpiresIn!: number;

	@ApiProperty({ example: '2026-09-24T10:00:00.000Z' })
	refreshTokenExpiresAt!: string;
}
