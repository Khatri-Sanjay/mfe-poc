import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_METADATA } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_METADATA, [context.getHandler(), context.getClass()]);

		if (!requiredRoles || requiredRoles.length === 0) {
			return true;
		}

		const request = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
		return requiredRoles.some((role) => request.user.roles.includes(role));
	}
}
