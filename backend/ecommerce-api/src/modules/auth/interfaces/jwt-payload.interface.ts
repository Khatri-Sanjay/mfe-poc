export interface JwtPayload {
	sub: string;
	email?: string;
	sessionId: string;
	permissions?: string[];
	tokenUse?: 'user' | 'iframe';
}
