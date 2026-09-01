import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class PermissionsService {
	constructor(
		@InjectRepository(Permission)
		private readonly permissionsRepository: Repository<Permission>
	) {}

	async findByNames(names: string[]): Promise<Permission[]> {
		if (names.length === 0) {
			return [];
		}

		return this.permissionsRepository.createQueryBuilder('permission').where('permission.name IN (:...names)', { names }).getMany();
	}
}
