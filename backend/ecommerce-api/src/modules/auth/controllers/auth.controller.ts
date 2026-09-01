import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { UsersService } from '../../users/services/users.service';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginDto } from '../dto/login.dto';
import { LogoutDto } from '../dto/logout.dto';
import { MessageResponseDto } from '../dto/message-response.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RegisterDto } from '../dto/register.dto';
import { ResendVerificationDto } from '../dto/resend-verification.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { TokenResponseDto } from '../dto/token-response.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { AuthService } from '../services/auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly usersService: UsersService
	) {}

	@Public()
	@Post('register')
	@ResponseMessage('User registered successfully')
	@ApiOperation({
		summary: 'Register customer account',
		description: 'Creates a customer account, starts an email verification flow, and returns JWT access and rotating refresh tokens.'
	})
	@ApiBody({ type: RegisterDto })
	@ApiWrappedResponse(AuthResponseDto, 'Registration response')
	@ApiStandardErrors()
	register(@Body() dto: RegisterDto, @Req() request: Request) {
		return this.authService.register(dto, request);
	}

	@Public()
	@Post('login')
	@ResponseMessage('Login successful')
	@ApiOperation({
		summary: 'Login',
		description: 'Authenticates with email and password and creates a refresh-token session.'
	})
	@ApiBody({ type: LoginDto })
	@ApiWrappedResponse(AuthResponseDto, 'Login response')
	@ApiStandardErrors()
	login(@Body() dto: LoginDto, @Req() request: Request) {
		return this.authService.login(dto, request);
	}

	@Public()
	@Post('refresh')
	@ResponseMessage('Token refreshed successfully')
	@ApiOperation({
		summary: 'Rotate refresh token',
		description: 'Validates the current refresh token, rotates it server-side, and returns a new access token and refresh token.'
	})
	@ApiBody({ type: RefreshTokenDto })
	@ApiWrappedResponse(TokenResponseDto, 'Refresh response')
	@ApiStandardErrors()
	refresh(@Body() dto: RefreshTokenDto, @Req() request: Request) {
		return this.authService.refresh(dto, request);
	}

	@Public()
	@Post('logout')
	@ResponseMessage('Logout successful')
	@ApiOperation({
		summary: 'Logout',
		description: 'Revokes the refresh session represented by the refresh token.'
	})
	@ApiBody({ type: LogoutDto })
	@ApiWrappedResponse(MessageResponseDto, 'Logout response')
	@ApiStandardErrors()
	logout(@Body() dto: LogoutDto) {
		return this.authService.logout(dto.refreshToken);
	}

	@Post('logout-all')
	@ApiBearerAuth('bearer')
	@ResponseMessage('All sessions revoked successfully')
	@ApiOperation({
		summary: 'Logout all sessions',
		description: 'Revokes every active refresh session belonging to the user.'
	})
	@ApiWrappedResponse(MessageResponseDto, 'Logout-all response')
	@ApiStandardErrors()
	logoutAll(@CurrentUser() user: AuthenticatedUser) {
		return this.authService.logoutAll(user.id);
	}

	@Get('me')
	@ApiBearerAuth('bearer')
	@ResponseMessage('Current user retrieved successfully')
	@ApiOperation({
		summary: 'Get authenticated user',
		description: 'Returns the authenticated user without sensitive fields.'
	})
	@ApiWrappedResponse(UserResponseDto, 'Current user response')
	@ApiStandardErrors()
	me(@CurrentUser() user: AuthenticatedUser) {
		return this.usersService.getCurrentUser(user.id);
	}

	@Public()
	@Post('forgot-password')
	@ResponseMessage('Password reset requested successfully')
	@ApiOperation({
		summary: 'Request password reset',
		description: 'Starts the password reset flow. The response is intentionally generic to avoid account enumeration.'
	})
	@ApiBody({ type: ForgotPasswordDto })
	@ApiWrappedResponse(MessageResponseDto, 'Password reset request response')
	@ApiStandardErrors()
	forgotPassword(@Body() dto: ForgotPasswordDto) {
		return this.authService.forgotPassword(dto.email);
	}

	@Public()
	@Post('reset-password')
	@ResponseMessage('Password reset successfully')
	@ApiOperation({
		summary: 'Reset password',
		description: 'Uses a one-time password reset token to set a new password.'
	})
	@ApiBody({ type: ResetPasswordDto })
	@ApiWrappedResponse(MessageResponseDto, 'Password reset response')
	@ApiStandardErrors()
	resetPassword(@Body() dto: ResetPasswordDto) {
		return this.authService.resetPassword(dto.token, dto.newPassword);
	}

	@Public()
	@Post('verify-email')
	@ResponseMessage('Email verified successfully')
	@ApiOperation({
		summary: 'Verify email',
		description: 'Verifies an email address using a one-time verification token.'
	})
	@ApiBody({ type: VerifyEmailDto })
	@ApiWrappedResponse(MessageResponseDto, 'Email verification response')
	@ApiStandardErrors()
	verifyEmail(@Body() dto: VerifyEmailDto) {
		return this.authService.verifyEmail(dto.token);
	}

	@Public()
	@Post('resend-verification')
	@ResponseMessage('Verification email requested successfully')
	@ApiOperation({
		summary: 'Resend verification',
		description: 'Creates a new email verification token for an unverified user.'
	})
	@ApiBody({ type: ResendVerificationDto })
	@ApiWrappedResponse(MessageResponseDto, 'Verification resend response')
	@ApiStandardErrors()
	resendVerification(@Body() dto: ResendVerificationDto) {
		return this.authService.resendVerification(dto.email);
	}
}
