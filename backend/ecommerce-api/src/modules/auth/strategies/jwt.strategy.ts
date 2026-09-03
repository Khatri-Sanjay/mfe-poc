import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import { UsersService } from '../../users/services/users.service';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
	constructor(
		configService: ConfigService,
		private readonly usersService: UsersService
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: configService.getOrThrow<string>('auth.jwtAccessSecret')
		});
	}

	async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
		const user = await this.usersService.findByIdOrFail(payload.sub);
		await this.usersService.assertCanAuthenticate(user);
		const userPermissions = [...new Set(user.roles.flatMap((role) => (role.permissions ?? []).map((permission) => permission.name)))];
		const tokenPermissions = payload.permissions?.length
			? payload.permissions.filter((permission) => userPermissions.includes(permission))
			: userPermissions;

		return {
			id: user.id,
			email: user.email,
			sessionId: payload.sessionId,
			roles: user.roles.map((role) => role.name),
			permissions: tokenPermissions,
			tokenUse: payload.tokenUse ?? 'user'
		};
	}

	handleRequest<TUser = AuthenticatedUser>(err: Error | null, user: TUser | false): TUser {
		if (err || !user) {
			throw new UnauthorizedException({
				errorCode: ErrorCode.Unauthorized,
				message: 'Authentication is required'
			});
		}

		return user;
	}
}
