export interface NotificationProvider {
	sendPasswordReset(email: string, token: string): Promise<void>;
	sendEmailVerification(email: string, token: string): Promise<void>;
}
