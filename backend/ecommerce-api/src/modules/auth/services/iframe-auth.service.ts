import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { StringValue } from 'ms';
import { createHash, timingSafeEqual } from 'node:crypto';
import { Repository } from 'typeorm';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';
import { IframeAuthorizationRequestDto, IframeTokenRequestDto } from '../dto/iframe-auth.dto';
import { IframeAuthorizationCode } from '../entities/iframe-authorization-code.entity';
import { TokenService } from './token.service';

@Injectable()
export class IframeAuthService {
	constructor(
		private readonly configService: ConfigService,
		private readonly jwtService: JwtService,
		private readonly tokenService: TokenService,
		@InjectRepository(IframeAuthorizationCode)
		private readonly codesRepository: Repository<IframeAuthorizationCode>
	) {}

	async createAuthorizationCode(user: AuthenticatedUser, dto: IframeAuthorizationRequestDto) {
		this.assertClient(dto.clientId, dto.redirectUri);

		const requestedScope = dto.scope?.length ? dto.scope : this.allowedScopes();
		const scope = requestedScope.filter((permission) => this.allowedScopes().includes(permission) && user.permissions.includes(permission));

		if (scope.length === 0) {
			throw new UnauthorizedException({
				errorCode: ErrorCode.Unauthorized,
				message: 'The current user cannot authorize this iframe'
			});
		}

		const code = this.tokenService.generateOpaqueToken();
		await this.codesRepository.save(
			this.codesRepository.create({
				codeHash: this.tokenService.hashToken(code),
				userId: user.id,
				clientId: dto.clientId,
				redirectUri: dto.redirectUri,
				scope,
				codeChallenge: dto.codeChallenge,
				expiresAt: this.tokenService.addDuration(this.configService.getOrThrow<string>('auth.iframeAuthorizationCodeTtl')),
				usedAt: null
			})
		);

		return {
			code,
			expiresIn: this.tokenService.durationToSeconds(this.configService.getOrThrow<string>('auth.iframeAuthorizationCodeTtl')),
			scope
		};
	}

	async exchangeCode(dto: IframeTokenRequestDto) {
		this.assertClient(dto.clientId, dto.redirectUri);

		const authorizationCode = await this.codesRepository.findOne({
			where: { codeHash: this.tokenService.hashToken(dto.code) }
		});

		if (
			!authorizationCode ||
			authorizationCode.usedAt ||
			authorizationCode.expiresAt.getTime() <= Date.now() ||
			authorizationCode.clientId !== dto.clientId ||
			authorizationCode.redirectUri !== dto.redirectUri ||
			!this.verifyCodeChallenge(dto.codeVerifier, authorizationCode.codeChallenge)
		) {
			throw new UnauthorizedException({
				errorCode: ErrorCode.Unauthorized,
				message: 'Iframe authorization code is invalid'
			});
		}

		authorizationCode.usedAt = new Date();
		await this.codesRepository.save(authorizationCode);

		const expiresIn = this.configService.getOrThrow<string>('auth.iframeAccessTokenExpiresIn');
		const payload: JwtPayload = {
			sub: authorizationCode.userId,
			sessionId: `iframe:${authorizationCode.id}`,
			permissions: authorizationCode.scope,
			tokenUse: 'iframe'
		};

		return {
			accessToken: await this.jwtService.signAsync(payload, { expiresIn: expiresIn as StringValue }),
			tokenType: 'Bearer' as const,
			expiresIn: this.tokenService.durationToSeconds(expiresIn),
			scope: authorizationCode.scope
		};
	}

	private assertClient(clientId: string, redirectUri: string): void {
		if (
			clientId !== this.configService.getOrThrow<string>('auth.iframeClientId') ||
			redirectUri !== this.configService.getOrThrow<string>('auth.iframeRedirectUri')
		) {
			throw new BadRequestException({
				errorCode: ErrorCode.ValidationError,
				message: 'Iframe client configuration is invalid'
			});
		}
	}

	private allowedScopes(): string[] {
		return this.configService.getOrThrow<string[]>('auth.iframeAllowedScopes');
	}

	private verifyCodeChallenge(codeVerifier: string, expectedChallenge: string): boolean {
		const actualChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
		const actual = Buffer.from(actualChallenge);
		const expected = Buffer.from(expectedChallenge);
		return actual.length === expected.length && timingSafeEqual(actual, expected);
	}
}
