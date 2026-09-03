import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_METADATA } from '../../../common/decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_METADATA, [
			context.getHandler(),
			context.getClass()
		]);

		const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser; originalUrl?: string }>();
		if (!requiredPermissions || requiredPermissions.length === 0) {
			if (request.user?.tokenUse === 'iframe') {
				return request.originalUrl?.includes('/auth/me') ?? false;
			}
			return true;
		}

		return requiredPermissions.every((permission) => request.user?.permissions.includes(permission));
	}
}
