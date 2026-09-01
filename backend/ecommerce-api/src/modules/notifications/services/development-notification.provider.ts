import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationProvider } from '../interfaces/notification-provider.interface';

@Injectable()
export class DevelopmentNotificationProvider implements NotificationProvider {
	private readonly logger = new Logger(DevelopmentNotificationProvider.name);

	constructor(private readonly configService: ConfigService) {}

	sendPasswordReset(email: string, token: string): Promise<void> {
		if (this.configService.get<string>('app.nodeEnv') !== 'production') {
			this.logger.log({ email, token }, 'Development password reset token');
		}

		return Promise.resolve();
	}

	sendEmailVerification(email: string, token: string): Promise<void> {
		if (this.configService.get<string>('app.nodeEnv') !== 'production') {
			this.logger.log({ email, token }, 'Development email verification token');
		}

		return Promise.resolve();
	}
}
