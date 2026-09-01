import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PAYMENT_PROVIDER } from './interfaces/payment-provider.interface';
import { PaymentsController } from './controllers/payments.controller';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { PaymentsService } from './services/payments.service';

@Module({
	imports: [TypeOrmModule.forFeature([Payment])],
	controllers: [PaymentsController],
	providers: [
		PaymentsService,
		MockPaymentProvider,
		{
			provide: PAYMENT_PROVIDER,
			inject: [ConfigService, MockPaymentProvider],
			useFactory: (configService: ConfigService, mockPaymentProvider: MockPaymentProvider) => {
				const provider = configService.get<string>('PAYMENT_PROVIDER', 'mock');
				if (provider !== 'mock') {
					throw new Error(`Unsupported PAYMENT_PROVIDER: ${provider}`);
				}
				return mockPaymentProvider;
			}
		}
	],
	exports: [PaymentsService, TypeOrmModule, PAYMENT_PROVIDER]
})
export class PaymentsModule {}
