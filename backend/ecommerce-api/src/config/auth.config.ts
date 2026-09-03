import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
	jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
	jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
	refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '30d',
	passwordResetTokenTtl: process.env.PASSWORD_RESET_TOKEN_TTL ?? '15m',
	emailVerificationTokenTtl: process.env.EMAIL_VERIFICATION_TOKEN_TTL ?? '24h',
	iframeClientId: process.env.IFRAME_CLIENT_ID ?? 'commerce-insights-iframe',
	iframeRedirectUri: process.env.IFRAME_REDIRECT_URI ?? 'http://localhost:8000/app/',
	iframeAuthorizationCodeTtl: process.env.IFRAME_AUTHORIZATION_CODE_TTL ?? '60s',
	iframeAccessTokenExpiresIn: process.env.IFRAME_ACCESS_TOKEN_EXPIRES_IN ?? '5m',
	iframeAllowedScopes: (process.env.IFRAME_ALLOWED_SCOPES ?? 'product.read,inventory.read,order.read,review.manage')
		.split(',')
		.map((scope) => scope.trim())
		.filter(Boolean)
}));
