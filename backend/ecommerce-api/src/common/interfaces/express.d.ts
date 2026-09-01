declare namespace Express {
	export interface Request {
		id: string;
	}

	export interface User {
		id: string;
		email: string;
		roles: string[];
		permissions: string[];
		sessionId?: string;
	}
}
