import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsModule } from '../permissions/permissions.module';
import { Role } from './entities/role.entity';
import { RolesService } from './services/roles.service';

@Module({
	imports: [TypeOrmModule.forFeature([Role]), PermissionsModule],
	providers: [RolesService],
	exports: [RolesService, TypeOrmModule]
})
export class RolesModule {}
