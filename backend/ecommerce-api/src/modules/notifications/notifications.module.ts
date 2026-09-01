import { Module } from '@nestjs/common';
import { DevelopmentNotificationProvider } from './services/development-notification.provider';

export const NOTIFICATION_PROVIDER = Symbol('NOTIFICATION_PROVIDER');

@Module({
	providers: [
		DevelopmentNotificationProvider,
		{
			provide: NOTIFICATION_PROVIDER,
			useExisting: DevelopmentNotificationProvider
		}
	],
	exports: [NOTIFICATION_PROVIDER]
})
export class NotificationsModule {}
