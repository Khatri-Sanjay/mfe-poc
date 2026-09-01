import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { Brackets, Repository } from 'typeorm';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import { createPaginationMeta } from '../../../common/utils/pagination.util';
import { RolesService } from '../../roles/services/roles.service';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { CreateAdminUserDto } from '../dto/create-admin-user.dto';
import { UpdateAdminUserDto } from '../dto/update-admin-user.dto';
import { UpdateCurrentUserDto } from '../dto/update-current-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { User } from '../entities/user.entity';
import { mapUserToResponse } from '../mappers/user.mapper';
import { UserStatus } from '../enums/user-status.enum';
import { AdminUserQueryDto } from '../dto/admin-user-query.dto';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private readonly usersRepository: Repository<User>,
		private readonly rolesService: RolesService
	) {}

	async createCustomer(input: { firstName: string; lastName: string; email: string; phone?: string; password: string }): Promise<User> {
		const email = this.normalizeEmail(input.email);
		const existingUser = await this.usersRepository.findOne({
			where: { email },
			withDeleted: true
		});

		if (existingUser) {
			throw new ConflictException({
				errorCode: ErrorCode.UserEmailExists,
				message: 'Email is already registered'
			});
		}

		const customerRole = await this.rolesService.findCustomerRole();
		const user = this.usersRepository.create({
			firstName: input.firstName,
			lastName: input.lastName,
			email,
			phone: input.phone ?? null,
			passwordHash: await this.hashPassword(input.password),
			status: UserStatus.Active,
			emailVerified: false,
			emailVerifiedAt: null,
			lastLoginAt: null,
			roles: [customerRole]
		});

		return this.usersRepository.save(user);
	}

	async findByEmailWithSecrets(email: string): Promise<User | null> {
		return this.usersRepository.findOne({
			where: { email: this.normalizeEmail(email) },
			relations: { roles: { permissions: true } }
		});
	}

	async findByIdOrFail(id: string): Promise<User> {
		const user = await this.usersRepository.findOne({
			where: { id },
			relations: { roles: { permissions: true } }
		});

		if (!user) {
			throw new NotFoundException({
				errorCode: ErrorCode.UserNotFound,
				message: 'User was not found'
			});
		}

		return user;
	}

	async getCurrentUser(userId: string): Promise<UserResponseDto> {
		return mapUserToResponse(await this.findByIdOrFail(userId));
	}

	async updateCurrentUser(userId: string, dto: UpdateCurrentUserDto): Promise<UserResponseDto> {
		const user = await this.findByIdOrFail(userId);
		Object.assign(user, dto);
		return mapUserToResponse(await this.usersRepository.save(user));
	}

	async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ status: string }> {
		const user = await this.findByIdOrFail(userId);
		const valid = await argon2.verify(user.passwordHash, dto.currentPassword);

		if (!valid) {
			throw new UnauthorizedException({
				errorCode: ErrorCode.AuthInvalidCredentials,
				message: 'Current password is invalid'
			});
		}

		user.passwordHash = await this.hashPassword(dto.newPassword);
		await this.usersRepository.save(user);

		return { status: 'password_changed' };
	}

	async listAdminUsers(query: AdminUserQueryDto): Promise<{
		items: UserResponseDto[];
		meta: ReturnType<typeof createPaginationMeta>;
	}> {
		const page = query.page;
		const limit = query.limit;
		const builder = this.usersRepository
			.createQueryBuilder('user')
			.leftJoinAndSelect('user.roles', 'role')
			.leftJoinAndSelect('role.permissions', 'permission')
			.skip((page - 1) * limit)
			.take(limit)
			.orderBy('user.createdAt', query.sortOrder.toUpperCase() as 'ASC' | 'DESC');

		if (query.status) {
			builder.andWhere('user.status = :status', { status: query.status });
		}

		if (query.search) {
			builder.andWhere(
				new Brackets((qb) => {
					qb.where('user.email ILIKE :search', {
						search: `%${query.search}%`
					})
						.orWhere('user.firstName ILIKE :search', {
							search: `%${query.search}%`
						})
						.orWhere('user.lastName ILIKE :search', {
							search: `%${query.search}%`
						});
				})
			);
		}

		const [users, total] = await builder.getManyAndCount();

		return {
			items: users.map(mapUserToResponse),
			meta: createPaginationMeta(page, limit, total)
		};
	}

	async updateStatus(userId: string, status: UserStatus): Promise<UserResponseDto> {
		const user = await this.findByIdOrFail(userId);
		user.status = status;
		return mapUserToResponse(await this.usersRepository.save(user));
	}

	async updateRoles(userId: string, roleNames: string[]): Promise<UserResponseDto> {
		const user = await this.findByIdOrFail(userId);
		user.roles = await this.rolesService.findByNamesOrFail(roleNames);
		return mapUserToResponse(await this.usersRepository.save(user));
	}

	async createAdminUser(dto: CreateAdminUserDto): Promise<UserResponseDto> {
		const email = this.normalizeEmail(dto.email);
		const existingUser = await this.usersRepository.findOne({
			where: { email },
			withDeleted: true
		});

		if (existingUser) {
			throw new ConflictException({
				errorCode: ErrorCode.UserEmailExists,
				message: 'Email is already registered'
			});
		}

		const roles = dto.roles?.length
			? await this.rolesService.findByNamesOrFail(dto.roles)
			: [await this.rolesService.findCustomerRole()];
		const emailVerified = dto.emailVerified ?? false;
		const user = this.usersRepository.create({
			firstName: dto.firstName,
			lastName: dto.lastName,
			email,
			phone: dto.phone ?? null,
			passwordHash: await this.hashPassword(dto.password),
			status: dto.status ?? UserStatus.Active,
			emailVerified,
			emailVerifiedAt: emailVerified ? new Date() : null,
			lastLoginAt: null,
			roles
		});

		return mapUserToResponse(await this.usersRepository.save(user));
	}

	async updateAdminUser(userId: string, dto: UpdateAdminUserDto): Promise<UserResponseDto> {
		const user = await this.findByIdOrFail(userId);

		if (dto.email) {
			const email = this.normalizeEmail(dto.email);
			const existingUser = await this.usersRepository.findOne({
				where: { email },
				withDeleted: true
			});

			if (existingUser && existingUser.id !== user.id) {
				throw new ConflictException({
					errorCode: ErrorCode.UserEmailExists,
					message: 'Email is already registered'
				});
			}

			user.email = email;
		}

		if (dto.firstName !== undefined) user.firstName = dto.firstName;
		if (dto.lastName !== undefined) user.lastName = dto.lastName;
		if (dto.phone !== undefined) user.phone = dto.phone || null;
		if (dto.status !== undefined) user.status = dto.status;
		if (dto.emailVerified !== undefined) {
			user.emailVerified = dto.emailVerified;
			user.emailVerifiedAt = dto.emailVerified ? (user.emailVerifiedAt ?? new Date()) : null;
		}
		if (dto.roles !== undefined) {
			user.roles = await this.rolesService.findByNamesOrFail(dto.roles);
		}

		return mapUserToResponse(await this.usersRepository.save(user));
	}

	assertCanAuthenticate(user: User): Promise<void> {
		if (user.status !== UserStatus.Active) {
			throw new ForbiddenException({
				errorCode: ErrorCode.UserInactive,
				message: 'User is not active'
			});
		}

		return Promise.resolve();
	}

	async markLastLogin(user: User): Promise<void> {
		user.lastLoginAt = new Date();
		await this.usersRepository.save(user);
	}

	async verifyPassword(user: User, password: string): Promise<boolean> {
		return argon2.verify(user.passwordHash, password);
	}

	async setPassword(user: User, password: string): Promise<User> {
		user.passwordHash = await this.hashPassword(password);
		return this.usersRepository.save(user);
	}

	async markEmailVerified(user: User): Promise<User> {
		user.emailVerified = true;
		user.emailVerifiedAt = new Date();
		return this.usersRepository.save(user);
	}

	normalizeEmail(email: string): string {
		return email.trim().toLowerCase();
	}

	private hashPassword(password: string): Promise<string> {
		return argon2.hash(password, {
			type: argon2.argon2id,
			memoryCost: 65536,
			timeCost: 3,
			parallelism: 1
		});
	}
}
