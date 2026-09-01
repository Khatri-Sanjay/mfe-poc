import { Inject, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import { NOTIFICATION_PROVIDER } from '../../notifications/notifications.module';
import type { NotificationProvider } from '../../notifications/interfaces/notification-provider.interface';
import { User } from '../../users/entities/user.entity';
import { mapUserToResponse } from '../../users/mappers/user.mapper';
import { UsersService } from '../../users/services/users.service';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RegisterDto } from '../dto/register.dto';
import { TokenResponseDto } from '../dto/token-response.dto';
import { AuthSession } from '../entities/auth-session.entity';
import { EmailVerificationToken } from '../entities/email-verification-token.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
		private readonly tokenService: TokenService,
		@InjectRepository(AuthSession)
		private readonly sessionsRepository: Repository<AuthSession>,
		@InjectRepository(PasswordResetToken)
		private readonly passwordResetTokensRepository: Repository<PasswordResetToken>,
		@InjectRepository(EmailVerificationToken)
		private readonly emailVerificationTokensRepository: Repository<EmailVerificationToken>,
		@Inject(NOTIFICATION_PROVIDER)
		private readonly notificationProvider: NotificationProvider
	) {}

	async register(dto: RegisterDto, request: Request): Promise<AuthResponseDto> {
		const user = await this.usersService.createCustomer(dto);
		await this.createAndSendEmailVerification(user);
		return this.createAuthResponse(user, request);
	}

	async login(dto: LoginDto, request: Request): Promise<AuthResponseDto> {
		const user = await this.usersService.findByEmailWithSecrets(dto.email);

		if (!user || !(await this.usersService.verifyPassword(user, dto.password))) {
			throw new UnauthorizedException({
				errorCode: ErrorCode.AuthInvalidCredentials,
				message: 'Invalid email or password'
			});
		}

		await this.usersService.assertCanAuthenticate(user);
		await this.usersService.markLastLogin(user);

		return this.createAuthResponse(user, request);
	}

	async refresh(dto: RefreshTokenDto, request: Request): Promise<TokenResponseDto> {
		const tokenHash = this.tokenService.hashToken(dto.refreshToken);
		const session = await this.sessionsRepository.findOne({
			where: { refreshTokenHash: tokenHash },
			relations: { user: { roles: { permissions: true } } }
		});

		if (!session) {
			throw new UnauthorizedException({
				errorCode: ErrorCode.AuthRefreshTokenInvalid,
				message: 'Refresh token is invalid'
			});
		}

		if (session.revokedAt) {
			throw new UnauthorizedException({
				errorCode: ErrorCode.AuthSessionRevoked,
				message: 'Refresh session has been revoked'
			});
		}

		if (session.expiresAt.getTime() <= Date.now()) {
			throw new UnauthorizedException({
				errorCode: ErrorCode.AuthRefreshTokenExpired,
				message: 'Refresh token has expired'
			});
		}

		await this.usersService.assertCanAuthenticate(session.user);

		const refreshToken = this.tokenService.generateOpaqueToken();
		session.refreshTokenHash = this.tokenService.hashToken(refreshToken);
		session.rotatedAt = new Date();
		session.ipAddress = request.ip ?? null;
		session.userAgent = request.header('user-agent') ?? null;
		await this.sessionsRepository.save(session);

		return this.issueTokens(session.user, session, refreshToken);
	}

	async logout(refreshToken: string): Promise<{ status: string }> {
		const session = await this.sessionsRepository.findOne({
			where: { refreshTokenHash: this.tokenService.hashToken(refreshToken) }
		});

		if (session && !session.revokedAt) {
			session.revokedAt = new Date();
			await this.sessionsRepository.save(session);
		}

		return { status: 'logged_out' };
	}

	async logoutAll(userId: string): Promise<{ status: string }> {
		await this.sessionsRepository
			.createQueryBuilder()
			.update(AuthSession)
			.set({ revokedAt: new Date() })
			.where('user_id = :userId', { userId })
			.andWhere('revoked_at IS NULL')
			.execute();

		return { status: 'logged_out_all' };
	}

	async forgotPassword(email: string): Promise<{ status: string }> {
		const user = await this.usersService.findByEmailWithSecrets(email);

		if (user) {
			const token = this.tokenService.generateOpaqueToken();
			const entity = this.passwordResetTokensRepository.create({
				userId: user.id,
				tokenHash: this.tokenService.hashToken(token),
				expiresAt: this.tokenService.addDuration(this.configService.getOrThrow<string>('auth.passwordResetTokenTtl')),
				usedAt: null
			});
			await this.passwordResetTokensRepository.save(entity);
			await this.notificationProvider.sendPasswordReset(user.email, token);
		}

		return { status: 'password_reset_requested' };
	}

	async resetPassword(token: string, newPassword: string): Promise<{ status: string }> {
		const entity = await this.passwordResetTokensRepository.findOne({
			where: { tokenHash: this.tokenService.hashToken(token) },
			relations: { user: true }
		});

		if (!entity || entity.usedAt || entity.expiresAt.getTime() <= Date.now()) {
			throw new UnauthorizedException({
				errorCode: ErrorCode.AuthRefreshTokenInvalid,
				message: 'Password reset token is invalid'
			});
		}

		await this.usersService.setPassword(entity.user, newPassword);
		entity.usedAt = new Date();
		await this.passwordResetTokensRepository.save(entity);
		await this.logoutAll(entity.userId);

		return { status: 'password_reset' };
	}

	async verifyEmail(token: string): Promise<{ status: string }> {
		const entity = await this.emailVerificationTokensRepository.findOne({
			where: { tokenHash: this.tokenService.hashToken(token) },
			relations: { user: true }
		});

		if (!entity || entity.usedAt || entity.expiresAt.getTime() <= Date.now()) {
			throw new UnauthorizedException({
				errorCode: ErrorCode.AuthRefreshTokenInvalid,
				message: 'Email verification token is invalid'
			});
		}

		await this.usersService.markEmailVerified(entity.user);
		entity.usedAt = new Date();
		await this.emailVerificationTokensRepository.save(entity);

		return { status: 'email_verified' };
	}

	async resendVerification(email: string): Promise<{ status: string }> {
		const user = await this.usersService.findByEmailWithSecrets(email);

		if (!user) {
			throw new NotFoundException({
				errorCode: ErrorCode.UserNotFound,
				message: 'User was not found'
			});
		}

		if (!user.emailVerified) {
			await this.createAndSendEmailVerification(user);
		}

		return { status: 'verification_sent' };
	}

	private async createAuthResponse(user: User, request: Request): Promise<AuthResponseDto> {
		const refreshToken = this.tokenService.generateOpaqueToken();
		const session = this.sessionsRepository.create({
			userId: user.id,
			user,
			refreshTokenHash: this.tokenService.hashToken(refreshToken),
			expiresAt: this.tokenService.addDuration(this.configService.getOrThrow<string>('auth.refreshTokenExpiresIn')),
			revokedAt: null,
			rotatedAt: null,
			ipAddress: request.ip ?? null,
			userAgent: request.header('user-agent') ?? null
		});

		const savedSession = await this.sessionsRepository.save(session);

		return {
			...(await this.issueTokens(user, savedSession, refreshToken)),
			user: mapUserToResponse(user)
		};
	}

	private async issueTokens(user: User, session: AuthSession, refreshToken: string): Promise<TokenResponseDto> {
		const expiresIn = this.configService.getOrThrow<string>('auth.jwtAccessExpiresIn');
		const payload: JwtPayload = {
			sub: user.id,
			email: user.email,
			sessionId: session.id
		};

		return {
			accessToken: await this.jwtService.signAsync(payload),
			refreshToken,
			tokenType: 'Bearer',
			accessTokenExpiresIn: this.tokenService.durationToSeconds(expiresIn),
			refreshTokenExpiresAt: session.expiresAt.toISOString()
		};
	}

	private async createAndSendEmailVerification(user: User): Promise<void> {
		const token = this.tokenService.generateOpaqueToken();
		const entity = this.emailVerificationTokensRepository.create({
			userId: user.id,
			tokenHash: this.tokenService.hashToken(token),
			expiresAt: this.tokenService.addDuration(this.configService.getOrThrow<string>('auth.emailVerificationTokenTtl')),
			usedAt: null
		});
		await this.emailVerificationTokensRepository.save(entity);
		await this.notificationProvider.sendEmailVerification(user.email, token);
	}
}
