import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './controllers/auth.controller';
import { AuthSession } from './entities/auth-session.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
	imports: [
		PassportModule,
		JwtModule.registerAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				secret: configService.getOrThrow<string>('auth.jwtAccessSecret'),
				signOptions: {
					expiresIn: configService.getOrThrow<StringValue>('auth.jwtAccessExpiresIn')
				}
			})
		}),
		TypeOrmModule.forFeature([AuthSession, PasswordResetToken, EmailVerificationToken]),
		UsersModule,
		NotificationsModule
	],
	controllers: [AuthController],
	providers: [AuthService, TokenService, JwtStrategy],
	exports: [AuthService, TokenService]
})
export class AuthModule {}
