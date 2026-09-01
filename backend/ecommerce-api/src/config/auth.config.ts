import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
	jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
	jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
	refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '30d',
	passwordResetTokenTtl: process.env.PASSWORD_RESET_TOKEN_TTL ?? '15m',
	emailVerificationTokenTtl: process.env.EMAIL_VERIFICATION_TOKEN_TTL ?? '24h'
}));
