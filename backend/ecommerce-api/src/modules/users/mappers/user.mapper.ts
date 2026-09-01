import { UserResponseDto } from '../dto/user-response.dto';
import { User } from '../entities/user.entity';

export const mapUserToResponse = (user: User): UserResponseDto => {
	const roles = user.roles ?? [];
	const permissions = [...new Set(roles.flatMap((role) => (role.permissions ?? []).map((permission) => permission.name)))].sort();

	return {
		id: user.id,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email,
		phone: user.phone,
		status: user.status,
		emailVerified: user.emailVerified,
		roles: roles.map((role) => role.name).sort(),
		permissions,
		createdAt: user.createdAt.toISOString()
	};
};
