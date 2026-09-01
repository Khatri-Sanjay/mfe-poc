import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';

export const DEFAULT_CUSTOMER_ROLE = 'CUSTOMER';

@Injectable()
export class RolesService {
	constructor(
		@InjectRepository(Role)
		private readonly rolesRepository: Repository<Role>
	) {}

	async findCustomerRole(): Promise<Role> {
		return this.findByNameOrFail(DEFAULT_CUSTOMER_ROLE);
	}

	async findByNamesOrFail(names: string[]): Promise<Role[]> {
		const normalizedNames = names.map((name) => name.trim().toUpperCase());
		const roles = await this.rolesRepository
			.createQueryBuilder('role')
			.leftJoinAndSelect('role.permissions', 'permission')
			.where('role.name IN (:...names)', { names: normalizedNames })
			.getMany();

		if (roles.length !== normalizedNames.length) {
			throw new NotFoundException({
				errorCode: 'RESOURCE_NOT_FOUND',
				message: 'One or more roles were not found'
			});
		}

		return roles;
	}

	async findByNameOrFail(name: string): Promise<Role> {
		const role = await this.rolesRepository.findOne({
			where: { name: name.trim().toUpperCase() },
			relations: { permissions: true }
		});

		if (!role) {
			throw new NotFoundException({
				errorCode: 'RESOURCE_NOT_FOUND',
				message: 'Role was not found'
			});
		}

		return role;
	}
}
