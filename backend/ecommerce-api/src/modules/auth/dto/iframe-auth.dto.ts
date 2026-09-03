import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, IsUrl, Matches } from 'class-validator';

const pkcePattern = /^[A-Za-z0-9._~-]{43,128}$/;

export class IframeAuthorizationRequestDto {
	@ApiProperty({ example: 'commerce-insights-iframe' })
	@IsString()
	clientId!: string;

	@ApiProperty({ example: 'http://localhost:8000/app/' })
	@IsUrl({ require_tld: false })
	redirectUri!: string;

	@ApiProperty({ example: 'xK3p9G2Cp6cD5Il2o0Wc5tij7Mh7g0JQpk4Zl2VeqUE' })
	@Matches(pkcePattern)
	codeChallenge!: string;

	@ApiProperty({ enum: ['S256'] })
	@IsIn(['S256'])
	codeChallengeMethod!: 'S256';

	@ApiPropertyOptional({
		example: ['product.read', 'inventory.read', 'order.read', 'review.manage'],
		type: [String]
	})
	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	scope?: string[];
}

export class IframeTokenRequestDto {
	@ApiProperty({ example: 'commerce-insights-iframe' })
	@IsString()
	clientId!: string;

	@ApiProperty({ example: 'http://localhost:8000/app/' })
	@IsUrl({ require_tld: false })
	redirectUri!: string;

	@ApiProperty({ example: '9d8f7a...' })
	@IsString()
	code!: string;

	@ApiProperty({ example: 'v4.9_Random~PKCE-Verifier-Value-Long-Enough-For-S256' })
	@Matches(pkcePattern)
	codeVerifier!: string;
}

export class IframeAuthorizationResponseDto {
	@ApiProperty()
	code!: string;

	@ApiProperty()
	expiresIn!: number;

	@ApiProperty({ type: [String] })
	scope!: string[];
}

export class IframeTokenResponseDto {
	@ApiProperty()
	accessToken!: string;

	@ApiProperty({ example: 'Bearer' })
	tokenType!: 'Bearer';

	@ApiProperty()
	expiresIn!: number;

	@ApiProperty({ type: [String] })
	scope!: string[];
}
